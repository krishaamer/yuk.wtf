import { fetch } from "expo/fetch";
import {
  getCapture,
  listPendingCaptures,
  markPending,
  markSynced,
  markSyncing,
  saveAnalysis,
} from "@/lib/db";

export type YukAnalysis = {
  item: string;
  material: string;
  emoji: "💩" | "🤢" | "🤮";
  verdict: string;
  bin: string;
  destination: string;
  reason: string;
  betterAlternative: string;
  confidence: "high" | "medium" | "low";
  locationNote: string;
};

export type PersistedObservation = {
  observationId: string;
  siteId: string | null;
  mediaStored: boolean;
  publicVisibility: "private" | "aggregate" | "public";
};

const API_URL = (process.env.EXPO_PUBLIC_YUK_API_URL || "https://yuk.wtf").replace(/\/$/, "");

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof result?.error === "string" ? result.error : `YUK request failed with ${response.status}`,
    );
  }
  return result as T;
}

export async function syncCapture(id: string) {
  const capture = await getCapture(id);
  if (!capture) throw new Error("Capture not found on this device.");
  if (capture.status === "synced" && capture.analysis_json) {
    return {
      analysis: JSON.parse(capture.analysis_json) as YukAnalysis,
      persisted: {
        observationId: capture.observation_id || id,
        siteId: capture.site_id,
        mediaStored: true,
        publicVisibility: capture.kind === "discard" ? "private" : capture.publish ? "public" : "aggregate",
      } satisfies PersistedObservation,
    };
  }

  await markSyncing(id);
  const location =
    capture.latitude != null && capture.longitude != null
      ? {
          latitude: capture.latitude,
          longitude: capture.longitude,
          accuracy: capture.accuracy ?? undefined,
        }
      : undefined;

  try {
    let analysis: YukAnalysis;
    if (capture.analysis_json) {
      analysis = JSON.parse(capture.analysis_json) as YukAnalysis;
    } else {
      analysis = await postJson<YukAnalysis>("/api/analyse", {
        image: capture.image_data,
        location,
      });
      await saveAnalysis(id, analysis);
    }

    const persisted = await postJson<PersistedObservation>("/api/observations", {
      clientId: capture.id,
      kind: capture.kind,
      image: capture.image_data,
      analysis,
      location,
      publish: capture.kind === "litter" && capture.publish === 1,
    });

    await markSynced(id, persisted.observationId, persisted.siteId);
    return { analysis, persisted };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network unavailable.";
    await markPending(id, message);
    throw error;
  }
}

export async function syncPendingCaptures() {
  const pending = await listPendingCaptures();
  const results: Array<{ id: string; ok: boolean }> = [];

  for (const capture of pending) {
    try {
      await syncCapture(capture.id);
      results.push({ id: capture.id, ok: true });
    } catch {
      results.push({ id: capture.id, ok: false });
    }
  }

  return results;
}
