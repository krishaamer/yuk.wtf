import { NextResponse } from "next/server";
import type { CreateObservationInput, PersistedObservation } from "@/lib/platform";
import { confidenceNumber } from "@/lib/platform";
import { supabaseRest, uploadEvidence } from "@/lib/supabase-rest";

export const runtime = "nodejs";

type SiteCandidate = {
  site_id: string;
  title: string | null;
  status: string;
  distance_m: number;
  last_observed_at: string | null;
  latest_item: string | null;
  latest_material: string | null;
};

type ScoredCandidate = SiteCandidate & {
  itemSimilarity: number;
  materialSimilarity: number;
  score: number;
};

type IngestResult = {
  observation_id: string;
  resolved_site_id: string | null;
  created: boolean;
};

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

function tokens(value: string | null | undefined) {
  return new Set(
    (value || "")
      .toLocaleLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 1),
  );
}

function similarity(left: string | null | undefined, right: string | null | undefined) {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap += 1;
  const union = new Set([...a, ...b]).size;
  return union ? overlap / union : 0;
}

function scoreCandidate(candidate: SiteCandidate, body: CreateObservationInput): ScoredCandidate {
  const itemSimilarity = similarity(body.analysis.item, candidate.latest_item || candidate.title);
  const materialSimilarity = similarity(body.analysis.material, candidate.latest_material);
  const distance = Number(candidate.distance_m) || 0;
  const distanceScore = Math.max(0, 1 - distance / 120);
  const score = Math.min(1, distanceScore * 0.55 + itemSimilarity * 0.3 + materialSimilarity * 0.15);
  return { ...candidate, distance_m: distance, itemSimilarity, materialSimilarity, score };
}

function autoMatch(candidates: ScoredCandidate[]) {
  const first = candidates[0];
  if (!first) return null;
  if (first.distance_m <= 5) return first;
  if (first.distance_m <= 15 && (first.itemSimilarity >= 0.25 || first.materialSimilarity >= 0.25)) return first;
  if (first.distance_m <= 30 && first.itemSimilarity >= 0.5 && first.materialSimilarity >= 0.25) return first;
  return null;
}

async function nearbyCandidates(body: CreateObservationInput) {
  if (body.kind !== "litter" || !body.location) return [] as ScoredCandidate[];
  const candidates = await supabaseRest<SiteCandidate[]>("rpc/yuk_nearby_site_candidates", {
    method: "POST",
    body: JSON.stringify({
      p_longitude: body.location.longitude,
      p_latitude: body.location.latitude,
      p_radius_m: 120,
      p_limit: 5,
    }),
  });
  return candidates.map((candidate) => scoreCandidate(candidate, body));
}

async function ensureEvidence(observationId: string, image: string) {
  const existing = await supabaseRest<Array<{ id: string }>>(
    `yuk_media?observation_id=eq.${encodeURIComponent(observationId)}&select=id&limit=1`,
  );
  if (existing[0]) return true;

  try {
    const { bytes, contentType } = parseImage(image);
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
    return true;
  } catch (error) {
    console.error("YUK evidence upload failed", error);
    return false;
  }
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
    const sources = await supabaseRest<Array<{ id: string }>>(
      "yuk_sources?slug=eq.yuk-web&select=id&limit=1",
    );
    const sourceId = sources[0]?.id;
    if (!sourceId) throw new Error("YUK web source is missing.");

    const confidence = confidenceNumber(body.analysis.confidence);
    const publicVisibility =
      body.kind === "discard" ? "private" : body.publish ? "public" : "aggregate";

    let chosenSiteId = body.siteId || null;
    let scoredCandidates: ScoredCandidate[] = [];
    let siteResolution: PersistedObservation["siteResolution"] = body.kind === "discard" ? "none" : "new";

    if (body.kind === "litter" && !chosenSiteId) {
      scoredCandidates = await nearbyCandidates(body);
      const matched = autoMatch(scoredCandidates);
      if (matched) {
        chosenSiteId = matched.site_id;
        siteResolution = "matched";
      } else if (scoredCandidates.length) {
        siteResolution = "proposed";
      }
    } else if (chosenSiteId) {
      siteResolution = "matched";
    }

    const model = process.env.OPENAI_VISION_MODEL || "gpt-5-mini";
    const rows = await supabaseRest<IngestResult[]>("rpc/yuk_ingest_observation", {
      method: "POST",
      body: JSON.stringify({
        p_client_id: body.clientId,
        p_kind: body.kind,
        p_source_id: sourceId,
        p_site_id: chosenSiteId,
        p_title: body.analysis.item,
        p_longitude: body.location?.longitude ?? null,
        p_latitude: body.location?.latitude ?? null,
        p_location_accuracy_m: body.location ? Math.round(body.location.accuracy || 25) : null,
        p_public_visibility: publicVisibility,
        p_confidence: confidence,
        p_ai_model: model,
        p_observation_metadata: {
          capture_surface: "monster",
          location_note: body.analysis.locationNote,
          verdict: body.analysis.verdict,
          site_resolution: siteResolution,
          nearby_candidate_count: scoredCandidates.length,
        },
        p_classification: body.analysis,
      }),
    });

    const ingested = rows[0];
    if (!ingested?.observation_id) throw new Error("Observation was not created.");
    const siteId = ingested.resolved_site_id;

    if (
      body.kind === "litter" &&
      siteResolution === "proposed" &&
      siteId &&
      ingested.created &&
      scoredCandidates.length
    ) {
      const proposals = scoredCandidates
        .filter((candidate) => candidate.site_id !== siteId && candidate.score >= 0.2)
        .map((candidate) => ({
          source_site_id: siteId,
          candidate_site_id: candidate.site_id,
          observation_id: ingested.observation_id,
          score: Number(candidate.score.toFixed(3)),
          distance_m: Number(candidate.distance_m.toFixed(1)),
          metadata: {
            item_similarity: Number(candidate.itemSimilarity.toFixed(3)),
            material_similarity: Number(candidate.materialSimilarity.toFixed(3)),
            candidate_title: candidate.title,
          },
        }));

      if (proposals.length) {
        try {
          await supabaseRest("yuk_site_match_proposals", {
            method: "POST",
            headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
            body: JSON.stringify(proposals),
          });
        } catch (error) {
          console.error("YUK duplicate proposal persistence failed", error);
        }
      }
    }

    const mediaStored = await ensureEvidence(ingested.observation_id, body.image);

    return NextResponse.json({
      observationId: ingested.observation_id,
      siteId,
      mediaStored,
      publicVisibility,
      siteResolution,
    } satisfies PersistedObservation);
  } catch (error) {
    console.error("YUK observation persistence failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "YUK could not save that observation." },
      { status: 503 },
    );
  }
}
