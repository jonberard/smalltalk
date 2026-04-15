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

export async function POST(req: NextRequest) {
  // Authenticate the request
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(authHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify business ownership and active subscription/trial
  const { data: biz, error: bizErr } = await supabaseAdmin
    .from("businesses")
    .select("id, subscription_status, trial_requests_remaining, trial_ends_at")
    .eq("id", user.id)
    .single();

  if (bizErr || !biz) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const status = biz.subscription_status;
  const isActive = status === "active" || status === "trialing";
  const isTrialValid =
    status === "trial" &&
    biz.trial_requests_remaining > 0 &&
    (!biz.trial_ends_at || new Date(biz.trial_ends_at) > new Date());

  if (!isActive && !isTrialValid) {
    return NextResponse.json(
      { error: "Your subscription is inactive. Please subscribe to send review links." },
      { status: 403 },
    );
  }

  const { RESEND_API_KEY } = process.env;

  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email delivery isn't set up yet" },
      { status: 503 },
    );
  }

  let body: {
    customer_name?: string;
    customer_email?: string;
    review_link_url?: string;
    business_name?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { customer_name, customer_email, review_link_url, business_name } = body;

  if (!customer_name || !customer_email || !review_link_url || !business_name) {
    return NextResponse.json(
      { error: "Missing required fields: customer_name, customer_email, review_link_url, business_name" },
      { status: 400 },
    );
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: "small Talk <hello@usesmalltalk.com>",
      to: customer_email,
      subject: `${business_name} would love your feedback`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F9F6F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F6F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(26,46,37,0.08);">
        <tr><td style="padding:32px 32px 24px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#1A2E25;font-weight:700;line-height:1.3;">
            Hi ${customer_name.replace(/</g, "&lt;").replace(/>/g, "&gt;")},
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#1A2E25;line-height:1.6;">
            <strong>${business_name.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong> would love your feedback. Tap the link below to share your experience &mdash; takes 30 seconds:
          </p>
          <a href="${review_link_url}" target="_blank" style="display:inline-block;background-color:#E05A3D;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:99px;">
            Share Your Experience
          </a>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #EDE8DE;">
          <p style="margin:0;font-size:12px;color:#5E7268;text-align:center;">
            Sent on behalf of ${business_name.replace(/</g, "&lt;").replace(/>/g, "&gt;")} via <strong>small Talk</strong>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
