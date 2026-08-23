export type YukEmoji = "💩" | "🤢" | "🤮";

export type YukDisposalRuleKey =
  | "mixed"
  | "packaging_plastic_metal_carton"
  | "glass_packaging"
  | "bio"
  | "paper_cardboard"
  | "batteries"
  | "electronics"
  | "medicines"
  | "hazardous"
  | "textile"
  | "bulky"
  | "other";

export type YukAnalysis = {
  item: string;
  material: string;
  emoji: YukEmoji;
  verdict: string;
  ruleKey: YukDisposalRuleKey;
  bin: string;
  destination: string;
  reason: string;
  betterAlternative: string;
  confidence: "high" | "medium" | "low";
  locationNote: string;
  guidanceSource?: string;
  guidanceSourceUrl?: string;
};

export type YukMood = "idle" | "hungry" | "chewing" | "grossed-out" | "vomiting";
