import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server-side operations");
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceRoleKey);
  }

  return cachedClient;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdmin();
    const value = Reflect.get(client as unknown as object, prop, receiver);

    return typeof value === "function" ? value.bind(client) : value;
  },
}) as SupabaseClient;
