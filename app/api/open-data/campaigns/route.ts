import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const campaigns = await supabaseRest<Array<{
      id: string;
      slug: string;
      title: string;
      description: string | null;
      status: string;
      starts_at: string | null;
      ends_at: string | null;
      organization_id: string | null;
      organization_slug: string | null;
      organization_name: string | null;
      jurisdiction_id: string | null;
      jurisdiction_slug: string | null;
      jurisdiction_name: string | null;
      site_count: number;
      completed_interventions: number;
    }>>("yuk_public_campaigns?select=*&order=starts_at.desc.nullslast&limit=500");
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("YUK campaigns failed", error);
    return NextResponse.json({ campaigns: [], error: "Campaign data is temporarily unavailable." }, { status: 503 });
  }
}
