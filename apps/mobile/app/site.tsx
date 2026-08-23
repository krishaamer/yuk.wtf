import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { getPublicSite, type PublicObservation, type PublicSiteDetail } from "@/lib/api";

const ink = "#11110f";
const acid = "#d9ff55";
const pink = "#ff8db8";

export default function SiteScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [site, setSite] = useState<PublicSiteDetail | null>(null);
  const [observations, setObservations] = useState<PublicObservation[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setState("error");
      setMessage("No Site selected.");
      return;
    }

    let active = true;
    setState("loading");
    getPublicSite(id)
      .then((result) => {
        if (!active) return;
        setSite(result.site);
        setObservations(result.observations);
        setState("ready");
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Site unavailable.");
        setState("error");
      });

    return () => { active = false; };
  }, [id]);

  if (state === "loading") {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f4f0e7" }}><ActivityIndicator color={ink} /></View>;
  }

  if (!site) {
    return <View style={{ flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#f4f0e7" }}><Text selectable style={{ fontSize: 24, fontWeight: "900" }}>{message || "Site not found."}</Text></View>;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 60 }}>
      <Stack.Screen options={{ title: site.title || "Waste Site" }} />

      <View style={{ gap: 6 }}>
        <Text selectable style={{ fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }}>{site.status.replaceAll("_", " ").toUpperCase()}</Text>
        <Text selectable style={{ fontSize: 48, lineHeight: 47, fontWeight: "900", letterSpacing: -3 }}>{site.title || "unnamed waste Site"}</Text>
        <Text selectable style={{ fontSize: 15, lineHeight: 21 }}>
          This is a persistent place, not a report. Every item below is evidence about how the place changed over time.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 9 }}>
        <View style={{ flex: 1, borderWidth: 2, borderColor: ink, borderRadius: 18, padding: 13, backgroundColor: acid }}>
          <Text selectable style={{ fontSize: 26, fontWeight: "900" }}>{observations.length}</Text>
          <Text selectable style={{ fontSize: 11, fontWeight: "900" }}>PUBLIC OBSERVATIONS</Text>
        </View>
        <View style={{ flex: 1, borderWidth: 2, borderColor: ink, borderRadius: 18, padding: 13, backgroundColor: "white" }}>
          <Text selectable style={{ fontSize: 26, fontWeight: "900" }}>{site.current_confidence == null ? "?" : `${Math.round(site.current_confidence * 100)}%`}</Text>
          <Text selectable style={{ fontSize: 11, fontWeight: "900" }}>CURRENT CONFIDENCE</Text>
        </View>
      </View>

      <View style={{ borderWidth: 2, borderColor: ink, borderRadius: 20, borderCurve: "continuous", padding: 15, backgroundColor: "white", gap: 4 }}>
        <Text selectable style={{ fontSize: 11, fontWeight: "900" }}>APPROXIMATE PUBLIC LOCATION</Text>
        <Text selectable style={{ fontSize: 22, fontWeight: "900", fontVariant: ["tabular-nums"] }}>{site.latitude.toFixed(3)}, {site.longitude.toFixed(3)}</Text>
        <Text selectable style={{ fontSize: 12 }}>Public precision ≥ {site.location_accuracy_m} m. Exact evidence geometry is not exposed here.</Text>
      </View>

      {site.status !== "verified_clean" && (
        <Pressable onPress={() => router.push({ pathname: "/cleanup", params: { siteId: site.id } })} style={{ minHeight: 56, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: ink, borderRadius: 18, backgroundColor: pink }}>
          <Text selectable style={{ fontSize: 17, fontWeight: "900" }}>we cleaned it</Text>
        </Pressable>
      )}

      <View style={{ gap: 10 }}>
        <Text selectable style={{ fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }}>EVIDENCE HISTORY</Text>
        {observations.length ? observations.map((observation) => (
          <View key={observation.id} style={{ gap: 4, borderWidth: 2, borderColor: ink, borderRadius: 18, borderCurve: "continuous", padding: 14, backgroundColor: "rgba(255,255,255,0.62)" }}>
            <Text selectable style={{ fontSize: 11, fontWeight: "900" }}>{new Date(observation.observed_at).toLocaleString()}</Text>
            <Text selectable style={{ fontSize: 20, fontWeight: "900" }}>{observation.kind} · {observation.item || "unclassified waste"}</Text>
            <Text selectable style={{ fontSize: 13 }}>{observation.material || "material unknown"}{observation.brand ? ` · ${observation.brand}` : ""}</Text>
          </View>
        )) : (
          <View style={{ borderWidth: 2, borderColor: ink, borderRadius: 18, padding: 14, backgroundColor: "white" }}><Text selectable style={{ fontWeight: "900" }}>No public evidence attached yet.</Text></View>
        )}
      </View>
    </ScrollView>
  );
}
