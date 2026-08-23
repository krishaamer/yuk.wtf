import type { PublicObservation, PublicSite } from "@/lib/platform";
import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

async function load() {
  try {
    const [sites, observations] = await Promise.all([
      supabaseRest<PublicSite[]>("yuk_public_sites?select=*&limit=500", {}, "public"),
      supabaseRest<PublicObservation[]>("yuk_public_observations?select=*&order=observed_at.desc&limit=1000", {}, "public"),
    ]);
    return { sites, observations };
  } catch {
    return { sites: [], observations: [] };
  }
}

export default async function DataPage() {
  const { sites, observations } = await load();
  const materialCounts = observations.reduce<Record<string, number>>((acc, observation) => {
    const key = observation.material?.trim() || "unclassified";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const materials = Object.entries(materialCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/">feed</a><a href="/map">map</a><a href="/platform">platform</a></nav>
        </header>

        <p className="eyebrow">OPEN DATA IS THE PRODUCT, NOT AN EXPORT BUTTON</p>
        <h1 className="platform-title">trash is data.</h1>
        <p className="platform-lede">
          YUK publishes privacy-safe derived records while keeping exact coordinates and original evidence private by default. Model output keeps its provenance and human corrections remain visible as later interpretations.
        </p>

        <div className="metric-grid">
          <div className="metric"><strong>{observations.length}</strong><span>public observations</span></div>
          <div className="metric"><strong>{sites.length}</strong><span>persistent sites</span></div>
          <div className="metric"><strong>{materials.length}</strong><span>visible material labels</span></div>
        </div>

        <div className="platform-grid">
          <article className="platform-card">
            <span className="label">JSON API</span>
            <h2>Sites</h2>
            <p>Persistent public places with deliberately rounded coordinates and current believed state.</p>
            <a className="code-link" href="/api/open-data/sites">/api/open-data/sites</a>
          </article>
          <article className="platform-card">
            <span className="label">JSON API</span>
            <h2>Observations</h2>
            <p>Timestamped evidence with current public classification, confidence and source-safe geometry.</p>
            <a className="code-link" href="/api/open-data/observations">/api/open-data/observations</a>
          </article>
          <article className="platform-card">
            <span className="label">DESIGN RULE</span>
            <h2>History beats overwrite</h2>
            <p>A cleanup, correction or better model creates more evidence. It does not silently rewrite the past.</p>
          </article>
        </div>

        <section>
          <p className="eyebrow">MATERIALS SEEN</p>
          <div className="site-grid">
            {materials.length ? materials.map(([material, count]) => (
              <article className="site-card" key={material}>
                <span className="label">{count} observation{count === 1 ? "" : "s"}</span>
                <h2>{material}</h2>
              </article>
            )) : <article className="site-card"><h2>No public material data yet.</h2><p>The first published litter observations will appear here.</p></article>}
          </div>
        </section>
      </div>
    </main>
  );
}
