import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
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

  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google Places API key not configured" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query.trim());
  url.searchParams.set("type", "establishment");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("Places API error:", data.status, data.error_message);
    return NextResponse.json({ error: "Google Places search failed" }, { status: 502 });
  }

  const results = (data.results || []).slice(0, 5).map((place: Record<string, unknown>) => ({
    place_id: place.place_id as string,
    name: place.name as string,
    address: place.formatted_address as string,
    rating: (place.rating as number) || null,
    user_ratings_total: (place.user_ratings_total as number) || 0,
  }));

  return NextResponse.json({ results });
}
