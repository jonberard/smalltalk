import { NextRequest, NextResponse } from "next/server";
import {
  AI_PROVIDERS,
  getCurrentAiSettings,
  isAiProviderConfigured,
  saveAiSettings,
} from "@/lib/ai-routing";
import { getOrProvisionAdminFromRequest } from "@/lib/admin-auth";
import { getAdminSystemData } from "@/lib/admin-system";
import type { AiProvider, AiRoutingMode } from "@/lib/types";

function isRoutingMode(value: unknown): value is AiRoutingMode {
  return value === "auto" || value === "force";
}

function isAiProvider(value: unknown): value is AiProvider {
  return AI_PROVIDERS.includes(value as AiProvider);
}

export async function GET(req: NextRequest) {
  const auth = await getOrProvisionAdminFromRequest(req);

  if (!auth.ok) {
    return auth.response;
  }

  if (auth.admin.role !== "founder") {
    return NextResponse.json(
      { error: "Founder access required for system controls." },
      { status: 403 },
    );
  }

  try {
    const data = await getAdminSystemData();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load system health";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getOrProvisionAdminFromRequest(req);

  if (!auth.ok) {
    return auth.response;
  }

  if (auth.admin.role !== "founder") {
    return NextResponse.json(
      { error: "Founder access required to change AI routing." },
      { status: 403 },
    );
  }

  let body: {
    routingMode?: AiRoutingMode;
    primaryProvider?: AiProvider;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const current = await getCurrentAiSettings();
  const routingMode = body.routingMode ?? current.routing_mode;
  const primaryProvider = body.primaryProvider ?? current.primary_provider;

  if (!isRoutingMode(routingMode) || !isAiProvider(primaryProvider)) {
    return NextResponse.json(
      { error: "routingMode and primaryProvider must be valid values." },
      { status: 400 },
    );
  }

  if (routingMode === "force" && !isAiProviderConfigured(primaryProvider)) {
    return NextResponse.json(
      {
        error:
          "That provider is missing its API key. Add the key first or keep routing on auto fallback.",
      },
      { status: 400 },
    );
  }

  try {
    await saveAiSettings({
      routingMode,
      primaryProvider,
      updatedBy: auth.user.id,
    });

    const data = await getAdminSystemData();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save AI routing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
