import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { syncPendingCaptures, type YukAnalysis } from "@/lib/api";
import { listCaptures, type CaptureOp } from "@/lib/db";

const ink = "#11110f";
const acid = "#d9ff55";
const pink = "#ff8db8";

export default function QueueScreen() {
  const router = useRouter();
  const [captures, setCaptures] = useState<CaptureOp[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    listCaptures().then(setCaptures).catch(() => setCaptures([]));
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  async function syncAll() {
    setSyncing(true);
    try {
      await syncPendingCaptures();
      refresh();
    } finally {
      setSyncing(false);
    }
  }

  const pending = captures.filter((capture) => capture.status !== "synced").length;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 60 }}>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }}>DURABLE OPERATION LOG</Text>
        <Text selectable style={{ fontSize: 46, lineHeight: 46, fontWeight: "900", letterSpacing: -3 }}>YUK remembers offline.</Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22 }}>
          A capture enters this stomach before the network is touched. Synced bites stay useful: correct the interpretation or record a cleanup from the same history.
        </Text>
      </View>

      <Pressable disabled={syncing || pending === 0} onPress={syncAll} style={{ minHeight: 56, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: ink, borderRadius: 18, borderCurve: "continuous", backgroundColor: acid, opacity: pending === 0 ? 0.45 : 1 }}>
        {syncing ? <ActivityIndicator color={ink} /> : <Text selectable style={{ fontWeight: "900" }}>{pending ? `Sync ${pending} waiting bite${pending === 1 ? "" : "s"}` : "Everything synced"}</Text>}
      </Pressable>

      {captures.length === 0 && (
        <View style={{ borderWidth: 2, borderRadius: 22, borderCurve: "continuous", padding: 18, backgroundColor: "white" }}>
          <Text selectable style={{ fontSize: 24, fontWeight: "900" }}>empty. suspiciously clean.</Text>
        </View>
      )}

      {captures.map((capture) => {
        const analysis = capture.analysis_json ? JSON.parse(capture.analysis_json) as YukAnalysis : null;
        return (
          <View key={capture.id} style={{ gap: 8, borderWidth: 2, borderColor: ink, borderRadius: 22, borderCurve: "continuous", padding: 16, backgroundColor: capture.status === "synced" ? "rgba(255,255,255,0.62)" : "#fff0b8" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Text selectable style={{ fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>{capture.kind}</Text>
              <Text selectable style={{ fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>{capture.status}</Text>
            </View>
            <Text selectable style={{ fontSize: 24, fontWeight: "900", letterSpacing: -1 }}>{analysis?.emoji ? `${analysis.emoji} ` : ""}{analysis?.item || "Uneaten photo"}</Text>
            {analysis?.material && <Text selectable style={{ fontSize: 14 }}>{analysis.material}</Text>}
            <Text selectable style={{ fontSize: 11, opacity: 0.6, fontVariant: ["tabular-nums"] }}>{new Date(capture.created_at).toLocaleString()}</Text>
            {capture.last_error && <Text selectable style={{ fontSize: 11, color: "#9f1825" }}>{capture.last_error}</Text>}

            {capture.status === "synced" && capture.observation_id && analysis && (
              <Pressable
                onPress={() => router.push({ pathname: "/correct", params: { observationId: capture.observation_id!, item: analysis.item, material: analysis.material, bin: analysis.bin, destination: analysis.destination } })}
                style={{ padding: 11, borderWidth: 1.5, borderColor: ink, borderRadius: 14, backgroundColor: "white" }}
              >
                <Text selectable style={{ fontWeight: "900", textAlign: "center" }}>correct YUK</Text>
              </Pressable>
            )}

            {capture.status === "synced" && capture.site_id && (
              <Pressable onPress={() => router.push({ pathname: "/cleanup", params: { siteId: capture.site_id! } })} style={{ padding: 11, borderWidth: 1.5, borderColor: ink, borderRadius: 14, backgroundColor: pink }}>
                <Text selectable style={{ fontWeight: "900", textAlign: "center" }}>we cleaned it</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
