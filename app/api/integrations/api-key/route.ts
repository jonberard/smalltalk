import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateIntegrationApiKey,
  getIntegrationApiKeyLastFour,
  hashIntegrationApiKey,
} from "@/lib/integration-api-key";
import { supabaseAdmin } from "@/lib/supabase-admin";

/* ═══════════════════════════════════════════════════
   API Key Management
   POST /api/integrations/api-key — Generate or regenerate API key
   Auth: Bearer token (Supabase session)
   ═══════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = generateIntegrationApiKey();
  const apiKeyHash = hashIntegrationApiKey(apiKey);
  const apiKeyLastFour = getIntegrationApiKeyLastFour(apiKey);

  const { error: adminError } = await supabaseAdmin
    .from("businesses")
    .update({
      api_key: null,
      api_key_hash: apiKeyHash,
      api_key_last_four: apiKeyLastFour,
    })
    .eq("id", user.id);

  if (adminError) {
    return NextResponse.json(
      { error: `Failed to save API key: ${adminError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ api_key: apiKey });
}
