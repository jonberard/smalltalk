import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation");
}
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function normalizePhone(raw: string): string {
  if (raw.startsWith("+")) {
    return "+" + raw.replace(/\D/g, "");
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

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

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } =
    process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.error("[send-sms] Twilio not configured");
    return NextResponse.json(
      { error: "Twilio is not configured" },
      { status: 503 }
    );
  }

  let body: {
    customer_name?: string;
    customer_contact?: string;
    review_link_url?: string;
    business_name?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { customer_name, customer_contact, review_link_url, business_name } =
    body;

  if (!customer_name || !customer_contact || !review_link_url || !business_name) {
    return NextResponse.json(
      { error: "Missing required fields: customer_name, customer_contact, review_link_url, business_name" },
      { status: 400 }
    );
  }

  const digits = customer_contact.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 15) {
    return NextResponse.json(
      { error: "Invalid phone number format" },
      { status: 422 }
    );
  }

  const to = normalizePhone(customer_contact);

  const message =
    `Hi ${customer_name}! How was your experience with ${business_name}? ` +
    `Tap to share - takes 30 seconds, no writing required: ${review_link_url}`;

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const result = await client.messages.create({
      body: message,
      from: TWILIO_FROM_NUMBER,
      to,
    });
    return NextResponse.json({ sid: result.sid, status: result.status });
  } catch (err: unknown) {
    console.error("[send-sms] Twilio error:", err);
    const twilioErr = err as { status?: number; message?: string; code?: number; moreInfo?: string };
    const status = twilioErr.status && twilioErr.status >= 400 ? twilioErr.status : 500;
    return NextResponse.json(
      { error: twilioErr.message || "Failed to send SMS", code: twilioErr.code, moreInfo: twilioErr.moreInfo },
      { status }
    );
  }
}
