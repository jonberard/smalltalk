import "server-only";

import { Resend } from "resend";
import { getAppBaseUrl } from "@/lib/app-url";
import { supabaseAdmin } from "@/lib/supabase-admin";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function starHtml(rating: number): string {
  const filled = "★";
  const empty = "☆";

  return `<span style="font-size:24px;color:#E05A3D;letter-spacing:2px;">${filled.repeat(rating)}${empty.repeat(5 - rating)}</span>`;
}

function buildPublicEmailHtml({
  customerName,
  starRating,
  reviewText,
  googleReviewUrl,
  dashboardUrl,
}: {
  customerName: string;
  starRating: number;
  reviewText: string;
  googleReviewUrl: string;
  dashboardUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F9F6F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F6F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(26,46,37,0.08);">
        <tr><td style="padding:32px 32px 24px;border-bottom:1px solid #EDE8DE;">
          <p style="margin:0 0 12px;font-size:13px;color:#5E7268;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Heads Up</p>
          <h1 style="margin:0;font-size:20px;color:#1A2E25;font-weight:700;line-height:1.3;">
            ${escapeHtml(customerName)} may have posted a ${starRating}-star review
          </h1>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#1A2E25;line-height:1.5;">
            ${escapeHtml(customerName)} just completed a <strong>${starRating}-star review</strong> and was directed to post it on Google. They copied the text below and the Google review page opened — but we can't confirm they actually submitted it.
          </p>
          <div style="margin:0 0 16px;">
            ${starHtml(starRating)}
          </div>
          <div style="background-color:#F9F6F0;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="margin:0;font-size:14px;color:#1A2E25;line-height:1.6;white-space:pre-wrap;">${reviewText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <p style="margin:0 0 24px;font-size:14px;color:#5E7268;line-height:1.5;">
            You may want to check Google Reviews so you can respond promptly if it appears.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:8px;" width="50%">
                <a href="${googleReviewUrl}" target="_blank" style="display:block;text-align:center;background-color:#E05A3D;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:12px 16px;border-radius:99px;">
                  Check Google Reviews
                </a>
              </td>
              <td style="padding-left:8px;" width="50%">
                <a href="${dashboardUrl}" target="_blank" style="display:block;text-align:center;background-color:#FFFFFF;color:#1A2E25;font-size:14px;font-weight:600;text-decoration:none;padding:12px 16px;border-radius:99px;border:1px solid #DDE5DF;">
                  View in Dashboard
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #EDE8DE;">
          <p style="margin:0;font-size:12px;color:#5E7268;text-align:center;">
            Sent by <strong>small Talk</strong> — helping you stay on top of customer feedback.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPrivateEmailHtml({
  customerName,
  starRating,
  feedbackText,
  dashboardUrl,
}: {
  customerName: string;
  starRating: number;
  feedbackText: string;
  dashboardUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F9F6F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F6F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(26,46,37,0.08);">
        <tr><td style="padding:32px 32px 24px;border-bottom:1px solid #EDE8DE;">
          <p style="margin:0 0 12px;font-size:13px;color:#5E7268;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Private Feedback</p>
          <h1 style="margin:0;font-size:20px;color:#1A2E25;font-weight:700;line-height:1.3;">
            ${escapeHtml(customerName)} sent you private feedback
          </h1>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#1A2E25;line-height:1.5;">
            ${escapeHtml(customerName)} rated their experience <strong>${starRating} star${starRating !== 1 ? "s" : ""}</strong> and chose to send you feedback directly instead of posting publicly. This is your chance to make it right.
          </p>
          <div style="margin:0 0 16px;">
            ${starHtml(starRating)}
          </div>
          <div style="background-color:#F9F6F0;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="margin:0;font-size:14px;color:#1A2E25;line-height:1.6;white-space:pre-wrap;">${feedbackText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <p style="margin:0 0 24px;font-size:14px;color:#5E7268;line-height:1.5;">
            Reaching out quickly can turn this experience around. You can view this feedback and respond from your dashboard.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="${dashboardUrl}" target="_blank" style="display:inline-block;text-align:center;background-color:#E05A3D;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:99px;">
                  View in Dashboard
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #EDE8DE;">
          <p style="margin:0;font-size:12px;color:#5E7268;text-align:center;">
            Sent by <strong>small Talk</strong> — helping you stay on top of customer feedback.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function loadOwnerNotificationContext(reviewLinkId: string) {
  const { data, error } = await supabaseAdmin
    .from("review_links")
    .select("business_id, businesses!inner(owner_email, name, google_review_url)")
    .eq("id", reviewLinkId)
    .single();

  if (error || !data) {
    return null;
  }

  const businessRecord = Array.isArray(data.businesses)
    ? data.businesses[0]
    : data.businesses;

  if (!businessRecord) {
    return null;
  }

  return businessRecord as {
    owner_email: string | null;
    name: string;
    google_review_url: string | null;
  };
}

export async function sendOwnerNotification({
  reviewLinkId,
  customerName,
  starRating,
  reviewText,
  isPrivate,
}: {
  reviewLinkId: string;
  customerName: string;
  starRating: number;
  reviewText: string;
  isPrivate: boolean;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { success: false, error: "Resend is not configured" };
  }

  const context = await loadOwnerNotificationContext(reviewLinkId);

  if (!context) {
    return { success: false, error: "Review link not found" };
  }

  if (!context.owner_email) {
    return { success: false, error: "Business has no owner email configured" };
  }

  const dashboardUrl = `${getAppBaseUrl()}/dashboard`;
  const resend = new Resend(apiKey);
  const subject = isPrivate
    ? `${customerName} sent you private feedback`
    : `${customerName} may have posted a ${starRating}-star review`;
  const html = isPrivate
    ? buildPrivateEmailHtml({
        customerName,
        starRating,
        feedbackText: reviewText,
        dashboardUrl,
      })
    : buildPublicEmailHtml({
        customerName,
        starRating,
        reviewText,
        googleReviewUrl:
          context.google_review_url || "https://business.google.com",
        dashboardUrl,
      });

  try {
    const { data, error } = await resend.emails.send({
      from: "small Talk <hello@usesmalltalk.com>",
      to: context.owner_email,
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id ?? null };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
