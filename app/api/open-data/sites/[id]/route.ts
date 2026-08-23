import { NextResponse } from "next/server";
import type { PublicObservation, PublicSite } from "@/lib/platform";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [sites, observations] = await Promise.all([
      supabaseRest<PublicSite[]>(
        `yuk_public_sites?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
      ),
      supabaseRest<PublicObservation[]>(
        `yuk_public_observations?site_id=eq.${encodeURIComponent(id)}&select=*&order=observed_at.desc&limit=500`,
      ),
    ]);

    const site = sites[0];
    if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });

    return NextResponse.json({ site, observations });
  } catch (error) {
    console.error("YUK Site detail failed", error);
    return NextResponse.json({ error: "Site data is temporarily unavailable." }, { status: 503 });
  }
}
