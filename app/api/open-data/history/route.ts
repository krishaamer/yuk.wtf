import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const series = await supabaseRest<Array<{
      series_key: string;
      geography_key: string | null;
      period_start: string;
      value: number;
      unit: string;
      metadata: Record<string, unknown>;
      source_slug: string;
      source_name: string;
      source_url: string | null;
    }>>("yuk_public_legacy_series?select=*&order=period_start.asc&limit=5000");
    return NextResponse.json({ series });
  } catch (error) {
    console.error("YUK historical series failed", error);
    return NextResponse.json({ series: [], error: "Historical data is temporarily unavailable." }, { status: 503 });
  }
}
