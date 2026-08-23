import { NextResponse } from "next/server";
import type { PublicSite } from "@/lib/platform";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const sites = await supabaseRest<PublicSite[]>(
      "yuk_public_sites?select=*&order=last_observed_at.desc.nullslast&limit=500",
      {},
      "public",
    );
    return NextResponse.json({ sites });
  } catch (error) {
    console.error("YUK public sites failed", error);
    return NextResponse.json({ sites: [], error: "Public site data is temporarily unavailable." }, { status: 503 });
  }
}
