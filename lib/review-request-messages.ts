import "server-only";

type ReminderKind = "reminder_1" | "reminder_2";

function toAscii(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, "\"")
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x0A\x0D\x20-\x7E]/g, "");
}

export function toGsmSafeText(input: string): string {
  return toAscii(input).replace(/\s+/g, " ").trim();
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildInitialSmsMessage({
  customerName,
  businessName,
  reviewLinkUrl,
}: {
  customerName: string;
  businessName: string;
  reviewLinkUrl: string;
}) {
  return toGsmSafeText(
    `Hi ${customerName} - ${businessName} would love your feedback. Share how we did: ${reviewLinkUrl} (Reply STOP to opt out)`,
  );
}

export function buildReminderSmsMessage({
  kind,
  customerName,
  businessName,
  reviewLinkUrl,
}: {
  kind: ReminderKind;
  customerName: string;
  businessName: string;
  reviewLinkUrl: string;
}) {
  const message =
    kind === "reminder_1"
      ? `Hi ${customerName} - quick reminder from ${businessName}. If you have a minute to share how we did: ${reviewLinkUrl} (Reply STOP to opt out)`
      : `Hi ${customerName} - one last note from ${businessName}. Your feedback helps a lot: ${reviewLinkUrl}. This is the last message. (Reply STOP to opt out)`;

  return toGsmSafeText(message);
}

export function buildReviewRequestEmail({
  customerName,
  businessName,
  reviewLinkUrl,
}: {
  customerName: string;
  businessName: string;
  reviewLinkUrl: string;
}) {
  const safeCustomerName = escapeHtml(customerName);
  const safeBusinessName = escapeHtml(businessName);
  const safeReviewLinkUrl = escapeHtml(reviewLinkUrl);

  return {
    subject: `${businessName} would love your feedback`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F9F6F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F6F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(26,46,37,0.08);">
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#1A2E25;font-weight:700;line-height:1.3;">
            Hi ${safeCustomerName},
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#1A2E25;line-height:1.6;">
            <strong>${safeBusinessName}</strong> would love your feedback. Tap the link below to share your experience &mdash; takes 30 seconds:
          </p>
          <a href="${safeReviewLinkUrl}" target="_blank" style="display:inline-block;background-color:#E05A3D;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:99px;">
            Share Your Experience
          </a>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #EDE8DE;">
          <p style="margin:0;font-size:12px;color:#5E7268;text-align:center;">
            Sent on behalf of ${safeBusinessName} via <strong>small Talk</strong>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
