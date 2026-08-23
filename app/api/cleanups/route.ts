import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export const runtime = "nodejs";

type CleanupInput = {
  clientId?: string;
  siteId?: string;
  note?: string;
  startedAt?: string;
  endedAt?: string;
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
    const prior = await supabaseRest<Array<{ entity_id: string | null }>>(
      `yuk_sync_ops?idempotency_key=eq.${encodeURIComponent(`cleanup:${body.clientId}`)}&select=entity_id&limit=1`,
    );
    if (prior[0]?.entity_id) {
      return NextResponse.json({ interventionId: prior[0].entity_id, duplicate: true });
    }

    const sites = await supabaseRest<Array<{ id: string }>>(
      `yuk_sites?id=eq.${encodeURIComponent(body.siteId)}&select=id&limit=1`,
    );
    if (!sites[0]) return NextResponse.json({ error: "Site not found." }, { status: 404 });

    const sources = await supabaseRest<Array<{ id: string }>>("yuk_sources?slug=eq.yuk-web&select=id&limit=1");
    if (!sources[0]) throw new Error("YUK web source is missing.");

    const observations = await supabaseRest<Array<{ id: string }>>("yuk_observations?select=id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        client_id: body.clientId,
        site_id: body.siteId,
        source_id: sources[0].id,
        kind: "cleanup",
        observed_at: body.endedAt || new Date().toISOString(),
        public_visibility: "aggregate",
        confidence: 0.75,
        notes: body.note?.trim().slice(0, 2000) || null,
        metadata: { capture_surface: "cleanup" },
      }),
    });
    const observationId = observations[0]?.id;
    if (!observationId) throw new Error("Cleanup observation was not created.");

    const interventions = await supabaseRest<Array<{ id: string }>>("yuk_interventions?select=id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        kind: "cleanup",
        title: "Cleanup reported",
        status: "completed",
        starts_at: body.startedAt || null,
        ends_at: body.endedAt || new Date().toISOString(),
        public_visibility: "aggregate",
        metadata: { note: body.note?.trim().slice(0, 2000) || null },
      }),
    });
    const interventionId = interventions[0]?.id;
    if (!interventionId) throw new Error("Cleanup intervention was not created.");

    await Promise.all([
      supabaseRest("yuk_intervention_sites", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ intervention_id: interventionId, site_id: body.siteId }),
      }),
      supabaseRest("yuk_verifications", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          site_id: body.siteId,
          observation_id: observationId,
          assertion: "cleaned",
          confidence: 0.75,
          notes: body.note?.trim().slice(0, 2000) || null,
        }),
      }),
      supabaseRest("yuk_sync_ops", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({
          idempotency_key: `cleanup:${body.clientId}`,
          client_id: body.clientId,
          operation: "create",
          entity_type: "intervention",
          entity_id: interventionId,
          status: "applied",
          applied_at: new Date().toISOString(),
        }),
      }),
    ]);

    return NextResponse.json({
      interventionId,
      observationId,
      message: "Cleanup recorded as evidence. It does not erase the site or automatically claim independent verification.",
    });
  } catch (error) {
    console.error("YUK cleanup persistence failed", error);
    return NextResponse.json({ error: "YUK could not save that cleanup." }, { status: 503 });
  }
}
