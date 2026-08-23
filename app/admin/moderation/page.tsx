import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAdminSession, isAdmin } from "@/lib/admin";
import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type QueueItem = {
  id: string;
  queue_type: "site_match" | "classification" | "media_redaction";
  priority: number;
  title: string;
  created_at: string;
  payload: Record<string, unknown>;
};

type Merge = {
  id: string;
  source_site_id: string;
  target_site_id: string;
  reason: string | null;
  status: "active" | "reverted";
  merged_at: string;
  reverted_at: string | null;
};

async function requireAdmin() {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
}

async function resolveSiteMatch(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const action = String(formData.get("action") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!id || !["accept", "reject"].includes(action)) return;
  await supabaseRest("rpc/yuk_resolve_site_match_proposal", {
    method: "POST",
    body: JSON.stringify({ p_proposal_id: id, p_action: action, p_reason: reason || null }),
  });
  revalidatePath("/admin/moderation");
}

async function reviewClassification(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim();
  if (!id || !["accepted", "rejected"].includes(status)) return;
  await supabaseRest(`yuk_classifications?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ moderation_status: status, reviewed_at: new Date().toISOString(), review_note: note || null }),
  });
  revalidatePath("/admin/moderation");
}

async function reviewMedia(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim();
  if (!id || !["not_needed", "blocked"].includes(status)) return;
  await supabaseRest(`yuk_media?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ redaction_status: status, reviewed_at: new Date().toISOString(), review_note: note || null }),
  });
  revalidatePath("/admin/moderation");
}

async function unmerge(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!id) return;
  await supabaseRest("rpc/yuk_unmerge_sites", {
    method: "POST",
    body: JSON.stringify({ p_merge_id: id, p_reason: reason || null }),
  });
  revalidatePath("/admin/moderation");
}

async function logout() {
  "use server";
  await clearAdminSession();
  redirect("/admin");
}

export default async function ModerationPage() {
  if (!(await isAdmin())) redirect("/admin");

  let queue: QueueItem[] = [];
  let merges: Merge[] = [];
  try {
    [queue, merges] = await Promise.all([
      supabaseRest<QueueItem[]>("yuk_moderation_queue?select=*&order=priority.desc,created_at.asc&limit=500"),
      supabaseRest<Merge[]>("yuk_site_merges?status=eq.active&select=id,source_site_id,target_site_id,reason,status,merged_at,reverted_at&order=merged_at.desc&limit=100"),
    ]);
  } catch (error) {
    console.error("YUK moderation queue failed", error);
  }

  const siteMatches = queue.filter((item) => item.queue_type === "site_match");
  const classifications = queue.filter((item) => item.queue_type === "classification");
  const media = queue.filter((item) => item.queue_type === "media_redaction");

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/map">map</a><a href="/data">data</a><form action={logout}><button className="again" type="submit">logout</button></form></nav>
        </header>

        <p className="eyebrow">SERVER-ONLY OPERATOR SURFACE</p>
        <h1 className="platform-title">moderate uncertainty.</h1>
        <p className="platform-lede">
          The queue exists because YUK is allowed to be uncertain. Operators resolve ambiguous Site matches, review weak classifications and decide whether public evidence media can safely move beyond private storage.
        </p>

        <div className="metric-grid">
          <div className="metric"><strong>{siteMatches.length}</strong><span>possible duplicate Sites</span></div>
          <div className="metric"><strong>{classifications.length}</strong><span>weak classifications</span></div>
          <div className="metric"><strong>{media.length}</strong><span>media redaction reviews</span></div>
        </div>

        <section style={{ marginTop: 58 }}>
          <p className="eyebrow">SITE MATCHES</p>
          <div className="site-grid">
            {siteMatches.length ? siteMatches.map((item) => (
              <article className="site-card" key={item.id}>
                <span className="label">priority {item.priority} · {String(item.payload.distance_m ?? "?")} m</span>
                <h2>{item.title}</h2>
                <p>Score {String(item.payload.score ?? "?")}. Accepting moves the source evidence to the candidate Site and records a reversible merge.</p>
                <form action={resolveSiteMatch} className="correction-form">
                  <input type="hidden" name="id" value={item.id} />
                  <label>Resolution note<input name="reason" placeholder="Why are these the same or different place?" /></label>
                  <div className="result-actions">
                    <button className="again" name="action" value="accept" type="submit">merge Sites</button>
                    <button className="again" name="action" value="reject" type="submit">keep separate</button>
                  </div>
                </form>
              </article>
            )) : <article className="site-card"><h2>No ambiguous Site matches.</h2></article>}
          </div>
        </section>

        <section style={{ marginTop: 58 }}>
          <p className="eyebrow">LOW-CONFIDENCE CLASSIFICATIONS</p>
          <div className="site-grid">
            {classifications.length ? classifications.map((item) => (
              <article className="site-card" key={item.id}>
                <span className="label">priority {item.priority} · confidence {String(item.payload.confidence ?? "?")}</span>
                <h2>{item.title}</h2>
                <p>{String(item.payload.material ?? "material unknown")} · model {String(item.payload.model ?? "unknown")}</p>
                <form action={reviewClassification} className="correction-form">
                  <input type="hidden" name="id" value={item.id} />
                  <label>Review note<input name="note" /></label>
                  <div className="result-actions">
                    <button className="again" name="status" value="accepted" type="submit">accept assertion</button>
                    <button className="again" name="status" value="rejected" type="submit">reject assertion</button>
                  </div>
                </form>
              </article>
            )) : <article className="site-card"><h2>No weak classifications waiting.</h2></article>}
          </div>
        </section>

        <section style={{ marginTop: 58 }}>
          <p className="eyebrow">PUBLIC MEDIA SAFETY</p>
          <div className="site-grid">
            {media.length ? media.map((item) => (
              <article className="site-card" key={item.id}>
                <span className="label">priority {item.priority}</span>
                <h2>{item.title}</h2>
                <p>Original evidence remains private. Mark only media that truly needs no redaction as safe to proceed.</p>
                <form action={reviewMedia} className="correction-form">
                  <input type="hidden" name="id" value={item.id} />
                  <label>Review note<input name="note" /></label>
                  <div className="result-actions">
                    <button className="again" name="status" value="not_needed" type="submit">no redaction needed</button>
                    <button className="again" name="status" value="blocked" type="submit">block publication</button>
                  </div>
                </form>
              </article>
            )) : <article className="site-card"><h2>No public media waiting.</h2></article>}
          </div>
        </section>

        <section style={{ marginTop: 58 }}>
          <p className="eyebrow">ACTIVE MERGES</p>
          <div className="site-grid">
            {merges.length ? merges.map((merge) => (
              <article className="site-card" key={merge.id}>
                <span className="label">merged {new Date(merge.merged_at).toLocaleString("en-GB")}</span>
                <h2>{merge.source_site_id.slice(0, 8)} → {merge.target_site_id.slice(0, 8)}</h2>
                <p>{merge.reason || "No merge note."}</p>
                <form action={unmerge} className="correction-form">
                  <input type="hidden" name="id" value={merge.id} />
                  <label>Why revert?<input name="reason" required /></label>
                  <button className="again" type="submit">undo merge</button>
                </form>
              </article>
            )) : <article className="site-card"><h2>No active Site merges.</h2></article>}
          </div>
        </section>
      </div>
    </main>
  );
}
