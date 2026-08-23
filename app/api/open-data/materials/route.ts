import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const materials = await supabaseRest<Array<{
      material: string;
      observation_count: number;
      site_count: number;
      last_seen_at: string | null;
    }>>("yuk_public_material_stats?select=*&order=observation_count.desc&limit=250");
    return NextResponse.json({ materials });
  } catch (error) {
    console.error("YUK material stats failed", error);
    return NextResponse.json({ materials: [], error: "Material data is temporarily unavailable." }, { status: 503 });
  }
}
