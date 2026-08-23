import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lng"));
  const radius = Math.min(50000, Math.max(50, Number(request.nextUrl.searchParams.get("radius")) || 5000));
  const limit = Math.min(250, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 100));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Valid lat/lng are required." }, { status: 400 });
  }

  try {
    const sites = await supabaseRest<Array<{
      id: string;
      title: string | null;
      status: string;
      latitude: number;
      longitude: number;
      location_accuracy_m: number;
      current_confidence: number | null;
      first_observed_at: string | null;
      last_observed_at: string | null;
      distance_m: number;
    }>>("rpc/yuk_public_nearby_sites", {
      method: "POST",
      body: JSON.stringify({
        p_longitude: longitude,
        p_latitude: latitude,
        p_radius_m: radius,
        p_limit: limit,
      }),
    });

    return NextResponse.json({ sites, radiusM: radius });
  } catch (error) {
    console.error("YUK nearby lookup failed", error);
    return NextResponse.json({ sites: [], error: "Nearby Sites are temporarily unavailable." }, { status: 503 });
  }
}
