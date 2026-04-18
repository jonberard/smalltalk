import "server-only";

import { Resend } from "resend";
import { buildReviewRequestEmail } from "@/lib/review-request-messages";

export async function sendReviewEmail({
  to,
  customerName,
  businessName,
  reviewLinkUrl,
}: {
  to: string;
  customerName: string;
  businessName: string;
  reviewLinkUrl: string;
}): Promise<{ success: boolean; providerSid?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { success: false, error: "Email delivery isn't set up yet" };
  }

  const resend = new Resend(apiKey);
  const email = buildReviewRequestEmail({
    customerName,
    businessName,
    reviewLinkUrl,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: "small Talk <hello@usesmalltalk.com>",
      to,
      subject: email.subject,
      html: email.html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, providerSid: data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
