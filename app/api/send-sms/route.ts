import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

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
  console.log("[send-sms] SMS route hit");

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } =
    process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    console.log("[send-sms] Twilio not configured — SID:", !!TWILIO_ACCOUNT_SID, "TOKEN:", !!TWILIO_AUTH_TOKEN, "FROM:", TWILIO_FROM_NUMBER);
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
      { error: `Invalid phone number format (got ${digits.length} digits from "${customer_contact}")` },
      { status: 422 }
    );
  }

  const to = normalizePhone(customer_contact);
  console.log(`[send-sms] Normalized "${customer_contact}" → "${to}"`);

  const message =
    `Hi ${customer_name}! How was your experience with ${business_name}? ` +
    `Tap to share — takes 30 seconds, no writing required: ${review_link_url}`;

  console.log("[send-sms] About to call Twilio:", { from: TWILIO_FROM_NUMBER, to, bodyLength: message.length, body: message });

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const result = await client.messages.create({
      body: message,
      from: TWILIO_FROM_NUMBER,
      to,
    });

    console.log("[send-sms] Twilio success:", { sid: result.sid, status: result.status });
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
