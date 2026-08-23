import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export const runtime = "nodejs";

type CleanupInput = {
  clientId?: string;
  siteId?: string;
  campaignId?: string;
  note?: string;
  startedAt?: string;
  endedAt?: string;
};

type CleanupResult = {
  intervention_id: string;
  observation_id: string;
  created: boolean;
};

export async function POST(request: Request) {
  let body: CleanupInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad cleanup payload." }, { status: 400 });
  }

  if (!body.clientId || !body.siteId) {
    return NextResponse.json({ error: "Cleanup needs a site and client ID." }, { status: 400 });
  }

  try {
    const sources = await supabaseRest<Array<{ id: string }>>("yuk_sources?slug=eq.yuk-web&select=id&limit=1");
    if (!sources[0]) throw new Error("YUK web source is missing.");

    const rows = await supabaseRest<CleanupResult[]>("rpc/yuk_record_cleanup", {
      method: "POST",
      body: JSON.stringify({
        p_client_id: body.clientId,
        p_site_id: body.siteId,
        p_source_id: sources[0].id,
        p_campaign_id: body.campaignId || null,
        p_note: body.note?.trim().slice(0, 2000) || null,
        p_started_at: body.startedAt || null,
        p_ended_at: body.endedAt || null,
      }),
    });

    const result = rows[0];
    if (!result?.intervention_id || !result.observation_id) throw new Error("Cleanup was not created.");

    return NextResponse.json({
      interventionId: result.intervention_id,
      observationId: result.observation_id,
      duplicate: !result.created,
      message: body.campaignId
        ? "Cleanup recorded as evidence and campaign progress updated. Independent verification can later confirm whether the Site remains clean."
        : "Cleanup recorded as evidence. It does not erase the Site or automatically claim independent verification.",
    });
  } catch (error) {
    console.error("YUK cleanup persistence failed", error);
    return NextResponse.json({ error: "YUK could not save that cleanup." }, { status: 503 });
  }
}
