import { supabaseRest } from "@/lib/supabase-rest";

export type YukContextWarning = {
  id: string;
  kind: "protected_area" | "restricted_access" | "hazard_zone" | "sensitive_location" | "other";
  name: string;
  severity: "low" | "medium" | "high" | "critical";
  instructions: string | null;
  distanceM: number;
};

export async function contextAtPoint(location?: { latitude?: number; longitude?: number }) {
  if (typeof location?.latitude !== "number" || typeof location?.longitude !== "number") {
    return [] as YukContextWarning[];
  }

  try {
    const rows = await supabaseRest<Array<{
      id: string;
      kind: YukContextWarning["kind"];
      name: string;
      severity: YukContextWarning["severity"];
      instructions: string | null;
      distance_m: number;
    }>>("rpc/yuk_context_at_point", {
      method: "POST",
      body: JSON.stringify({
        p_longitude: location.longitude,
        p_latitude: location.latitude,
        p_radius_m: 75,
      }),
    });

    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      name: row.name,
      severity: row.severity,
      instructions: row.instructions,
      distanceM: Number(row.distance_m),
    }));
  } catch (error) {
    console.error("YUK spatial context lookup failed", error);
    return [] as YukContextWarning[];
  }
}
