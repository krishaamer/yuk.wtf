import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { syncCapture, type PersistedObservation, type YukAnalysis } from "@/lib/api";
import { queueCapture, type CaptureKind } from "@/lib/db";

const ink = "#11110f";
const acid = "#d9ff55";
const pink = "#ff8db8";

export default function CaptureScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind: CaptureKind = params.kind === "litter" ? "litter" : "discard";
  const router = useRouter();
  const camera = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState<YukAnalysis | null>(null);
  const [persisted, setPersisted] = useState<PersistedObservation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function takePhoto() {
    if (!camera.current || busy) return;
    setBusy(true);
    setAnalysis(null);
    setPersisted(null);
    setMessage(null);
    setError(null);

    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.68, base64: true });
      if (!photo?.base64) throw new Error("YUK could not keep that photo.");

      let location: { latitude: number; longitude: number; accuracy?: number } | undefined;
      if (kind === "litter") {
        const locationPermission = await Location.requestForegroundPermissionsAsync();
        if (locationPermission.status !== "granted") throw new Error("YUK needs location permission to map litter.");
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        location = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          accuracy: current.coords.accuracy ?? undefined,
        };
      }

      const id = Crypto.randomUUID();
      const imageData = `data:image/jpeg;base64,${photo.base64}`;
      await queueCapture({
        id,
        kind,
        imageData,
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy,
        publish: kind === "litter" && publish,
      });

      setMessage("Saved on this device. YUK is trying to digest it now.");
      try {
        const result = await syncCapture(id);
        setAnalysis(result.analysis);
        setPersisted(result.persisted);
        setMessage(
          result.persisted.siteId
            ? result.persisted.siteResolution === "matched"
              ? "Synced and matched to an existing waste Site."
              : result.persisted.siteResolution === "proposed"
                ? "Synced. YUK found nearby possible duplicates for later review."
                : "Synced. This bite is now a persistent waste Site."
            : "Synced. This bite is safely in YUK's memory.",
        );
      } catch {
        setMessage("Saved offline. YUK will keep this bite in the sync queue until you retry.");
      }
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "YUK could not eat that.");
    } finally {
      setBusy(false);
    }
  }

  if (!permission) return <View style={{ flex: 1, backgroundColor: "#f4f0e7" }} />;

  if (!permission.granted) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 22, gap: 18, alignItems: "stretch" }}>
        <Stack.Screen options={{ title: kind === "litter" ? "Map litter" : "Feed YUK" }} />
        <Text selectable style={{ fontSize: 42, fontWeight: "900", letterSpacing: -2.5 }}>YUK is hungry.</Text>
        <Text selectable style={{ fontSize: 18, lineHeight: 24 }}>Camera access is required because the photograph is the evidence. You can still choose whether litter becomes public.</Text>
        <Pressable onPress={requestPermission} style={{ padding: 16, borderWidth: 2, borderRadius: 18, borderCurve: "continuous", backgroundColor: acid }}>
          <Text selectable style={{ fontWeight: "900", textAlign: "center" }}>Allow camera</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (analysis) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 60 }}>
        <Stack.Screen options={{ title: "Digested" }} />
        <Text selectable style={{ fontSize: 92, textAlign: "center" }}>{analysis.emoji}</Text>
        <View style={{ gap: 6 }}>
          <Text selectable style={{ fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }}>{analysis.item.toUpperCase()}</Text>
          <Text selectable style={{ fontSize: 46, lineHeight: 46, fontWeight: "900", letterSpacing: -3 }}>{analysis.verdict}</Text>
          <Text selectable style={{ fontSize: 18 }}>{analysis.material}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, borderWidth: 2, borderRadius: 20, borderCurve: "continuous", padding: 14, backgroundColor: acid }}>
            <Text selectable style={{ fontSize: 11, fontWeight: "900" }}>PUT IT</Text>
            <Text selectable style={{ fontSize: 20, fontWeight: "900" }}>{analysis.bin}</Text>
          </View>
          <View style={{ flex: 1, borderWidth: 2, borderRadius: 20, borderCurve: "continuous", padding: 14, backgroundColor: "white" }}>
            <Text selectable style={{ fontSize: 11, fontWeight: "900" }}>THEN</Text>
            <Text selectable style={{ fontSize: 20, fontWeight: "900" }}>{analysis.destination}</Text>
          </View>
        </View>
        {analysis.disposalInstructions && (
          <View style={{ borderWidth: 2, borderRadius: 20, borderCurve: "continuous", padding: 14, backgroundColor: "white" }}>
            <Text selectable style={{ fontSize: 11, fontWeight: "900" }}>LOCAL GUIDANCE</Text>
            <Text selectable style={{ fontSize: 15, lineHeight: 21 }}>{analysis.disposalInstructions}</Text>
            {analysis.guidanceSource && <Text selectable style={{ marginTop: 6, fontSize: 11, opacity: 0.6 }}>{analysis.guidanceSource}</Text>}
          </View>
        )}
        <Text selectable style={{ fontSize: 16, lineHeight: 23 }}>{analysis.reason}</Text>
        <View style={{ borderWidth: 2, borderRadius: 20, borderCurve: "continuous", padding: 14, backgroundColor: pink }}>
          <Text selectable style={{ fontSize: 11, fontWeight: "900" }}>LESS YUK NEXT TIME</Text>
          <Text selectable style={{ fontSize: 17, fontWeight: "800" }}>{analysis.betterAlternative}</Text>
        </View>
        {message && <Text selectable style={{ fontSize: 13, fontWeight: "800" }}>{message}</Text>}

        {persisted?.observationId && (
          <Pressable
            onPress={() => router.push({ pathname: "/correct", params: { observationId: persisted.observationId, item: analysis.item, material: analysis.material, bin: analysis.bin, destination: analysis.destination } })}
            style={{ padding: 15, borderWidth: 2, borderRadius: 18, borderCurve: "continuous", backgroundColor: "white" }}
          >
            <Text selectable style={{ fontWeight: "900", textAlign: "center" }}>YUK got it wrong?</Text>
          </Pressable>
        )}

        {persisted?.siteId && (
          <Pressable
            onPress={() => router.push({ pathname: "/cleanup", params: { siteId: persisted.siteId! } })}
            style={{ padding: 15, borderWidth: 2, borderRadius: 18, borderCurve: "continuous", backgroundColor: pink }}
          >
            <Text selectable style={{ fontWeight: "900", textAlign: "center" }}>We cleaned it</Text>
          </Pressable>
        )}

        <Pressable onPress={() => router.replace("/")} style={{ padding: 16, borderWidth: 2, borderRadius: 18, borderCurve: "continuous", backgroundColor: acid }}>
          <Text selectable style={{ fontWeight: "900", textAlign: "center" }}>Feed YUK something else</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: ink }}>
      <Stack.Screen options={{ title: kind === "litter" ? "Map litter" : "Feed YUK" }} />
      <CameraView ref={camera} style={{ flex: 1 }} facing="back" animateShutter />
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 24, gap: 12, padding: 14, borderRadius: 26, borderCurve: "continuous", backgroundColor: "rgba(244,240,231,0.94)" }}>
        <Text selectable style={{ fontWeight: "900", fontSize: 18 }}>{kind === "litter" ? "Show YUK the waste where you found it." : "Show YUK what you are throwing away."}</Text>
        {kind === "litter" && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Text selectable style={{ flex: 1, fontSize: 13 }}>Publish an approximate location after sync</Text>
            <Switch value={publish} onValueChange={setPublish} />
          </View>
        )}
        <Pressable
          disabled={busy}
          onPress={takePhoto}
          style={({ pressed }) => ({ minHeight: 58, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: ink, borderRadius: 18, borderCurve: "continuous", backgroundColor: pressed ? "#c6ec43" : acid, opacity: busy ? 0.7 : 1 })}
        >
          {busy ? <ActivityIndicator color={ink} /> : <Text selectable style={{ fontSize: 18, fontWeight: "900" }}>CHOMP 📷</Text>}
        </Pressable>
        {message && <Text selectable style={{ fontSize: 12, fontWeight: "800" }}>{message}</Text>}
        {error && <Text selectable style={{ fontSize: 12, fontWeight: "900", color: "#9f1825" }}>{error}</Text>}
      </View>
    </View>
  );
}
