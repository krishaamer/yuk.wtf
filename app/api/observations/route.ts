import { NextResponse } from "next/server";
import type { CreateObservationInput, PersistedObservation } from "@/lib/platform";
import { confidenceNumber, locationPoint } from "@/lib/platform";
import { supabaseRest, uploadEvidence } from "@/lib/supabase-rest";

export const runtime = "nodejs";

function parseImage(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) throw new Error("Unsupported evidence image.");
  return { contentType: match[1], bytes: Buffer.from(match[2], "base64") };
}

function extension(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  let body: CreateObservationInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad observation payload." }, { status: 400 });
  }

  if (!body.clientId || !body.analysis || !body.image || !["discard", "litter"].includes(body.kind)) {
    return NextResponse.json({ error: "Missing observation fields." }, { status: 400 });
  }

  if (body.kind === "litter" && !body.location) {
    return NextResponse.json({ error: "Litter observations need a location." }, { status: 400 });
  }

  try {
    const existing = await supabaseRest<Array<{ id: string; site_id: string | null; public_visibility: PersistedObservation["publicVisibility"] }>>(
      `yuk_observations?client_id=eq.${encodeURIComponent(body.clientId)}&select=id,site_id,public_visibility&limit=1`,
    );

    if (existing[0]) {
      return NextResponse.json({
        observationId: existing[0].id,
        siteId: existing[0].site_id,
        mediaStored: true,
        publicVisibility: existing[0].public_visibility,
      } satisfies PersistedObservation);
    }

    const sources = await supabaseRest<Array<{ id: string }>>(
      "yuk_sources?slug=eq.yuk-web&select=id&limit=1",
    );
    const sourceId = sources[0]?.id;
    if (!sourceId) throw new Error("YUK web source is missing.");

    const confidence = confidenceNumber(body.analysis.confidence);
    const point = locationPoint(body.location);
    const publicVisibility =
      body.kind === "discard" ? "private" : body.publish ? "public" : "aggregate";

    let siteId = body.siteId || null;

    if (body.kind === "litter" && !siteId) {
      const site = await supabaseRest<Array<{ id: string }>>("yuk_sites?select=id", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          title: body.analysis.item,
          status: "suspected",
          location: point,
          location_accuracy_m: Math.round(body.location?.accuracy || 25),
          current_confidence: confidence,
          public_visibility: publicVisibility,
        }),
      });
      siteId = site[0]?.id || null;
    }

    const observations = await supabaseRest<Array<{ id: string }>>("yuk_observations?select=id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        client_id: body.clientId,
        site_id: siteId,
        source_id: sourceId,
        kind: body.kind,
        location: point,
        location_accuracy_m: body.location ? Math.round(body.location.accuracy || 25) : null,
        location_precision: body.location ? "exact" : "none",
        public_visibility: publicVisibility,
        confidence,
        ai_model: process.env.OPENAI_VISION_MODEL || "gpt-5-mini",
        metadata: {
          capture_surface: "monster",
          location_note: body.analysis.locationNote,
          verdict: body.analysis.verdict,
        },
      }),
    });

    const observationId = observations[0]?.id;
    if (!observationId) throw new Error("Observation was not created.");

    await supabaseRest("yuk_classifications", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        observation_id: observationId,
        item: body.analysis.item,
        material: body.analysis.material,
        disposal_bin: body.analysis.bin,
        disposal_destination: body.analysis.destination,
        confidence,
        model: process.env.OPENAI_VISION_MODEL || "gpt-5-mini",
        payload: body.analysis,
      }),
    });

    let mediaStored = false;
    try {
      const { bytes, contentType } = parseImage(body.image);
      const storagePath = `${observationId}/original.${extension(contentType)}`;
      await uploadEvidence(storagePath, bytes, contentType);
      await supabaseRest("yuk_media", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          observation_id: observationId,
          storage_path: storagePath,
          media_type: "image",
          visibility: "private",
          redaction_status: "pending",
        }),
      });
      mediaStored = true;
    } catch (error) {
      console.error("YUK evidence upload failed", error);
    }

    await supabaseRest("yuk_sync_ops", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        idempotency_key: `capture:${body.clientId}`,
        client_id: body.clientId,
        operation: "create",
        entity_type: "observation",
        entity_id: observationId,
        status: "applied",
        applied_at: new Date().toISOString(),
      }),
    });

    return NextResponse.json({
      observationId,
      siteId,
      mediaStored,
      publicVisibility,
    } satisfies PersistedObservation);
  } catch (error) {
    console.error("YUK observation persistence failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "YUK could not save that observation." },
      { status: 503 },
    );
  }
}
