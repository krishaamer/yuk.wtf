import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const brands = await supabaseRest<Array<{
      brand: string;
      observation_count: number;
      site_count: number;
      last_seen_at: string | null;
    }>>("yuk_public_brand_stats?select=*&order=observation_count.desc&limit=250");
    return NextResponse.json({ brands });
  } catch (error) {
    console.error("YUK brand stats failed", error);
    return NextResponse.json({ brands: [], error: "Brand data is temporarily unavailable." }, { status: 503 });
  }
}
