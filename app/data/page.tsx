import type { PublicObservation, PublicSite } from "@/lib/platform";
import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type MaterialStat = { material: string; observation_count: number; site_count: number; last_seen_at: string | null };
type BrandStat = { brand: string; observation_count: number; site_count: number; last_seen_at: string | null };
type HeatCell = { latitude: number; longitude: number; observation_count: number; site_count: number; last_seen_at: string | null };

async function load() {
  try {
    const [sites, observations, materials, brands, heatmap] = await Promise.all([
      supabaseRest<PublicSite[]>("yuk_public_sites?select=*&limit=5000"),
      supabaseRest<PublicObservation[]>("yuk_public_observations?select=*&order=observed_at.desc&limit=5000"),
      supabaseRest<MaterialStat[]>("yuk_public_material_stats?select=*&order=observation_count.desc&limit=100"),
      supabaseRest<BrandStat[]>("yuk_public_brand_stats?select=*&order=observation_count.desc&limit=100"),
      supabaseRest<HeatCell[]>("yuk_public_heatmap?select=*&order=observation_count.desc&limit=2000"),
    ]);
    return { sites, observations, materials, brands, heatmap };
  } catch {
    return { sites: [], observations: [], materials: [], brands: [], heatmap: [] };
  }
}

export default async function DataPage() {
  const { sites, observations, materials, brands, heatmap } = await load();
  const classified = observations.filter((observation) => observation.item || observation.material).length;
  const classificationRate = observations.length ? Math.round((classified / observations.length) * 100) : 0;

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/map">map</a><a href="/campaigns">campaigns</a><a href="/organizations">organizations</a></nav>
        </header>

        <p className="eyebrow">OPEN DATA IS THE PRODUCT, NOT AN EXPORT BUTTON</p>
        <h1 className="platform-title">trash is data.</h1>
        <p className="platform-lede">
          YUK turns public evidence into reusable waste intelligence while keeping exact evidence geometry and original media private. Aggregate material, brand and hotspot views are derived from the same observation history.
        </p>

        <div className="metric-grid">
          <div className="metric"><strong>{observations.length}</strong><span>public observations loaded</span></div>
          <div className="metric"><strong>{sites.length}</strong><span>persistent public sites</span></div>
          <div className="metric"><strong>{classificationRate}%</strong><span>with a public classification</span></div>
        </div>

        <div className="platform-grid">
          <article className="platform-card"><span className="label">RAW EVIDENCE API</span><h2>Observations</h2><p>Timestamped evidence with privacy-safe geometry and the current public interpretation.</p><a className="code-link" href="/api/open-data/observations">observations JSON</a></article>
          <article className="platform-card"><span className="label">WORLD MODEL API</span><h2>Sites</h2><p>Persistent places with deliberately reduced public precision and current believed state.</p><a className="code-link" href="/api/open-data/sites">sites JSON</a></article>
          <article className="platform-card"><span className="label">SPATIAL AGGREGATE</span><h2>Heatmap</h2><p>Coarse cells aggregate litter observations without exposing exact evidence coordinates.</p><a className="code-link" href="/api/open-data/heatmap">heatmap JSON</a></article>
          <article className="platform-card"><span className="label">MATERIAL INTELLIGENCE</span><h2>Materials</h2><p>What public waste evidence is made of, aggregated across observations and Sites.</p><a className="code-link" href="/api/open-data/materials">materials JSON</a></article>
          <article className="platform-card"><span className="label">ACCOUNTABILITY</span><h2>Brands</h2><p>Brand observations when the evidence is strong enough to publish, without treating recognition as unquestionable truth.</p><a className="code-link" href="/api/open-data/brands">brands JSON</a></article>
          <article className="platform-card"><span className="label">ACTION NETWORK</span><h2>Campaigns + organizations</h2><p>Who is stewarding places and coordinating cleanups remains separate from who originally reported the evidence.</p><div className="result-actions"><a className="code-link" href="/api/open-data/campaigns">campaigns JSON</a><a className="code-link" href="/api/open-data/organizations">organizations JSON</a></div></article>
        </div>

        <section style={{ marginTop: 60 }}>
          <p className="eyebrow">MATERIALS SEEN</p>
          <div className="site-grid">
            {materials.length ? materials.slice(0, 12).map((material) => (
              <article className="site-card" key={material.material}>
                <span className="label">{material.observation_count} observations · {material.site_count} sites</span>
                <h2>{material.material}</h2>
                <p>{material.last_seen_at ? `Last public evidence ${new Date(material.last_seen_at).toLocaleDateString("en-GB")}` : ""}</p>
              </article>
            )) : <article className="site-card"><h2>No public material data yet.</h2><p>The first published litter observations will appear here.</p></article>}
          </div>
        </section>

        <section style={{ marginTop: 60 }}>
          <p className="eyebrow">BRANDS SEEN</p>
          <div className="site-grid">
            {brands.length ? brands.slice(0, 12).map((brand) => (
              <article className="site-card" key={brand.brand}>
                <span className="label">{brand.observation_count} observations · {brand.site_count} sites</span>
                <h2>{brand.brand}</h2>
              </article>
            )) : <article className="site-card"><h2>No public brand data yet.</h2><p>Brand intelligence only appears when a published classification contains a brand assertion.</p></article>}
          </div>
        </section>

        <section style={{ marginTop: 60 }}>
          <p className="eyebrow">HOTSPOT CELLS</p>
          <div className="site-grid">
            {heatmap.length ? heatmap.slice(0, 12).map((cell) => (
              <article className="site-card" key={`${cell.latitude}-${cell.longitude}`}>
                <span className="label">{cell.observation_count} observations · {cell.site_count} sites</span>
                <h2>{cell.latitude.toFixed(2)}, {cell.longitude.toFixed(2)}</h2>
                <p>Coarse aggregate cell. Exact evidence coordinates remain private.</p>
              </article>
            )) : <article className="site-card"><h2>No public hotspots yet.</h2></article>}
          </div>
        </section>
      </div>
    </main>
  );
}
