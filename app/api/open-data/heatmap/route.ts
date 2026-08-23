import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const cells = await supabaseRest<Array<{
      latitude: number;
      longitude: number;
      observation_count: number;
      site_count: number;
      last_seen_at: string | null;
    }>>("yuk_public_heatmap?select=*&order=observation_count.desc&limit=2000");
    return NextResponse.json({ cells });
  } catch (error) {
    console.error("YUK heatmap failed", error);
    return NextResponse.json({ cells: [], error: "Heatmap data is temporarily unavailable." }, { status: 503 });
  }
}
