import { NextResponse } from "next/server";
import type { YukAnalysis } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_VISION_MODEL || "gpt-5-mini";

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
3. the most likely local disposal route,
4. what probably happens to it after disposal,
5. why the packaging/material is good, bad, or confusing,
6. one realistic lower-waste alternative.

${locationText}

Local waste rules vary. Never invent a precise municipal rule when you are unsure. If location or local rules are uncertain, say so plainly and lower confidence.

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
  "bin": "most likely disposal category",
  "destination": "likely next physical destination",
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
      max_output_tokens: 700,
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
    const analysis = JSON.parse(cleanJson(outputText)) as YukAnalysis;
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Could not parse YUK analysis", error, outputText);
    return NextResponse.json(
      { error: "YUK's stomach produced invalid JSON. Very on brand, not very useful." },
      { status: 502 },
    );
  }
}
