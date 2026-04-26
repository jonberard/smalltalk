import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReviewEmail } from "@/lib/email-send";
import { normalizePhone } from "@/lib/phone";
import {
  buildInitialSmsMessage,
  buildReviewRequestEmail,
} from "@/lib/review-request-messages";
import { getAppBaseUrl } from "@/lib/app-url";
import {
  decrementTrialIfNeeded,
  isBusinessAllowedToCreateReviewRequest,
  REVIEW_REQUEST_BUSINESS_SELECT,
  type ReviewRequestBusiness,
} from "@/lib/review-request-eligibility";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendReviewSms } from "@/lib/twilio-send";
import { serverCapture } from "@/lib/posthog-server";
import { DEFAULT_BUSINESS_TIME_ZONE, getNextBatchSendAt, sanitizeTimeZone } from "@/lib/quiet-hours";
import { queueReminderDeliveries } from "@/lib/review-message-deliveries";
import { consumeBusinessRateLimit } from "@/lib/business-rate-limit";
import {
  REVIEW_REQUEST_HOURLY_CAP,
  REVIEW_REQUEST_HOURLY_WINDOW_SECONDS,
} from "@/lib/review-request-limits";

type SendRequestBody = {
  customer_name?: string;
  customer_contact?: string;
  service_id?: string;
  employee_id?: string | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function generateCode() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let code = "";

  for (let index = 0; index < 8; index += 1) {
    code += chars[bytes[index] % chars.length];
  }

  return code;
}

async function getAuthenticatedUserId(req: NextRequest) {
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!authHeader) {
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader);

  return user?.id ?? null;
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SendRequestBody;

  try {
    body = (await req.json()) as SendRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const customerName = body.customer_name?.trim() ?? "";
  const customerContact = body.customer_contact?.trim() ?? "";
  const serviceId = body.service_id?.trim() ?? "";
  const employeeId = body.employee_id?.trim() || null;

  if (!customerName || !customerContact || !serviceId) {
    return NextResponse.json(
      { error: "customer_name, customer_contact, and service_id are required" },
      { status: 400 },
    );
  }

  const normalizedPhone = normalizePhone(customerContact);
  const normalizedEmail = customerContact.toLowerCase();
  const channel = normalizedPhone ? "sms" : EMAIL_REGEX.test(normalizedEmail) ? "email" : null;

  if (!channel) {
    return NextResponse.json(
      { error: "Enter a valid mobile number or email address" },
      { status: 400 },
    );
  }

  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select(REVIEW_REQUEST_BUSINESS_SELECT)
    .eq("id", userId)
    .single();

  if (businessError || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (
    !isBusinessAllowedToCreateReviewRequest(
      business as ReviewRequestBusiness,
    )
  ) {
    return NextResponse.json(
      { error: "Your subscription is inactive. Please subscribe to send review links." },
      { status: 403 },
    );
  }

  const { data: service, error: serviceError } = await supabaseAdmin
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("business_id", business.id)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 400 });
  }

  if (employeeId) {
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("business_id", business.id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 400 });
    }
  }

  let rateLimit;

  try {
    rateLimit = await consumeBusinessRateLimit({
      businessId: business.id,
      bucket: "review_request_create",
      maxCount: REVIEW_REQUEST_HOURLY_CAP,
      windowSeconds: REVIEW_REQUEST_HOURLY_WINDOW_SECONDS,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not verify your send limit.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "You’ve hit this hour’s send limit. Please wait a bit before sending more review requests.",
        retry_after_seconds: rateLimit.retryAfterSeconds,
        current_count: rateLimit.currentCount,
      },
      {
        status: 429,
        headers: {
          "Retry-After": `${rateLimit.retryAfterSeconds}`,
        },
      },
    );
  }

  const reminderSequenceEnabled = business.reminder_sequence_enabled ?? true;
  const batchInitialSmsEnabled =
    channel === "sms" && (business.batch_initial_sms_enabled ?? false);
  const batchInitialSmsHour = business.batch_initial_sms_hour ?? 18;
  const businessTimeZone = sanitizeTimeZone(
    business.business_timezone ?? DEFAULT_BUSINESS_TIME_ZONE,
  );
  const normalizedContact = channel === "sms" ? normalizedPhone! : normalizedEmail;

  let reviewLink:
    | {
        id: string;
        unique_code: string;
      }
    | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const uniqueCode = generateCode();
    const { data, error } = await supabaseAdmin
      .from("review_links")
      .insert({
        business_id: business.id,
        service_id: service.id,
        employee_id: employeeId,
        customer_name: customerName,
        customer_contact: normalizedContact,
        unique_code: uniqueCode,
        source: "manual",
        reminder_sequence_enabled: reminderSequenceEnabled,
      })
      .select("id, unique_code")
      .single();

    if (!error && data) {
      reviewLink = data;
      break;
    }

    if (error?.code !== "23505") {
      return NextResponse.json(
        { error: `Failed to create review link: ${error.message}` },
        { status: 500 },
      );
    }
  }

  if (!reviewLink) {
    return NextResponse.json(
      { error: "Could not generate a unique review link. Please try again." },
      { status: 500 },
    );
  }

  const reviewLinkUrl = `${getAppBaseUrl()}/r/${reviewLink.unique_code}`;
  const initialMessageBody =
    channel === "sms"
      ? buildInitialSmsMessage({
          customerName,
          businessName: business.name,
          reviewLinkUrl,
          smsTemplate: business.review_request_sms_template,
        })
      : buildReviewRequestEmail({
          customerName,
          businessName: business.name,
          reviewLinkUrl,
          emailSubjectTemplate: business.review_request_email_subject_template,
          emailIntroTemplate: business.review_request_email_intro_template,
        }).html;

  const scheduledFor =
    batchInitialSmsEnabled
      ? getNextBatchSendAt(
          new Date(),
          businessTimeZone,
          batchInitialSmsHour,
          business.quiet_hours_start ?? 21,
          business.quiet_hours_end ?? 9,
        ).toISOString()
      : new Date().toISOString();

  const { data: initialDelivery, error: initialDeliveryError } = await supabaseAdmin
    .from("review_message_deliveries")
    .insert({
      review_link_id: reviewLink.id,
      business_id: business.id,
      channel,
      kind: "initial",
      status: "pending",
      scheduled_for: scheduledFor,
      to_address: customerContact,
      normalized_phone: normalizedPhone,
      message_body: initialMessageBody,
    })
    .select("id")
    .single();

  if (initialDeliveryError || !initialDelivery) {
    return NextResponse.json(
      { error: `Failed to log delivery: ${initialDeliveryError?.message || "unknown error"}` },
      { status: 500 },
    );
  }

  const sentAt = new Date().toISOString();

  if (channel === "sms") {
    if (batchInitialSmsEnabled) {
      const remainingTrialRequests = await decrementTrialIfNeeded(
        business as ReviewRequestBusiness,
      );

      serverCapture(userId, "review_request_queued", {
        business_id: business.id,
        scheduled_for: scheduledFor,
      });

      return NextResponse.json({
        success: true,
        channel,
        delivery_status: "queued",
        scheduled_for: scheduledFor,
        review_link_id: reviewLink.id,
        review_link_url: reviewLinkUrl,
        unique_code: reviewLink.unique_code,
        remaining_trial_requests: remainingTrialRequests,
      });
    }

    const sendResult = await sendReviewSms({
      to: normalizedPhone!,
      body: initialMessageBody,
      businessId: business.id,
    });

    if (sendResult.success) {
      await supabaseAdmin
        .from("review_message_deliveries")
        .update({
          status: "sent",
          sent_at: sentAt,
          provider_sid: sendResult.providerSid ?? null,
          attempt_count: 1,
        })
        .eq("id", initialDelivery.id);

      await supabaseAdmin
        .from("review_links")
        .update({ initial_sent_at: sentAt })
        .eq("id", reviewLink.id);

      serverCapture(userId, "review_request_sent", { channel, business_id: business.id });

      if (reminderSequenceEnabled) {
        const { error: reminderError } = await queueReminderDeliveries({
          reviewLinkId: reviewLink.id,
          businessId: business.id,
          customerContact,
          normalizedPhone: normalizedPhone!,
          customerName,
          businessName: business.name,
          reviewLinkUrl,
          sentAt,
        });

        if (!reminderError) {
          serverCapture(userId, "reminder_scheduled", { reminder_count: 2, business_id: business.id });
        }
      }

      const remainingTrialRequests = await decrementTrialIfNeeded(
        business as ReviewRequestBusiness,
      );

      return NextResponse.json({
        success: true,
        channel,
        delivery_status: "sent",
        review_link_id: reviewLink.id,
        review_link_url: reviewLinkUrl,
        unique_code: reviewLink.unique_code,
        remaining_trial_requests: remainingTrialRequests,
      });
    }

    if (sendResult.skippedReason) {
      await supabaseAdmin
        .from("review_message_deliveries")
        .update({
          status: "skipped",
          skipped_reason: sendResult.skippedReason,
          last_error: sendResult.error ?? null,
          attempt_count: sendResult.attemptedSend ? 1 : 0,
        })
        .eq("id", initialDelivery.id);

      return NextResponse.json({
        success: false,
        channel,
        delivery_status: "skipped",
        delivery_error: sendResult.error,
        review_link_id: reviewLink.id,
        review_link_url: reviewLinkUrl,
        unique_code: reviewLink.unique_code,
        remaining_trial_requests: business.trial_requests_remaining,
      });
    }

    await supabaseAdmin
      .from("review_message_deliveries")
      .update({
        status: "failed",
        last_error: sendResult.error ?? "Failed to send SMS",
        attempt_count: sendResult.attemptedSend ? 1 : 0,
      })
      .eq("id", initialDelivery.id);

    return NextResponse.json({
      success: false,
      channel,
      delivery_status: "failed",
      delivery_error: sendResult.error ?? "Failed to send SMS",
      review_link_id: reviewLink.id,
      review_link_url: reviewLinkUrl,
      unique_code: reviewLink.unique_code,
      remaining_trial_requests: business.trial_requests_remaining,
    });
  }

  const emailResult = await sendReviewEmail({
    to: normalizedEmail,
    customerName,
    businessName: business.name,
    reviewLinkUrl,
    emailSubjectTemplate: business.review_request_email_subject_template,
    emailIntroTemplate: business.review_request_email_intro_template,
  });

  if (emailResult.success) {
    await supabaseAdmin
      .from("review_message_deliveries")
      .update({
        status: "sent",
        sent_at: sentAt,
        provider_sid: emailResult.providerSid ?? null,
        attempt_count: 1,
      })
      .eq("id", initialDelivery.id);

    await supabaseAdmin
      .from("review_links")
      .update({ initial_sent_at: sentAt })
      .eq("id", reviewLink.id);

    serverCapture(userId, "review_request_sent", { channel, business_id: business.id });
    const remainingTrialRequests = await decrementTrialIfNeeded(
      business as ReviewRequestBusiness,
    );

    return NextResponse.json({
      success: true,
      channel,
      delivery_status: "sent",
      review_link_id: reviewLink.id,
      review_link_url: reviewLinkUrl,
      unique_code: reviewLink.unique_code,
      remaining_trial_requests: remainingTrialRequests,
    });
  }

  await supabaseAdmin
    .from("review_message_deliveries")
    .update({
      status: "failed",
      last_error: emailResult.error ?? "Failed to send email",
      attempt_count: 1,
    })
    .eq("id", initialDelivery.id);

  return NextResponse.json({
    success: false,
    channel,
    delivery_status: "failed",
    delivery_error: emailResult.error ?? "Failed to send email",
    review_link_id: reviewLink.id,
    review_link_url: reviewLinkUrl,
    unique_code: reviewLink.unique_code,
    remaining_trial_requests: business.trial_requests_remaining,
  });
}
