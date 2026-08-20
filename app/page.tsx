import { WaitlistForm } from "@/components/WaitlistForm";

function LineageGraph() {
  return (
    <svg className="diagram" viewBox="0 0 920 500" role="img" aria-labelledby="lineage-title lineage-desc">
      <title id="lineage-title">YUK software lineage</title>
      <desc id="lineage-desc">
        The shared World Cleanup mapping project splits into a Haamer Expo and open-source branch and a later World Cleanup React Native branch. Both histories are reunited in 2026 as YUK.
      </desc>
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" className="arrow-head" />
        </marker>
      </defs>
      <path className="line" d="M460 80V145" />
      <path className="line" d="M460 145C460 190 245 175 245 235" />
      <path className="line" d="M460 145C460 190 675 175 675 235" />
      <path className="line" d="M245 310C245 365 460 345 460 410" />
      <path className="line" d="M675 310C675 365 460 345 460 410" />
      <path className="line arrow" d="M460 435V472" markerEnd="url(#arrow)" />

      <g className="node">
        <rect x="330" y="28" width="260" height="70" rx="12" />
        <text x="460" y="58" textAnchor="middle">World Cleanup mapping</text>
        <text className="small" x="460" y="80" textAnchor="middle">2017 → early 2018</text>
      </g>

      <g className="node branch-node">
        <rect x="95" y="235" width="300" height="78" rx="12" />
        <text x="245" y="267" textAnchor="middle">Haamer / Expo + open source</text>
        <text className="small" x="245" y="290" textAnchor="middle">05c2832 · 28 May 2018</text>
      </g>

      <g className="node branch-node">
        <rect x="525" y="235" width="300" height="78" rx="12" />
        <text x="675" y="267" textAnchor="middle">WCD / React Native</text>
        <text className="small" x="675" y="290" textAnchor="middle">1896cb0 · 2 Aug 2018</text>
      </g>

      <g className="node merge-node">
        <rect x="315" y="400" width="290" height="62" rx="31" />
        <text x="460" y="438" textAnchor="middle">reunited · 2026</text>
      </g>

      <g className="node yuk-node">
        <rect x="382" y="470" width="156" height="24" rx="12" />
        <text className="yuk-text" x="460" y="488" textAnchor="middle">YUK</text>
      </g>
    </svg>
  );
}

function WorldModelGraph() {
  return (
    <svg className="diagram world-model" viewBox="0 0 920 500" role="img" aria-labelledby="model-title model-desc">
      <title id="model-title">YUK site and observation model</title>
      <desc id="model-desc">
        Photos, people, imports and models create timestamped observations. Observations update a persistent site. Cleanups are interventions that change the site's state without deleting its history.
      </desc>
      <defs>
        <marker id="model-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" className="arrow-head" />
        </marker>
      </defs>

      <path className="line arrow" d="M200 125C315 125 315 220 405 220" markerEnd="url(#model-arrow)" />
      <path className="line arrow" d="M200 240H405" markerEnd="url(#model-arrow)" />
      <path className="line arrow" d="M200 355C315 355 315 260 405 260" markerEnd="url(#model-arrow)" />
      <path className="line arrow" d="M600 240H735" markerEnd="url(#model-arrow)" />
      <path className="line arrow dashed" d="M790 335C790 395 545 400 515 315" markerEnd="url(#model-arrow)" />

      <g className="node">
        <rect x="70" y="90" width="260" height="70" rx="12" />
        <text x="200" y="120" textAnchor="middle">human evidence</text>
        <text className="small" x="200" y="142" textAnchor="middle">photo · report · verification</text>
      </g>
      <g className="node">
        <rect x="70" y="205" width="260" height="70" rx="12" />
        <text x="200" y="235" textAnchor="middle">machine evidence</text>
        <text className="small" x="200" y="257" textAnchor="middle">camera · model · prediction</text>
      </g>
      <g className="node">
        <rect x="70" y="320" width="260" height="70" rx="12" />
        <text x="200" y="350" textAnchor="middle">external evidence</text>
        <text className="small" x="200" y="372" textAnchor="middle">municipality · import · research</text>
      </g>

      <g className="node branch-node">
        <rect x="405" y="180" width="195" height="120" rx="18" />
        <text x="502" y="225" textAnchor="middle">OBSERVATION</text>
        <text className="small" x="502" y="250" textAnchor="middle">timestamped evidence</text>
        <text className="small" x="502" y="272" textAnchor="middle">+ confidence + source</text>
      </g>

      <g className="node yuk-node">
        <rect x="735" y="185" width="150" height="110" rx="55" />
        <text x="810" y="230" textAnchor="middle">SITE</text>
        <text className="small" x="810" y="254" textAnchor="middle">persistent place</text>
        <text className="small" x="810" y="275" textAnchor="middle">current best state</text>
      </g>

      <g className="node intervention-node">
        <rect x="675" y="335" width="230" height="70" rx="12" />
        <text x="790" y="365" textAnchor="middle">cleanup / intervention</text>
        <text className="small" x="790" y="387" textAnchor="middle">changes state, keeps history</text>
      </g>
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <nav className="nav shell">
        <a className="wordmark" href="#top" aria-label="YUK home">YUK<span>.</span></a>
        <div className="nav-links">
          <a href="#lineage">Lineage</a>
          <a href="#model">Model</a>
          <a href="#waitlist">Waitlist</a>
          <a href="https://github.com/krishaamer/yuk.wtf" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </nav>

      <section id="top" className="hero shell">
        <p className="eyebrow">Waste is visible. The data usually isn’t.</p>
        <h1>YUK<span className="period">.</span></h1>
        <p className="hero-copy">
          Take a photo of waste. YUK helps figure out what it is, whether we’ve seen it before,
          and what changed after someone acted on it.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#waitlist">Join the waitlist ↘</a>
          <a className="button ghost" href="#lineage">Why this exists</a>
        </div>
        <p className="hero-note">A 2026 continuation of the waste-mapping software lineage built for World Cleanup Day.</p>
      </section>

      <section className="manifesto shell ruled-section">
        <p className="section-number">01</p>
        <div>
          <p className="big-statement">
            The map should not be a pile of reports. It should be our best current estimate of
            <em> where waste actually is.</em>
          </p>
          <div className="two-col copy-grid">
            <p>
              A person, municipality, camera or model can all provide evidence. YUK turns that evidence into observations,
              links observations that appear to describe the same physical place, and keeps the history instead of overwriting it.
            </p>
            <p>
              AI is the sensor interpreter, not the authority: identify material, amount, hazard, duplicates and confidence;
              blur faces and plates; then let people confirm what matters.
            </p>
          </div>
        </div>
      </section>

      <section id="lineage" className="shell ruled-section">
        <p className="section-number">02</p>
        <div>
          <div className="section-heading">
            <p className="eyebrow">The project has history</p>
            <h2>Not a clean slate.<br />A recovered lineage.</h2>
          </div>
          <p className="lede">
            In 2018 the World Cleanup mobile code split during a vendor handoff and an Expo → React Native transition.
            The old generation survived by accident in a Haamer Ventures fork. In 2026 both surviving Git histories were
            deliberately reunited before YUK began.
          </p>
          <div className="diagram-frame">
            <LineageGraph />
          </div>
          <div className="fact-row">
            <div><strong>2017</strong><span>mapping platform begins</span></div>
            <div><strong>2018</strong><span>two development generations diverge</span></div>
            <div><strong>2026</strong><span>both histories become YUK ancestry</span></div>
          </div>
          <a className="text-link" href="https://github.com/krishaamer/yuk.wtf/tree/yuk/archaeology/docs/archaeology" target="_blank" rel="noreferrer">
            Read the archaeology on GitHub ↗
          </a>
        </div>
      </section>

      <section id="model" className="shell ruled-section">
        <p className="section-number">03</p>
        <div>
          <div className="section-heading">
            <p className="eyebrow">The important rewrite is conceptual</p>
            <h2>Sites persist.<br />Observations accumulate.</h2>
          </div>
          <p className="lede">
            The old system mostly asked: <strong>where are the trashpoints?</strong> YUK asks what the evidence currently tells us
            about waste in the physical world—and what action changed it.
          </p>
          <div className="diagram-frame">
            <WorldModelGraph />
          </div>
          <div className="principles-grid">
            <article><span>01</span><h3>Camera first</h3><p>Location is automatic. AI structures the evidence. The person confirms.</p></article>
            <article><span>02</span><h3>Offline is normal</h3><p>Capture should survive ferries, forests, weak networks and old phones.</p></article>
            <article><span>03</span><h3>History stays</h3><p>Cleaning a site changes its state; it does not erase what happened there.</p></article>
            <article><span>04</span><h3>Open, with restraint</h3><p>Public data should be useful without exposing people, sensitive media or unsafe precision.</p></article>
          </div>
        </div>
      </section>

      <section className="shell ruled-section why-now">
        <p className="section-number">04</p>
        <div>
          <div className="section-heading">
            <p className="eyebrow">Why now</p>
            <h2>Waste mapping got cheaper.<br />Understanding can catch up.</h2>
          </div>
          <div className="two-col copy-grid">
            <p>
              Phones already know where they are and people already photograph strange things in the street.
              Vision models can now turn a photo into structured evidence cheaply enough to make reporting nearly invisible.
            </p>
            <p>
              The opportunity is not another cleanup counter. It is an open observational layer that can connect citizen evidence,
              cleanup outcomes, municipal data and machine sensing into something researchers and communities can actually use.
            </p>
          </div>
        </div>
      </section>

      <section id="waitlist" className="waitlist-section">
        <div className="shell waitlist-shell">
          <div className="waitlist-copy">
            <p className="eyebrow">Early signal</p>
            <h2>Interested?<br />Get on the list.</h2>
            <p>
              YUK is still at the beginning. Join if you want to test early builds, contribute data or code,
              research waste, or just see where this goes.
            </p>
          </div>
          <WaitlistForm />
        </div>
      </section>

      <footer className="shell footer">
        <p><strong>YUK</strong> · yuk.wtf · 2026</p>
        <p>Independent continuation of historical waste-mapping work. Not the current official World Cleanup Day app.</p>
        <a href="https://github.com/krishaamer/yuk.wtf" target="_blank" rel="noreferrer">Source ↗</a>
      </footer>
    </main>
  );
}
