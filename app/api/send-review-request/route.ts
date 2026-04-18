import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReviewEmail } from "@/lib/email-send";
import { normalizePhone } from "@/lib/phone";
import {
  buildInitialSmsMessage,
  buildReminderSmsMessage,
  buildReviewRequestEmail,
} from "@/lib/review-request-messages";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendReviewSms } from "@/lib/twilio-send";
import { serverCapture } from "@/lib/posthog-server";

type SendRequestBody = {
  customer_name?: string;
  customer_contact?: string;
  service_id?: string;
  employee_id?: string | null;
};

type BusinessRow = {
  id: string;
  name: string;
  subscription_status: string;
  trial_requests_remaining: number;
  trial_ends_at: string | null;
  reminder_sequence_enabled: boolean | null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APP_BASE_URL = "https://usesmalltalk.com";

function generateCode() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let code = "";

  for (let index = 0; index < 8; index += 1) {
    code += chars[bytes[index] % chars.length];
  }

  return code;
}

function isBusinessAllowedToSend(business: BusinessRow) {
  if (business.subscription_status === "active" || business.subscription_status === "trialing") {
    return true;
  }

  if (business.subscription_status !== "trial") {
    return false;
  }

  const trialActive = !business.trial_ends_at || new Date(business.trial_ends_at) > new Date();
  return trialActive && business.trial_requests_remaining > 0;
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

async function decrementTrialIfNeeded(business: BusinessRow) {
  if (business.subscription_status !== "trial") {
    return business.trial_requests_remaining;
  }

  const nextRemaining = Math.max(0, business.trial_requests_remaining - 1);

  const { data: updated } = await supabaseAdmin
    .from("businesses")
    .update({ trial_requests_remaining: nextRemaining })
    .eq("id", business.id)
    .eq("trial_requests_remaining", business.trial_requests_remaining)
    .select("trial_requests_remaining")
    .single();

  if (updated) {
    return updated.trial_requests_remaining;
  }

  const { data: current } = await supabaseAdmin
    .from("businesses")
    .select("trial_requests_remaining")
    .eq("id", business.id)
    .single();

  return current?.trial_requests_remaining ?? nextRemaining;
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
    .select("id, name, subscription_status, trial_requests_remaining, trial_ends_at, reminder_sequence_enabled")
    .eq("id", userId)
    .single();

  if (businessError || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (!isBusinessAllowedToSend(business as BusinessRow)) {
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

  const reminderSequenceEnabled = business.reminder_sequence_enabled ?? true;
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

  const reviewLinkUrl = `${APP_BASE_URL}/r/${reviewLink.unique_code}`;
  const initialMessageBody =
    channel === "sms"
      ? buildInitialSmsMessage({
          customerName,
          businessName: business.name,
          reviewLinkUrl,
        })
      : buildReviewRequestEmail({
          customerName,
          businessName: business.name,
          reviewLinkUrl,
        }).html;

  const { data: initialDelivery, error: initialDeliveryError } = await supabaseAdmin
    .from("review_message_deliveries")
    .insert({
      review_link_id: reviewLink.id,
      business_id: business.id,
      channel,
      kind: "initial",
      status: "pending",
      scheduled_for: new Date().toISOString(),
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
        const { error: reminderError } = await supabaseAdmin.from("review_message_deliveries").insert([
          {
            review_link_id: reviewLink.id,
            business_id: business.id,
            channel: "sms",
            kind: "reminder_1",
            status: "pending",
            scheduled_for: new Date(new Date(sentAt).getTime() + 24 * 60 * 60 * 1000).toISOString(),
            to_address: customerContact,
            normalized_phone: normalizedPhone,
            message_body: buildReminderSmsMessage({
              kind: "reminder_1",
              customerName,
              businessName: business.name,
              reviewLinkUrl,
            }),
          },
          {
            review_link_id: reviewLink.id,
            business_id: business.id,
            channel: "sms",
            kind: "reminder_2",
            status: "pending",
            scheduled_for: new Date(new Date(sentAt).getTime() + 72 * 60 * 60 * 1000).toISOString(),
            to_address: customerContact,
            normalized_phone: normalizedPhone,
            message_body: buildReminderSmsMessage({
              kind: "reminder_2",
              customerName,
              businessName: business.name,
              reviewLinkUrl,
            }),
          },
        ]);

        if (!reminderError) {
          serverCapture(userId, "reminder_scheduled", { reminder_count: 2, business_id: business.id });
        }
      }

      const remainingTrialRequests = await decrementTrialIfNeeded(business as BusinessRow);

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
    const remainingTrialRequests = await decrementTrialIfNeeded(business as BusinessRow);

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
