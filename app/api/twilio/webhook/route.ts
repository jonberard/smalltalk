import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { normalizePhone } from "@/lib/phone";
import { supabaseAdmin } from "@/lib/supabase-admin";

const STOP_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const START_KEYWORDS = new Set(["START", "UNSTOP"]);

function twimlResponse(message?: string) {
  const response = new twilio.twiml.MessagingResponse();

  if (message) {
    response.message(message);
  }

  return new NextResponse(response.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers.get("x-twilio-signature");

  if (!authToken || !signature) {
    return NextResponse.json({ error: "Twilio webhook validation failed" }, { status: 403 });
  }

  const formData = await req.formData();
  const params = Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
  ) as Record<string, string>;

  const isValid = twilio.validateRequest(authToken, signature, req.url, params);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid Twilio signature" }, { status: 403 });
  }

  const normalizedPhone = normalizePhone(params.From ?? "");
  const keyword = (params.Body ?? "").trim().toUpperCase();

  if (!normalizedPhone) {
    return twimlResponse();
  }

  if (STOP_KEYWORDS.has(keyword)) {
    const { error: insertError } = await supabaseAdmin.from("sms_opt_outs").insert({
      phone_number: normalizedPhone,
      business_id: null,
    });

    if (insertError && insertError.code !== "23505") {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabaseAdmin
      .from("review_message_deliveries")
      .update({
        status: "skipped",
        skipped_reason: "opted_out",
        claimed_at: null,
      })
      .eq("status", "pending")
      .eq("normalized_phone", normalizedPhone)
      .in("kind", ["reminder_1", "reminder_2"]);

    return twimlResponse("You won't receive more messages from us. Reply START to resubscribe.");
  }

  if (START_KEYWORDS.has(keyword)) {
    await supabaseAdmin
      .from("sms_opt_outs")
      .delete()
      .eq("phone_number", normalizedPhone)
      .is("business_id", null);

    return twimlResponse("You'll receive messages from us again.");
  }

  return twimlResponse();
}
