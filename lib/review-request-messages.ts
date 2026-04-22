type ReminderKind = "reminder_1" | "reminder_2";

type ReviewRequestTemplateContext = {
  customer_name: string;
  business_name: string;
  review_link: string;
};

export const REVIEW_REQUEST_TEMPLATE_TOKENS = [
  {
    token: "{{customer_name}}",
    help: "Customer name",
  },
  {
    token: "{{business_name}}",
    help: "Business name",
  },
  {
    token: "{{review_link}}",
    help: "Review link",
  },
] as const;

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

function renderReviewRequestTemplate(
  template: string,
  context: ReviewRequestTemplateContext,
) {
  return template.replace(
    /\{\{\s*(customer_name|business_name|review_link)\s*\}\}/gi,
    (_match, token: keyof ReviewRequestTemplateContext) => context[token] ?? "",
  );
}

function normalizeTemplate(template?: string | null) {
  const trimmed = template?.trim();
  return trimmed ? trimmed : null;
}

function ensureReviewLink(rendered: string, reviewLinkUrl: string) {
  return rendered.includes(reviewLinkUrl)
    ? rendered
    : `${rendered.trim()} ${reviewLinkUrl}`.trim();
}

function ensureStopLanguage(rendered: string) {
  return /reply stop to opt out/i.test(rendered)
    ? rendered
    : `${rendered.trim()} (Reply STOP to opt out)`.trim();
}

export function buildInitialSmsMessage({
  customerName,
  businessName,
  reviewLinkUrl,
  smsTemplate,
}: {
  customerName: string;
  businessName: string;
  reviewLinkUrl: string;
  smsTemplate?: string | null;
}) {
  const context: ReviewRequestTemplateContext = {
    customer_name: customerName,
    business_name: businessName,
    review_link: reviewLinkUrl,
  };
  const rendered =
    normalizeTemplate(smsTemplate)
      ? renderReviewRequestTemplate(smsTemplate!, context)
      : `Hi ${customerName} - ${businessName} here. Mind leaving us a quick review? No typing - just tap through a few questions: ${reviewLinkUrl}`;

  return toGsmSafeText(ensureStopLanguage(ensureReviewLink(rendered, reviewLinkUrl)));
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
  emailSubjectTemplate,
  emailIntroTemplate,
}: {
  customerName: string;
  businessName: string;
  reviewLinkUrl: string;
  emailSubjectTemplate?: string | null;
  emailIntroTemplate?: string | null;
}) {
  const preview = buildReviewRequestEmailPreview({
    customerName,
    businessName,
    reviewLinkUrl,
    emailSubjectTemplate,
    emailIntroTemplate,
  });
  const safeCustomerName = escapeHtml(customerName);
  const safeBusinessName = escapeHtml(businessName);
  const safeReviewLinkUrl = escapeHtml(reviewLinkUrl);
  const safeIntro = escapeHtml(preview.intro).replace(/\n/g, "<br />");

  return {
    subject: preview.subject,
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
            ${safeIntro}
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

export function buildReviewRequestEmailPreview({
  customerName,
  businessName,
  reviewLinkUrl,
  emailSubjectTemplate,
  emailIntroTemplate,
}: {
  customerName: string;
  businessName: string;
  reviewLinkUrl: string;
  emailSubjectTemplate?: string | null;
  emailIntroTemplate?: string | null;
}) {
  const context: ReviewRequestTemplateContext = {
    customer_name: customerName,
    business_name: businessName,
    review_link: reviewLinkUrl,
  };
  const subjectTemplate =
    normalizeTemplate(emailSubjectTemplate) ??
    "{{business_name}} would love your feedback";
  const introTemplate =
    normalizeTemplate(emailIntroTemplate) ??
    "{{business_name}} would love your feedback. Tap the button below to share your experience - takes 30 seconds.";

  return {
    subject: renderReviewRequestTemplate(subjectTemplate, context),
    intro: renderReviewRequestTemplate(introTemplate, context),
  };
}
