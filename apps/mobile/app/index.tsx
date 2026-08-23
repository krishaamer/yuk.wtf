import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { captureStats } from "@/lib/db";

const ink = "#11110f";
const acid = "#d9ff55";
const pink = "#ff8db8";

export default function HomeScreen() {
  const [stats, setStats] = useState({ total: 0, pending: 0, mapped: 0 });

  useFocusEffect(
    useCallback(() => {
      captureStats().then(setStats).catch(() => undefined);
    }, []),
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 60 }}
    >
      <View style={{ gap: 4 }}>
        <Text selectable style={{ fontSize: 12, fontWeight: "900", letterSpacing: 1.4 }}>
          AI TRASH CREATURE 💩🤢🤮
        </Text>
        <Text selectable style={{ fontSize: 58, lineHeight: 58, fontWeight: "900", letterSpacing: -4 }}>
          feed me trash.
        </Text>
        <Text selectable style={{ fontSize: 18, lineHeight: 24, maxWidth: 560 }}>
          Every bite becomes evidence. Personal trash can stay private. Litter can become a persistent place on the map.
        </Text>
      </View>

      <View
        style={{
          minHeight: 210,
          borderWidth: 3,
          borderColor: ink,
          borderRadius: 36,
          borderCurve: "continuous",
          backgroundColor: acid,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ rotate: "-1deg" }],
        }}
      >
        <Text selectable style={{ fontSize: 110 }}>🤢</Text>
      </View>

      <View style={{ gap: 10 }}>
        <Link href={{ pathname: "/capture", params: { kind: "discard" } }} asChild>
          <Pressable
            style={({ pressed }) => ({
              minHeight: 74,
              borderWidth: 2,
              borderColor: ink,
              borderRadius: 22,
              borderCurve: "continuous",
              backgroundColor: pressed ? "#c6ec43" : acid,
              padding: 16,
              justifyContent: "center",
              boxShadow: "4px 4px 0 #11110f",
            })}
          >
            <Text selectable style={{ fontSize: 19, fontWeight: "900" }}>I&apos;m throwing this away</Text>
            <Text selectable style={{ fontSize: 13 }}>private material autobiography</Text>
          </Pressable>
        </Link>

        <Link href={{ pathname: "/capture", params: { kind: "litter" } }} asChild>
          <Pressable
            style={({ pressed }) => ({
              minHeight: 74,
              borderWidth: 2,
              borderColor: ink,
              borderRadius: 22,
              borderCurve: "continuous",
              backgroundColor: pressed ? "#ef78a4" : pink,
              padding: 16,
              justifyContent: "center",
              boxShadow: "4px 4px 0 #11110f",
            })}
          >
            <Text selectable style={{ fontSize: 19, fontWeight: "900" }}>I found this outside</Text>
            <Text selectable style={{ fontSize: 13 }}>map litter as evidence</Text>
          </Pressable>
        </Link>
      </View>

      <Link href="/queue" asChild>
        <Pressable
          style={{
            borderWidth: 2,
            borderColor: ink,
            borderRadius: 22,
            borderCurve: "continuous",
            padding: 16,
            backgroundColor: "rgba(255,255,255,0.6)",
          }}
        >
          <Text selectable style={{ fontSize: 12, fontWeight: "900", letterSpacing: 1 }}>YUK&apos;S STOMACH</Text>
          <Text selectable style={{ fontSize: 28, fontWeight: "900", letterSpacing: -1.5, fontVariant: ["tabular-nums"] }}>
            {stats.total} eaten · {stats.mapped} mapped
          </Text>
          <Text selectable style={{ fontSize: 14 }}>{stats.pending} waiting to sync</Text>
        </Pressable>
      </Link>

      <Text selectable style={{ fontSize: 12, opacity: 0.58, textAlign: "center" }}>
        Camera first. Offline by default. History stays.
      </Text>
    </ScrollView>
  );
}
