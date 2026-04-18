import "server-only";

import twilio from "twilio";
import { normalizePhone } from "@/lib/phone";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function sendReviewSms({
  to,
  body,
  businessId,
}: {
  to: string;
  body: string;
  businessId: string;
}): Promise<{
  success: boolean;
  providerSid?: string;
  error?: string;
  skippedReason?: string;
  normalizedPhone?: string;
  attemptedSend: boolean;
}> {
  const normalizedPhone = normalizePhone(to);

  if (!normalizedPhone) {
    return {
      success: false,
      error: "Invalid phone number",
      normalizedPhone: undefined,
      attemptedSend: false,
    };
  }

  const { data: optOutRows, error: optOutError } = await supabaseAdmin
    .from("sms_opt_outs")
    .select("id")
    .eq("phone_number", normalizedPhone)
    .or(`business_id.is.null,business_id.eq.${businessId}`)
    .limit(1);

  if (optOutError) {
    return {
      success: false,
      error: optOutError.message,
      normalizedPhone,
      attemptedSend: false,
    };
  }

  if ((optOutRows ?? []).length > 0) {
    return {
      success: false,
      skippedReason: "opted_out",
      error: "Customer has opted out of SMS reminders",
      normalizedPhone,
      attemptedSend: false,
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
    return {
      success: false,
      error: "Twilio is not configured",
      normalizedPhone,
      attemptedSend: false,
    };
  }

  const client = twilio(accountSid, authToken);

  try {
    const result = await client.messages.create(
      messagingServiceSid
        ? {
            body,
            messagingServiceSid,
            to: normalizedPhone,
          }
        : {
            body,
            from: fromNumber!,
            to: normalizedPhone,
          },
    );

    return {
      success: true,
      providerSid: result.sid,
      normalizedPhone,
      attemptedSend: true,
    };
  } catch (error) {
    const twilioError = error as { code?: number; message?: string };

    if (twilioError.code === 21610) {
      const { error: insertError } = await supabaseAdmin.from("sms_opt_outs").insert({
        phone_number: normalizedPhone,
        business_id: null,
      });

      if (insertError && insertError.code !== "23505") {
        return {
          success: false,
          error: insertError.message,
          normalizedPhone,
          attemptedSend: true,
        };
      }

      return {
        success: false,
        skippedReason: "opted_out",
        error: "Customer has opted out of SMS messages",
        normalizedPhone,
        attemptedSend: true,
      };
    }

    return {
      success: false,
      error: twilioError.message || "Failed to send SMS",
      normalizedPhone,
      attemptedSend: true,
    };
  }
}
