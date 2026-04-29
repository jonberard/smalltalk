import "server-only";

import { buildReminderSmsMessage } from "@/lib/review-request-messages";
import { supabaseAdmin } from "@/lib/supabase-admin";

type QueueReminderDeliveriesInput = {
  reviewLinkId: string;
  businessId: string;
  customerContact: string;
  normalizedPhone: string;
  customerName: string;
  businessName: string;
  reviewLinkUrl: string;
  sentAt: string;
};

export async function queueReminderDeliveries({
  reviewLinkId,
  businessId,
  customerContact,
  normalizedPhone,
  customerName,
  businessName,
  reviewLinkUrl,
  sentAt,
}: QueueReminderDeliveriesInput) {
  const { error } = await supabaseAdmin.from("review_message_deliveries").insert({
    review_link_id: reviewLinkId,
    business_id: businessId,
    channel: "sms",
    kind: "reminder_1",
    status: "pending",
    scheduled_for: new Date(
      new Date(sentAt).getTime() + 6 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    to_address: customerContact,
    normalized_phone: normalizedPhone,
    message_body: buildReminderSmsMessage({
      kind: "reminder_1",
      customerName,
      businessName,
      reviewLinkUrl,
    }),
  });

  if (error && error.code !== "23505") {
    return { error };
  }

  return { error: null };
}
