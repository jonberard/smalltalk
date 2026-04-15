import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation");
}
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function starHtml(rating: number): string {
  const filled = "★";
  const empty = "☆";
  return `<span style="font-size:24px;color:#E05A3D;letter-spacing:2px;">${filled.repeat(rating)}${empty.repeat(5 - rating)}</span>`;
}

function buildEmailHtml({
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
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F9F6F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F6F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(26,46,37,0.08);">

        <!-- Header -->
        <tr><td style="padding:32px 32px 24px;border-bottom:1px solid #EDE8DE;">
          <p style="margin:0 0 12px;font-size:13px;color:#5E7268;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Heads Up</p>
          <h1 style="margin:0;font-size:20px;color:#1A2E25;font-weight:700;line-height:1.3;">
            ${escapeHtml(customerName)} may have posted a ${starRating}-star review
          </h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:24px 32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#1A2E25;line-height:1.5;">
            ${escapeHtml(customerName)} just completed a <strong>${starRating}-star review</strong> and was directed to post it on Google. They copied the text below and the Google review page opened — but we can't confirm they actually submitted it.
          </p>

          <!-- Stars -->
          <div style="margin:0 0 16px;">
            ${starHtml(starRating)}
          </div>

          <!-- Review text -->
          <div style="background-color:#F9F6F0;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="margin:0;font-size:14px;color:#1A2E25;line-height:1.6;white-space:pre-wrap;">${reviewText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>

          <p style="margin:0 0 24px;font-size:14px;color:#5E7268;line-height:1.5;">
            You may want to check Google Reviews so you can respond promptly if it appears.
          </p>

          <!-- Buttons -->
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

        <!-- Footer -->
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

export async function POST(req: NextRequest) {
  const { RESEND_API_KEY } = process.env;

  if (!RESEND_API_KEY) {
    return NextResponse.json({ error: "Resend is not configured" }, { status: 503 });
  }

  let body: {
    session_id?: string;
    review_link_id?: string;
    customer_name?: string;
    star_rating?: number;
    review_text?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { session_id, review_link_id, customer_name, star_rating, review_text } = body;

  if (!session_id || !review_link_id || !customer_name || !star_rating || !review_text) {
    return NextResponse.json(
      { error: "Missing required fields: session_id, review_link_id, customer_name, star_rating, review_text" },
      { status: 400 },
    );
  }

  // Look up business via review_link → business
  const { data: link, error: linkErr } = await supabaseAdmin
    .from("review_links")
    .select("business_id, businesses!inner(owner_email, name, google_review_url)")
    .eq("id", review_link_id)
    .single();

  if (linkErr || !link) {
    return NextResponse.json({ error: "Review link not found" }, { status: 404 });
  }

  const biz = link.businesses as unknown as {
    owner_email: string | null;
    name: string;
    google_review_url: string | null;
  };

  if (!biz.owner_email) {
    return NextResponse.json({ error: "Business has no owner email configured" }, { status: 404 });
  }

  const ownerEmail = biz.owner_email;
  const googleUrl = biz.google_review_url || "https://business.google.com";
  const dashboardUrl = "https://usesmalltalk.com/dashboard";

  const resend = new Resend(RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: "small Talk <hello@usesmalltalk.com>",
      to: ownerEmail,
      subject: `${customer_name} may have posted a ${star_rating}-star review`,
      html: buildEmailHtml({
        customerName: customer_name,
        starRating: star_rating,
        reviewText: review_text,
        googleReviewUrl: googleUrl,
        dashboardUrl,
      }),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
