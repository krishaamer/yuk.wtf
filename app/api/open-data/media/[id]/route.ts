import { NextResponse } from "next/server";
import { downloadPrivateMedia } from "@/lib/media-storage";
import { supabaseRest } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const mediaRows = await supabaseRest<Array<{
      id: string;
      observation_id: string;
      storage_path: string;
      public_storage_path: string | null;
      redaction_status: string;
    }>>(`yuk_media?id=eq.${encodeURIComponent(id)}&select=id,observation_id,storage_path,public_storage_path,redaction_status&limit=1`);

    const media = mediaRows[0];
    if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });

    const observations = await supabaseRest<Array<{ public_visibility: string }>>(
      `yuk_observations?id=eq.${encodeURIComponent(media.observation_id)}&select=public_visibility&limit=1`,
    );
    if (observations[0]?.public_visibility !== "public") {
      return NextResponse.json({ error: "Media not public." }, { status: 404 });
    }

    let path: string | null = null;
    if (media.redaction_status === "redacted" && media.public_storage_path) {
      path = media.public_storage_path;
    } else if (media.redaction_status === "not_needed") {
      path = media.storage_path;
    }

    if (!path) {
      return NextResponse.json({ error: "Media has not passed publication review." }, { status: 404 });
    }

    const object = await downloadPrivateMedia(path);
    return new NextResponse(Buffer.from(object.bytes), {
      headers: {
        "Content-Type": object.contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("YUK public media failed", error);
    return NextResponse.json({ error: "Media unavailable." }, { status: 503 });
  }
}
