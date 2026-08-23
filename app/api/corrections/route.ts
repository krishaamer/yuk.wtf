import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export const runtime = "nodejs";

type Correction = {
  observationId?: string;
  item?: string;
  material?: string;
  bin?: string;
  destination?: string;
  note?: string;
};

function clean(value?: string) {
  return value?.trim().slice(0, 500) || null;
}

export async function POST(request: Request) {
  let body: Correction;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad correction payload." }, { status: 400 });
  }

  if (!body.observationId) {
    return NextResponse.json({ error: "Missing observation ID." }, { status: 400 });
  }

  try {
    const previous = await supabaseRest<Array<{ id: string; item: string | null; material: string | null; disposal_bin: string | null; disposal_destination: string | null }>>(
      `yuk_classifications?observation_id=eq.${encodeURIComponent(body.observationId)}&select=id,item,material,disposal_bin,disposal_destination&order=is_human_corrected.desc,created_at.desc&limit=1`,
    );

    if (!previous[0]) {
      return NextResponse.json({ error: "Observation classification not found." }, { status: 404 });
    }

    const current = previous[0];
    const inserted = await supabaseRest<Array<{ id: string }>>("yuk_classifications?select=id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        observation_id: body.observationId,
        supersedes_id: current.id,
        item: clean(body.item) ?? current.item,
        material: clean(body.material) ?? current.material,
        disposal_bin: clean(body.bin) ?? current.disposal_bin,
        disposal_destination: clean(body.destination) ?? current.disposal_destination,
        confidence: 1,
        model: "human",
        is_human_corrected: true,
        payload: { note: clean(body.note), corrected_at: new Date().toISOString() },
      }),
    });

    return NextResponse.json({ correctionId: inserted[0]?.id });
  } catch (error) {
    console.error("YUK correction failed", error);
    return NextResponse.json({ error: "YUK could not save that correction." }, { status: 503 });
  }
}
