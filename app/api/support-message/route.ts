import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { SupportMessageCategory } from "@/lib/types";

const SUPPORT_CATEGORIES = [
  "setup_help",
  "feature_question",
  "bug_report",
  "suggestion",
  "billing",
] as const;

const CATEGORY_LABELS: Record<SupportMessageCategory, string> = {
  setup_help: "Setup help",
  feature_question: "Feature question",
  bug_report: "Bug report",
  suggestion: "Suggestion",
  billing: "Billing",
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isSupportCategory(value: string): value is SupportMessageCategory {
  return SUPPORT_CATEGORIES.includes(value as SupportMessageCategory);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    category?: string;
    message?: string;
  };

  if (!body.category || !isSupportCategory(body.category)) {
    return NextResponse.json({ error: "Choose a support topic." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();

  if (message.length < 10) {
    return NextResponse.json(
      { error: "Please share a little more detail so I can actually help." },
      { status: 400 },
    );
  }

  if (message.length > 5000) {
    return NextResponse.json(
      { error: "Please keep the message under 5000 characters." },
      { status: 400 },
    );
  }

  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id, name, owner_email")
    .eq("id", user.id)
    .single();

  if (businessError || !business) {
    return NextResponse.json(
      { error: "Could not load your business profile." },
      { status: 404 },
    );
  }

  const categoryLabel = CATEGORY_LABELS[body.category];
  const ownerEmail = business.owner_email ?? user.email ?? null;

  const { data: insertedMessage, error: insertError } = await supabaseAdmin
    .from("support_messages")
    .insert({
      business_id: business.id,
      owner_user_id: user.id,
      owner_email: ownerEmail,
      category: body.category,
      message,
      status: "new",
    })
    .select("id")
    .single();

  if (insertError || !insertedMessage) {
    return NextResponse.json(
      { error: insertError?.message || "Could not save your support message." },
      { status: 500 },
    );
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F9F6F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F6F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(26,46,37,0.08);">
        <tr><td style="padding:28px 32px 22px;border-bottom:1px solid #EDE8DE;">
          <p style="margin:0 0 12px;font-size:12px;color:#5E7268;text-transform:uppercase;letter-spacing:0.14em;font-weight:600;">Owner Support</p>
          <h1 style="margin:0;font-size:22px;color:#1A2E25;font-weight:700;line-height:1.25;">
            ${escapeHtml(business.name)} sent a founder message
          </h1>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <div style="margin:0 0 18px;padding:16px;border:1px solid #EDE8DE;border-radius:12px;background-color:#FCFAF6;">
            <p style="margin:0 0 8px;font-size:12px;color:#5E7268;text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">Details</p>
            <p style="margin:0;font-size:14px;color:#1A2E25;line-height:1.7;">
              <strong>Business:</strong> ${escapeHtml(business.name)}<br />
              <strong>Owner email:</strong> ${escapeHtml(ownerEmail ?? "No email on file")}<br />
              <strong>Category:</strong> ${escapeHtml(categoryLabel)}
            </p>
          </div>
          <div style="background-color:#F9F6F0;border-radius:12px;padding:20px;">
            <p style="margin:0;font-size:14px;color:#1A2E25;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const apiKey = process.env.RESEND_API_KEY;
  const founderEmail = process.env.FOUNDER_SUPPORT_EMAIL || "jon@usesmalltalk.com";
  let founderEmailSentAt: string | null = null;
  let founderEmailError: string | null = null;

  if (apiKey) {
    const resend = new Resend(apiKey);

    try {
      const { error } = await resend.emails.send({
        from: "small Talk <hello@usesmalltalk.com>",
        to: founderEmail,
        replyTo: ownerEmail ?? undefined,
        subject: `[Owner support] ${business.name} — ${categoryLabel}`,
        html,
      });

      if (error) {
        founderEmailError = error.message;
      } else {
        founderEmailSentAt = new Date().toISOString();
      }
    } catch (error) {
      founderEmailError =
        error instanceof Error ? error.message : "Failed to send founder email.";
    }
  } else {
    founderEmailError = "RESEND_API_KEY is not configured.";
  }

  try {
    await supabaseAdmin
      .from("support_messages")
      .update({
        founder_email_sent_at: founderEmailSentAt,
        founder_email_error: founderEmailError,
        updated_at: new Date().toISOString(),
      })
      .eq("id", insertedMessage.id);

    return NextResponse.json({
      success: true,
      emailDelivered: Boolean(founderEmailSentAt),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save support state.",
      },
      { status: 500 },
    );
  }
}
