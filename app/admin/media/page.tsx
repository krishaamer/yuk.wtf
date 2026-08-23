import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { uploadReviewedDerivative } from "@/lib/media-storage";
import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

const MAX_DERIVATIVE_BYTES = 15 * 1024 * 1024;

type ReviewItem = {
  id: string;
  observation_id: string;
  redaction_status: string;
  created_at: string;
  review_note: string | null;
};

async function guard() {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
}

function extension(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

async function uploadDerivative(formData: FormData) {
  "use server";
  await guard();
  const mediaId = String(formData.get("mediaId") || "");
  const note = String(formData.get("note") || "").trim();
  const file = formData.get("file");

  if (!mediaId || !(file instanceof File) || !file.type.startsWith("image/") || file.size <= 0 || file.size > MAX_DERIVATIVE_BYTES) {
    return;
  }

  const rows = await supabaseRest<Array<{ id: string; observation_id: string }>>(
    `yuk_media?id=eq.${encodeURIComponent(mediaId)}&select=id,observation_id&limit=1`,
  );
  const media = rows[0];
  if (!media) return;

  const observations = await supabaseRest<Array<{ public_visibility: string }>>(
    `yuk_observations?id=eq.${encodeURIComponent(media.observation_id)}&select=public_visibility&limit=1`,
  );
  if (observations[0]?.public_visibility !== "public") return;

  const path = `${media.observation_id}/public-${media.id}.${extension(file.type)}`;
  await uploadReviewedDerivative(path, new Uint8Array(await file.arrayBuffer()), file.type);
  await supabaseRest(`yuk_media?id=eq.${encodeURIComponent(media.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      public_storage_path: path,
      redaction_status: "redacted",
      redaction_model: "human-reviewed-upload",
      redacted_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      review_note: note || "Reviewed redacted derivative uploaded",
    }),
  });

  revalidatePath("/admin/media");
  revalidatePath("/admin/moderation");
}

async function resolveWithoutDerivative(formData: FormData) {
  "use server";
  await guard();
  const mediaId = String(formData.get("mediaId") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim();
  if (!mediaId || !["not_needed", "blocked"].includes(status)) return;

  await supabaseRest(`yuk_media?id=eq.${encodeURIComponent(mediaId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      redaction_status: status,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
      public_storage_path: null,
    }),
  });
  revalidatePath("/admin/media");
  revalidatePath("/admin/moderation");
}

export default async function MediaReviewPage() {
  if (!(await isAdmin())) redirect("/admin");

  let items: ReviewItem[] = [];
  try {
    const publicObservations = await supabaseRest<Array<{ id: string }>>(
      "yuk_observations?public_visibility=eq.public&select=id&limit=2000",
    );
    const ids = publicObservations.map((row) => row.id);
    if (ids.length) {
      items = await supabaseRest<ReviewItem[]>(
        `yuk_media?observation_id=in.(${ids.join(",")})&redaction_status=eq.pending&select=id,observation_id,redaction_status,created_at,review_note&order=created_at.asc&limit=500`,
      );
    }
  } catch (error) {
    console.error("YUK media review load failed", error);
  }

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/admin/moderation">moderation</a><a href="/admin/operations">operations</a><a href="/data">data</a></nav>
        </header>

        <p className="eyebrow">ORIGINALS NEVER BECOME PUBLIC BY ACCIDENT</p>
        <h1 className="platform-title">review the evidence.</h1>
        <p className="platform-lede">
          Public observations still keep their original image private. Publish only a reviewed derivative, explicitly mark an image as needing no redaction, or block publication. Pending media has no public URL.
        </p>

        <div className="site-grid">
          {items.length ? items.map((item) => (
            <article className="site-card" key={item.id}>
              <span className="label">PENDING · {new Date(item.created_at).toLocaleString("en-GB")}</span>
              <h2>Evidence {item.id.slice(0, 8)}</h2>
              <img
                src={`/api/admin/media/${item.id}`}
                alt="Private evidence under operator review"
                style={{ width: "100%", maxHeight: 360, objectFit: "contain", border: "1px solid currentColor", margin: "12px 0" }}
              />

              <form action={uploadDerivative} className="correction-form">
                <input type="hidden" name="mediaId" value={item.id} />
                <label>
                  Reviewed/redacted derivative
                  <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
                </label>
                <label>Review note<input name="note" placeholder="Faces and plates blurred, document removed…" /></label>
                <button className="again" type="submit">publish reviewed derivative</button>
              </form>

              <form action={resolveWithoutDerivative} className="correction-form">
                <input type="hidden" name="mediaId" value={item.id} />
                <label>Review note<input name="note" /></label>
                <div className="result-actions">
                  <button className="again" name="status" value="not_needed" type="submit">original is safe</button>
                  <button className="again" name="status" value="blocked" type="submit">block publication</button>
                </div>
              </form>
            </article>
          )) : (
            <article className="site-card"><h2>No public evidence waiting for media review.</h2></article>
          )}
        </div>
      </div>
    </main>
  );
}
