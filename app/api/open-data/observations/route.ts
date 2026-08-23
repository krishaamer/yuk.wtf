import { NextResponse } from "next/server";
import type { PublicObservation } from "@/lib/platform";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const observations = await supabaseRest<PublicObservation[]>(
      "yuk_public_observations?select=*&order=observed_at.desc&limit=1000",
      {},
      "public",
    );
    return NextResponse.json({ observations });
  } catch (error) {
    console.error("YUK public observations failed", error);
    return NextResponse.json(
      { observations: [], error: "Public observation data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
