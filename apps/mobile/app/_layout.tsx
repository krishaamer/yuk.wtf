import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#f4f0e7" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#f4f0e7" },
        headerTitleStyle: { fontWeight: "900" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "YUK" }} />
      <Stack.Screen name="capture" options={{ title: "Feed YUK" }} />
      <Stack.Screen name="queue" options={{ title: "Stomach" }} />
      <Stack.Screen name="correct" options={{ title: "Correct YUK" }} />
      <Stack.Screen name="cleanup" options={{ title: "We cleaned it" }} />
    </Stack>
  );
}
