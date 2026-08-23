import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type ContextFeature = {
  id: string;
  kind: string;
  name: string;
  severity: string;
  instructions: string | null;
  public_visibility: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

async function guard() {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
}

async function createContext(formData: FormData) {
  "use server";
  await guard();

  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const name = String(formData.get("name") || "").trim();
  const instructions = String(formData.get("instructions") || "").trim();
  const sourceUrl = String(formData.get("source_url") || "").trim();

  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return;

  const sources = await supabaseRest<Array<{ id: string }>>("yuk_sources?slug=eq.yuk-web&select=id&limit=1");
  await supabaseRest("yuk_context_features", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      source_id: sources[0]?.id || null,
      source_record_id: `manual:${crypto.randomUUID()}`,
      kind: String(formData.get("kind") || "other"),
      name,
      geometry: `POINT(${longitude} ${latitude})`,
      severity: String(formData.get("severity") || "medium"),
      instructions: instructions || null,
      public_visibility: String(formData.get("visibility") || "public"),
      metadata: {
        entered_by: "yuk-admin",
        source_url: sourceUrl || null,
        geometry_kind: "point-context",
      },
    }),
  });

  revalidatePath("/admin/context");
}

async function removeContext(formData: FormData) {
  "use server";
  await guard();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabaseRest(`yuk_context_features?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  revalidatePath("/admin/context");
}

export default async function ContextAdminPage() {
  if (!(await isAdmin())) redirect("/admin");

  let features: ContextFeature[] = [];
  try {
    features = await supabaseRest<ContextFeature[]>(
      "yuk_context_features?select=id,kind,name,severity,instructions,public_visibility,created_at,metadata&order=created_at.desc&limit=500",
    );
  } catch (error) {
    console.error("YUK context feature load failed", error);
  }

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/admin/moderation">moderation</a><a href="/admin/media">media</a><a href="/admin/operations">operations</a></nav>
        </header>

        <p className="eyebrow">SPATIAL CONTEXT IS DATA, NOT AN AI GUESS</p>
        <h1 className="platform-title">mark sensitive places.</h1>
        <p className="platform-lede">
          Add sourced protected, restricted, hazardous or otherwise sensitive locations. Capture analysis can then warn people from the spatial layer without asking a vision model to infer land status from a photograph.
        </p>

        <form action={createContext} className="correction-form site-card">
          <div className="correction-grid">
            <label>Name<input name="name" required /></label>
            <label>Kind<select name="kind" defaultValue="protected_area"><option value="protected_area">protected area</option><option value="restricted_access">restricted access</option><option value="hazard_zone">hazard zone</option><option value="sensitive_location">sensitive location</option><option value="other">other</option></select></label>
            <label>Severity<select name="severity" defaultValue="medium"><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label>
            <label>Visibility<select name="visibility" defaultValue="public"><option>public</option><option>aggregate</option><option>private</option></select></label>
            <label>Latitude<input name="latitude" inputMode="decimal" required /></label>
            <label>Longitude<input name="longitude" inputMode="decimal" required /></label>
          </div>
          <label>Instructions<textarea name="instructions" rows={3} placeholder="Do not enter fenced area; notify the land manager…" /></label>
          <label>Source URL<input name="source_url" type="url" placeholder="Authoritative page or dataset" /></label>
          <button className="again" type="submit">add spatial context</button>
        </form>

        <section style={{ marginTop: 58 }}>
          <p className="eyebrow">CURRENT FEATURES</p>
          <div className="site-grid">
            {features.length ? features.map((feature) => (
              <article className="site-card" key={feature.id}>
                <span className="label">{feature.kind.replaceAll("_", " ")} · {feature.severity} · {feature.public_visibility}</span>
                <h2>{feature.name}</h2>
                <p>{feature.instructions || "No operator instructions."}</p>
                {typeof feature.metadata?.source_url === "string" && feature.metadata.source_url && <a className="text-link" href={feature.metadata.source_url} target="_blank" rel="noreferrer">source ↗</a>}
                <form action={removeContext}><input type="hidden" name="id" value={feature.id} /><button className="again" type="submit">remove</button></form>
              </article>
            )) : <article className="site-card"><h2>No context features yet.</h2></article>}
          </div>
        </section>
      </div>
    </main>
  );
}
