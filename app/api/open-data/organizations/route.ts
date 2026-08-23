import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function GET() {
  try {
    const organizations = await supabaseRest<Array<{
      id: string;
      slug: string;
      name: string;
      kind: string;
      description: string | null;
      country_code: string | null;
      website: string | null;
      created_at: string;
      updated_at: string;
    }>>("yuk_public_organizations?select=*&order=name.asc&limit=500");
    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("YUK organizations failed", error);
    return NextResponse.json({ organizations: [], error: "Organization data is temporarily unavailable." }, { status: 503 });
  }
}
