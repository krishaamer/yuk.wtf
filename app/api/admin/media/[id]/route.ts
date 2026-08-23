import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { downloadPrivateMedia } from "@/lib/media-storage";
import { supabaseRest } from "@/lib/supabase-rest";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  try {
    const rows = await supabaseRest<Array<{ storage_path: string }>>(
      `yuk_media?id=eq.${encodeURIComponent(id)}&select=storage_path&limit=1`,
    );
    if (!rows[0]) return NextResponse.json({ error: "Media not found." }, { status: 404 });

    const object = await downloadPrivateMedia(rows[0].storage_path);
    return new NextResponse(Buffer.from(object.bytes), {
      headers: {
        "Content-Type": object.contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("YUK operator media preview failed", error);
    return NextResponse.json({ error: "Media unavailable." }, { status: 503 });
  }
}
