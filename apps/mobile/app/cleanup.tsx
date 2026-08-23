import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { createCleanup } from "@/lib/api";

const ink = "#11110f";
const acid = "#d9ff55";

export default function CleanupScreen() {
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    if (!siteId || state === "saving") return;
    setState("saving");
    setMessage(null);
    try {
      const result = await createCleanup({ siteId, note, endedAt: new Date().toISOString() });
      setState("saved");
      setMessage(result.message);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not save cleanup.");
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 60 }}>
      <Stack.Screen options={{ title: "We cleaned it" }} />
      <View style={{ gap: 5 }}>
        <Text selectable style={{ fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }}>INTERVENTION, NOT DELETION</Text>
        <Text selectable style={{ fontSize: 50, lineHeight: 49, fontWeight: "900", letterSpacing: -3 }}>we cleaned it.</Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22 }}>
          YUK records the cleanup as an intervention. The Site and its earlier evidence stay in history, and a later observation can show that waste reappeared.
        </Text>
      </View>

      <View style={{ borderWidth: 2, borderColor: ink, borderRadius: 18, padding: 14, backgroundColor: "rgba(255,255,255,0.6)" }}>
        <Text selectable style={{ fontSize: 11, fontWeight: "900" }}>SITE</Text>
        <Text selectable numberOfLines={1} style={{ fontSize: 14 }}>{siteId || "No synced Site selected"}</Text>
      </View>

      <View style={{ gap: 5 }}>
        <Text selectable style={{ fontSize: 12, fontWeight: "900" }}>WHAT HAPPENED?</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What was removed, what remained, anything unsafe or inaccessible…"
          multiline
          textAlignVertical="top"
          style={{ minHeight: 140, borderWidth: 2, borderColor: ink, borderRadius: 18, padding: 14, backgroundColor: "white", fontSize: 16 }}
        />
      </View>

      <Pressable onPress={save} disabled={!siteId || state === "saving" || state === "saved"} style={{ minHeight: 58, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: ink, borderRadius: 18, backgroundColor: acid, opacity: !siteId ? 0.5 : 1 }}>
        <Text selectable style={{ fontWeight: "900", fontSize: 17 }}>{state === "saving" ? "saving cleanup…" : state === "saved" ? "cleanup recorded ✓" : "record cleanup"}</Text>
      </Pressable>

      {message && <Text selectable style={{ fontSize: 13, fontWeight: "800", color: state === "error" ? "#9f1825" : ink }}>{message}</Text>}
      {state === "saved" && (
        <Pressable onPress={() => router.replace("/")} style={{ padding: 14 }}>
          <Text selectable style={{ textAlign: "center", fontWeight: "900" }}>back to YUK</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
