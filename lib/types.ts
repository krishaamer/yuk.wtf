export type YukEmoji = "💩" | "🤢" | "🤮";

export type YukAnalysis = {
  item: string;
  material: string;
  emoji: YukEmoji;
  verdict: string;
  bin: string;
  destination: string;
  reason: string;
  betterAlternative: string;
  confidence: "high" | "medium" | "low";
  locationNote: string;
};

export type YukMood = "idle" | "hungry" | "chewing" | "grossed-out" | "vomiting";
