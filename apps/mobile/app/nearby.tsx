import * as Location from "expo-location";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { getNearbySites, type NearbySite } from "@/lib/api";

const ink = "#11110f";
const acid = "#d9ff55";
const pink = "#ff8db8";

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export default function NearbyScreen() {
  const router = useRouter();
  const [sites, setSites] = useState<NearbySite[]>([]);
  const [radiusM, setRadiusM] = useState(5000);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("Allow location access to see nearby public waste Sites.");
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await getNearbySites({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radiusM,
        limit: 100,
      });
      setSites(result.sites);
      setState("ready");
    } catch (error) {
      setSites([]);
      setState("error");
      setMessage(error instanceof Error ? error.message : "YUK could not load nearby Sites.");
    }
  }, [radiusM]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const field = useMemo(() => {
    if (!sites.length) return [] as Array<NearbySite & { left: number; top: number }>;
    const lats = sites.map((site) => site.latitude);
    const lngs = sites.map((site) => site.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(0.002, maxLat - minLat);
    const lngSpan = Math.max(0.002, maxLng - minLng);
    return sites.slice(0, 60).map((site) => ({
      ...site,
      left: 6 + ((site.longitude - minLng) / lngSpan) * 88,
      top: 94 - ((site.latitude - minLat) / latSpan) * 88,
    }));
  }, [sites]);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 60 }}>
      <Stack.Screen options={{ title: "Nearby waste" }} />
      <View style={{ gap: 5 }}>
        <Text selectable style={{ fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }}>THE WORLD, AS CURRENTLY BELIEVED</Text>
        <Text selectable style={{ fontSize: 48, lineHeight: 47, fontWeight: "900", letterSpacing: -3 }}>what&apos;s around me?</Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22 }}>
          YUK uses your precise location only for this nearby query. The Site coordinates returned to the app are already rounded for public use.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {[1000, 5000, 20000].map((radius) => (
          <Pressable
            key={radius}
            onPress={() => setRadiusM(radius)}
            style={{ flex: 1, padding: 10, borderWidth: 2, borderColor: ink, borderRadius: 14, backgroundColor: radiusM === radius ? acid : "white" }}
          >
            <Text selectable style={{ textAlign: "center", fontWeight: "900" }}>{radius < 1000 ? `${radius}m` : `${radius / 1000}km`}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ height: 300, borderWidth: 2, borderColor: ink, borderRadius: 28, borderCurve: "continuous", overflow: "hidden", backgroundColor: "#e6efd9" }}>
        <View style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
          {[20, 40, 60, 80].map((value) => <View key={`h-${value}`} style={{ position: "absolute", left: 0, right: 0, top: `${value}%`, height: 1, backgroundColor: ink }} />)}
          {[20, 40, 60, 80].map((value) => <View key={`v-${value}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${value}%`, width: 1, backgroundColor: ink }} />)}
        </View>
        {state === "loading" && <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={ink} /><Text selectable style={{ marginTop: 10, fontWeight: "900" }}>finding nearby Sites…</Text></View>}
        {state !== "loading" && !sites.length && <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 28 }}><Text selectable style={{ textAlign: "center", fontSize: 21, fontWeight: "900" }}>{message || "No public Sites in this radius yet."}</Text></View>}
        {field.map((site) => (
          <Pressable
            key={site.id}
            accessibilityLabel={`Open ${site.title || "waste Site"}, ${formatDistance(site.distance_m)} away`}
            onPress={() => router.push({ pathname: "/site", params: { id: site.id } })}
            style={{ position: "absolute", left: `${site.left}%`, top: `${site.top}%`, width: 32, height: 32, marginLeft: -16, marginTop: -16, borderRadius: 16, borderWidth: 2, borderColor: ink, alignItems: "center", justifyContent: "center", backgroundColor: site.status === "verified_clean" ? acid : pink }}
          >
            <Text selectable style={{ fontWeight: "900" }}>{site.status === "verified_clean" ? "✓" : "●"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        {sites.map((site) => (
          <Pressable
            key={site.id}
            onPress={() => router.push({ pathname: "/site", params: { id: site.id } })}
            style={{ gap: 4, borderWidth: 2, borderColor: ink, borderRadius: 20, borderCurve: "continuous", padding: 15, backgroundColor: "rgba(255,255,255,0.65)" }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
              <Text selectable style={{ flex: 1, fontSize: 20, fontWeight: "900" }}>{site.title || "Unnamed waste Site"}</Text>
              <Text selectable style={{ fontSize: 13, fontWeight: "900", fontVariant: ["tabular-nums"] }}>{formatDistance(site.distance_m)}</Text>
            </View>
            <Text selectable style={{ fontSize: 12, textTransform: "uppercase" }}>{site.status.replaceAll("_", " ")} · public precision ≥ {site.location_accuracy_m} m</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={load} style={{ padding: 14, borderWidth: 2, borderColor: ink, borderRadius: 16, backgroundColor: acid }}>
        <Text selectable style={{ textAlign: "center", fontWeight: "900" }}>refresh nearby Sites</Text>
      </Pressable>
    </ScrollView>
  );
}
