import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type Point = {
  series_key: string;
  geography_key: string | null;
  period_start: string;
  value: number;
  unit: string;
  source_slug: string;
  source_name: string;
  source_url: string | null;
};

function pathFor(points: Point[]) {
  if (!points.length) return "";
  const values = points.map((point) => Number(point.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  return points.map((point, index) => {
    const x = points.length === 1 ? 500 : 30 + (index / (points.length - 1)) * 940;
    const y = 360 - ((Number(point.value) - min) / span) * 320;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

export default async function HistoryPage() {
  let series: Point[] = [];
  try {
    series = await supabaseRest<Point[]>(
      "yuk_public_legacy_series?series_key=eq.reports.cumulative&geography_key=eq.global&select=*&order=period_start.asc&limit=5000",
    );
  } catch {
    series = [];
  }

  const first = series[0];
  const last = series.at(-1);
  const path = pathFor(series);

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/data">data</a><a href="/map">map</a><a href="/platform">platform</a></nav>
        </header>

        <p className="eyebrow">THE OLD DATA IS ANCESTRY, NOT CURRENT TRUTH</p>
        <h1 className="platform-title">217,317 reports before YUK.</h1>
        <p className="platform-lede">
          The inherited Let&apos;s Do It World Open Data timeline is preserved as an aggregate historical series. YUK does not pretend these totals are modern observations or that the corresponding waste still exists.
        </p>

        <div className="metric-grid">
          <div className="metric"><strong>{series.length}</strong><span>historical monthly points</span></div>
          <div className="metric"><strong>{first ? new Date(first.period_start).getUTCFullYear() : "?"}</strong><span>first preserved point</span></div>
          <div className="metric"><strong>{last ? Number(last.value).toLocaleString("en-US") : "0"}</strong><span>final cumulative reports</span></div>
        </div>

        <div className="diagram-frame" style={{ marginTop: 36, overflow: "hidden" }}>
          {path ? (
            <svg viewBox="0 0 1000 400" role="img" aria-label="Historical cumulative waste report series from 2009 to 2018" style={{ display: "block", width: "100%", height: "auto" }}>
              <line x1="30" y1="360" x2="970" y2="360" stroke="currentColor" strokeWidth="2" />
              <path d={path} fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="970" cy="40" r="11" fill="currentColor" />
              <text x="30" y="390" fontSize="18">2009</text>
              <text x="970" y="390" fontSize="18" textAnchor="end">2018</text>
              <text x="950" y="75" fontSize="22" textAnchor="end" fontWeight="800">217,317</text>
            </svg>
          ) : <div className="map-empty">Historical series unavailable.</div>}
        </div>

        <div className="platform-grid" style={{ marginTop: 36 }}>
          <article className="platform-card">
            <span className="label">PROVENANCE</span>
            <h2>{first?.source_name || "Let's Do It World Open Data"}</h2>
            <p>Imported from the historical Open Data graph dataset with the source file and aggregation semantics retained.</p>
          </article>
          <article className="platform-card">
            <span className="label">BOUNDARY</span>
            <h2>Aggregate stays aggregate.</h2>
            <p>A historical count cannot be expanded into individual YUK Observations without inventing evidence that we do not have.</p>
          </article>
          <article className="platform-card">
            <span className="label">JSON API</span>
            <h2>History</h2>
            <p>The full preserved series is machine-readable alongside modern Site and Observation APIs.</p>
            <a className="code-link" href="/api/open-data/history">history JSON</a>
          </article>
        </div>
      </div>
    </main>
  );
}
