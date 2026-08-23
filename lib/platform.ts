import type { YukAnalysis } from "@/lib/types";

export type ObservationKind = "discard" | "litter" | "verification" | "cleanup" | "import";
export type PublicVisibility = "private" | "aggregate" | "public";
export type SiteStatus =
  | "suspected"
  | "verified"
  | "cleanup_planned"
  | "cleaned"
  | "verified_clean"
  | "reappeared"
  | "archived";

export type CaptureLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type CreateObservationInput = {
  clientId: string;
  kind: "discard" | "litter";
  image: string;
  analysis: YukAnalysis;
  location?: CaptureLocation;
  publish?: boolean;
  siteId?: string;
};

export type PersistedObservation = {
  observationId: string;
  siteId: string | null;
  mediaStored: boolean;
  publicVisibility: PublicVisibility;
};

export type PublicSite = {
  id: string;
  title: string | null;
  status: SiteStatus;
  latitude: number;
  longitude: number;
  location_accuracy_m: number;
  current_confidence: number | null;
  first_observed_at: string | null;
  last_observed_at: string | null;
  created_at: string;
};

export type PublicObservation = {
  id: string;
  site_id: string | null;
  kind: ObservationKind;
  observed_at: string;
  latitude: number;
  longitude: number;
  location_accuracy_m: number;
  confidence: number | null;
  item: string | null;
  material: string | null;
  brand: string | null;
  hazard: string | null;
  quantity_label: string | null;
  classification_confidence: number | null;
};

export function confidenceNumber(value: YukAnalysis["confidence"]): number {
  if (value === "high") return 0.9;
  if (value === "medium") return 0.65;
  return 0.35;
}

export function locationPoint(location?: CaptureLocation): string | null {
  if (!location) return null;
  return `POINT(${location.longitude} ${location.latitude})`;
}
