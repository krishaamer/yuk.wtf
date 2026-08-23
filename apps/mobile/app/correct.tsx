import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { correctObservation } from "@/lib/api";

const ink = "#11110f";
const acid = "#d9ff55";

export default function CorrectScreen() {
  const params = useLocalSearchParams<{
    observationId?: string;
    item?: string;
    material?: string;
    bin?: string;
    destination?: string;
  }>();
  const router = useRouter();
  const [item, setItem] = useState(params.item || "");
  const [material, setMaterial] = useState(params.material || "");
  const [bin, setBin] = useState(params.bin || "");
  const [destination, setDestination] = useState(params.destination || "");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!params.observationId || state === "saving") return;
    setState("saving");
    setError(null);
    try {
      await correctObservation({
        observationId: params.observationId,
        item,
        material,
        bin,
        destination,
        note,
      });
      router.back();
    } catch (saveError) {
      setState("error");
      setError(saveError instanceof Error ? saveError.message : "Could not save correction.");
    }
  }

  const fields = [
    ["Object", item, setItem],
    ["Material", material, setMaterial],
    ["Bin", bin, setBin],
    ["Destination", destination, setDestination],
  ] as const;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: 60 }}>
      <Stack.Screen options={{ title: "Correct YUK" }} />
      <View style={{ gap: 5 }}>
        <Text selectable style={{ fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }}>HUMAN EVIDENCE WINS</Text>
        <Text selectable style={{ fontSize: 46, lineHeight: 46, fontWeight: "900", letterSpacing: -3 }}>YUK got it wrong?</Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 22 }}>
          Your correction becomes a newer interpretation. YUK keeps the model&apos;s original answer so the history stays auditable.
        </Text>
      </View>

      {fields.map(([label, value, setter]) => (
        <View key={label} style={{ gap: 5 }}>
          <Text selectable style={{ fontSize: 12, fontWeight: "900" }}>{label.toUpperCase()}</Text>
          <TextInput
            value={value}
            onChangeText={setter}
            style={{ borderWidth: 2, borderColor: ink, borderRadius: 16, padding: 13, backgroundColor: "white", fontSize: 16 }}
          />
        </View>
      ))}

      <View style={{ gap: 5 }}>
        <Text selectable style={{ fontSize: 12, fontWeight: "900" }}>WHAT DID YUK MISS?</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
          style={{ minHeight: 100, borderWidth: 2, borderColor: ink, borderRadius: 16, padding: 13, backgroundColor: "white", fontSize: 16 }}
        />
      </View>

      <Pressable onPress={save} disabled={!params.observationId || state === "saving"} style={{ minHeight: 56, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: ink, borderRadius: 18, backgroundColor: acid }}>
        <Text selectable style={{ fontWeight: "900" }}>{state === "saving" ? "saving evidence…" : "save correction"}</Text>
      </Pressable>
      {error && <Text selectable style={{ color: "#9f1825", fontWeight: "900" }}>{error}</Text>}
    </ScrollView>
  );
}
