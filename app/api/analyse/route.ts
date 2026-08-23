import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";
import type { YukAnalysis, YukDisposalRuleKey } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_VISION_MODEL || "gpt-5-mini";
const RULE_KEYS: YukDisposalRuleKey[] = [
  "mixed",
  "packaging_plastic_metal_carton",
  "glass_packaging",
  "bio",
  "paper_cardboard",
  "batteries",
  "electronics",
  "medicines",
  "hazardous",
  "textile",
  "bulky",
  "other",
];

type DisposalRule = {
  bin: string;
  destination: string | null;
  instructions: string | null;
  source_url: string | null;
  metadata: { authority?: string } | null;
};

function extractOutputText(payload: any): string | null {
  for (const item of payload?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content?.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

function cleanJson(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
}

function looksLikeEstonia(location?: { latitude?: number; longitude?: number }) {
  const lat = location?.latitude;
  const lng = location?.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  return lat >= 57.4 && lat <= 59.9 && lng >= 21.4 && lng <= 28.3;
}

async function applyAuthoritativeGuidance(
  analysis: YukAnalysis,
  location?: { latitude?: number; longitude?: number },
): Promise<YukAnalysis> {
  if (!looksLikeEstonia(location) || !RULE_KEYS.includes(analysis.ruleKey) || analysis.ruleKey === "other") {
    return analysis;
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const rules = await supabaseRest<DisposalRule[]>(
      `yuk_disposal_rules?country_code=eq.EE&item_key=eq.${encodeURIComponent(analysis.ruleKey)}&or=(valid_from.is.null,valid_from.lte.${today})&or=(valid_to.is.null,valid_to.gte.${today})&select=bin,destination,instructions,source_url,metadata&order=valid_from.desc.nullslast&limit=1`,
    );
    const rule = rules[0];
    if (!rule) return analysis;

    return {
      ...analysis,
      bin: rule.bin,
      destination: rule.destination || analysis.destination,
      disposalInstructions: rule.instructions || undefined,
      guidanceSource: rule.metadata?.authority || "authoritative disposal guidance",
      guidanceSourceUrl: rule.source_url || undefined,
      locationNote: "Estonia national sorting guidance applied. Local collection arrangements can still vary.",
    };
  } catch (error) {
    console.error("YUK authoritative disposal lookup failed", error);
    return analysis;
  }
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "YUK has no brain yet. Add OPENAI_API_KEY on the server." },
      { status: 503 },
    );
  }

  let body: { image?: string; location?: { latitude?: number; longitude?: number } };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (!body.image || !body.image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Give YUK an image to eat." }, { status: 400 });
  }

  const locationText =
    typeof body.location?.latitude === "number" && typeof body.location?.longitude === "number"
      ? `Approximate user coordinates: ${body.location.latitude.toFixed(4)}, ${body.location.longitude.toFixed(4)}.`
      : "The user's location is unknown.";

  const prompt = `
You are YUK, a funny but useful trash-analysis creature.

Look at the photographed waste item and identify:
1. what the object most likely is,
2. the main material or mixed materials,
3. which normalized disposal-rule category best fits it,
4. the most likely disposal route when no authoritative rule is available,
5. what probably happens to it after disposal,
6. why the packaging/material is good, bad, or confusing,
7. one realistic lower-waste alternative.

${locationText}

The normalized ruleKey MUST be exactly one of:
${RULE_KEYS.join(", ")}

Use packaging_plastic_metal_carton for ordinary plastic packaging, metal packaging, cans and beverage cartons. Use glass_packaging only for glass packaging. Use paper_cardboard for paper/cardboard that belongs in that material stream. Use batteries, electronics, medicines, hazardous, textile or bulky for those special streams. Use mixed for ordinary residual waste. Use other when none clearly fits.

Local waste rules vary. Never invent a precise municipal rule when you are unsure. The server may replace your disposal guess with an authoritative local rule after you respond.

Choose exactly one reaction emoji:
- 💩 for ordinary residual/general trash or a straightforward waste item
- 🤢 for mixed materials, confusing packaging, contamination, or poor recyclability
- 🤮 for hazardous or special waste that should not go in ordinary trash, such as batteries, chemicals, or electronics

Return ONLY valid JSON with exactly this shape:
{
  "item": "short object name",
  "material": "short material description",
  "emoji": "💩 | 🤢 | 🤮",
  "verdict": "short, punchy YUK-style verdict",
  "ruleKey": "one normalized rule key from the allowed list",
  "bin": "best-effort disposal category",
  "destination": "best-effort next physical destination",
  "reason": "2 to 4 concise sentences",
  "betterAlternative": "one practical alternative",
  "confidence": "high | medium | low",
  "locationNote": "brief note about location dependence"
}
`.trim();

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: body.image },
          ],
        },
      ],
      max_output_tokens: 800,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    console.error("OpenAI analysis failed", payload);
    return NextResponse.json(
      { error: "YUK tried to eat that and got confused. Try another photo." },
      { status: 502 },
    );
  }

  const outputText = extractOutputText(payload);

  if (!outputText) {
    return NextResponse.json({ error: "YUK chewed it but found no answer." }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(cleanJson(outputText)) as YukAnalysis;
    if (!RULE_KEYS.includes(parsed.ruleKey)) parsed.ruleKey = "other";
    const analysis = await applyAuthoritativeGuidance(parsed, body.location);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Could not parse YUK analysis", error, outputText);
    return NextResponse.json(
      { error: "YUK's stomach produced invalid JSON. Very on brand, not very useful." },
      { status: 502 },
    );
  }
}
