import type { PublicSite } from "@/lib/platform";
import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

async function getSites() {
  try {
    return await supabaseRest<PublicSite[]>(
      "yuk_public_sites?select=*&order=last_observed_at.desc.nullslast&limit=500",
      {},
      "public",
    );
  } catch {
    return [];
  }
}

function position(site: PublicSite, sites: PublicSite[]) {
  if (sites.length < 2) return { left: 50, top: 50 };
  const lats = sites.map((item) => item.latitude);
  const lngs = sites.map((item) => item.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.02);
  const lngSpan = Math.max(maxLng - minLng, 0.02);
  return {
    left: 8 + ((site.longitude - minLng) / lngSpan) * 84,
    top: 92 - ((site.latitude - minLat) / latSpan) * 84,
  };
}

export default async function MapPage() {
  const sites = await getSites();

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/">feed</a><a href="/data">data</a><a href="/platform">platform</a></nav>
        </header>

        <p className="eyebrow">THE WORLD, AS CURRENTLY BELIEVED</p>
        <h1 className="platform-title">waste that remembers.</h1>
        <p className="platform-lede">
          A dot is not a report. It is a persistent site built from observations over time. Public coordinates are intentionally reduced in precision.
        </p>

        <div className="metric-grid">
          <div className="metric"><strong>{sites.length}</strong><span>public sites</span></div>
          <div className="metric"><strong>{sites.filter((site) => site.status === "verified_clean").length}</strong><span>verified clean</span></div>
          <div className="metric"><strong>{sites.filter((site) => site.status === "reappeared").length}</strong><span>reappeared</span></div>
        </div>

        <div className="map-field" aria-label="Approximate public waste site map">
          {!sites.length && <div className="map-empty">Nothing public yet. Feed YUK litter and choose to publish the site.</div>}
          {sites.map((site) => {
            const point = position(site, sites);
            return (
              <a
                key={site.id}
                className="map-dot"
                href={`/sites/${site.id}`}
                style={{ left: `${point.left}%`, top: `${point.top}%` }}
                title={`${site.title || "Waste site"} · ${site.status}`}
                aria-label={`Open ${site.title || "waste site"}`}
              >
                {site.status === "verified_clean" ? "✓" : "●"}
              </a>
            );
          })}
        </div>

        <div className="site-grid">
          {sites.slice(0, 12).map((site) => (
            <article className="site-card" key={site.id}>
              <span className="label">{site.status.replaceAll("_", " ")}</span>
              <h2><a href={`/sites/${site.id}`}>{site.title || "Unnamed waste site"}</a></h2>
              <p>{site.latitude.toFixed(3)}, {site.longitude.toFixed(3)} · public precision ≥ {site.location_accuracy_m} m</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
