import { notFound } from "next/navigation";
import type { PublicObservation, PublicSite } from "@/lib/platform";
import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let site: PublicSite | undefined;
  let observations: PublicObservation[] = [];
  try {
    const [sites, rows] = await Promise.all([
      supabaseRest<PublicSite[]>(`yuk_public_sites?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, {}, "public"),
      supabaseRest<PublicObservation[]>(`yuk_public_observations?site_id=eq.${encodeURIComponent(id)}&select=*&order=observed_at.desc`, {}, "public"),
    ]);
    site = sites[0];
    observations = rows;
  } catch {
    notFound();
  }

  if (!site) notFound();

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/map">map</a><a href="/data">data</a><a href="/">feed</a></nav>
        </header>

        <p className="eyebrow">PERSISTENT SITE · {site.status.replaceAll("_", " ")}</p>
        <h1 className="platform-title">{site.title || "unnamed waste site"}</h1>
        <p className="platform-lede">
          This page is a projection over evidence. Cleaning the place does not delete it, and seeing waste here again should become another observation instead of a contradictory new pin.
        </p>

        <div className="metric-grid">
          <div className="metric"><strong>{observations.length}</strong><span>public observations</span></div>
          <div className="metric"><strong>{site.current_confidence ? `${Math.round(site.current_confidence * 100)}%` : "?"}</strong><span>current confidence</span></div>
          <div className="metric"><strong>≥{site.location_accuracy_m}m</strong><span>public location precision</span></div>
        </div>

        <div className="site-grid">
          <article className="site-card">
            <span className="label">APPROXIMATE LOCATION</span>
            <h2>{site.latitude.toFixed(3)}, {site.longitude.toFixed(3)}</h2>
            <p>Exact evidence geometry is not exposed through the public view.</p>
          </article>
          <article className="site-card">
            <span className="label">FIRST SEEN</span>
            <h2>{site.first_observed_at ? new Date(site.first_observed_at).toLocaleDateString("en-GB") : "unknown"}</h2>
          </article>
          <article className="site-card">
            <span className="label">LAST SEEN</span>
            <h2>{site.last_observed_at ? new Date(site.last_observed_at).toLocaleDateString("en-GB") : "unknown"}</h2>
          </article>
        </div>

        <section>
          <p className="eyebrow">EVIDENCE HISTORY</p>
          <div className="timeline">
            {observations.length ? observations.map((observation) => (
              <article className="timeline-item" key={observation.id}>
                <time>{new Date(observation.observed_at).toLocaleString("en-GB")}</time>
                <div>
                  <strong>{observation.kind} · {observation.item || "unclassified waste"}</strong>
                  <p>{observation.material || "material unknown"}{observation.classification_confidence ? ` · ${Math.round(observation.classification_confidence * 100)}% classification confidence` : ""}</p>
                </div>
              </article>
            )) : <article className="timeline-item"><strong>No public evidence is attached to this site yet.</strong></article>}
          </div>
        </section>

        <a className="code-link" href="/">Add another observation</a>
      </div>
    </main>
  );
}
