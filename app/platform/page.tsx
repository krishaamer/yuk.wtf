const capabilities = [
  ["Capture", "Camera-first personal discards and litter observations with AI interpretation, confidence and source provenance."],
  ["Sites", "Persistent physical places that accumulate evidence instead of disposable trashpoint pins."],
  ["Cleanup", "Interventions and verification change believed state without deleting the history of what happened."],
  ["Offline", "Client-generated IDs and an idempotency ledger establish the contract for durable mobile operation logs."],
  ["Open data", "Privacy-safe views expose rounded geometry and derived classifications while originals stay private."],
  ["Organizations", "Community groups, municipalities and cleanup crews are first-class entities instead of identity hacks."],
  ["Disposal rules", "Authoritative local rules have their own versioned data layer rather than being invented by the model."],
  ["AI", "Models interpret sensors, suggest matches and classify evidence. Human corrections supersede output instead of erasing it."],
  ["Imports", "World Cleanup, Open Data, WADE, TrashAI and future datasets enter as attributed sources and observations."],
];

export default function PlatformPage() {
  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/">feed</a><a href="/map">map</a><a href="/data">data</a></nav>
        </header>

        <p className="eyebrow">THE 2018 PRODUCT, REBUILT AROUND EVIDENCE</p>
        <h1 className="platform-title">the whole thing, again.</h1>
        <p className="platform-lede">
          YUK is not a recycling scanner bolted onto old software. The modern implementation is the convergence point for World Cleanup mapping, cleanup coordination, open data and machine waste recognition.
        </p>

        <div className="platform-grid">
          {capabilities.map(([title, copy], index) => (
            <article className="platform-card" key={title}>
              <span className="label">{String(index + 1).padStart(2, "0")}</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </div>

        <section className="site-card">
          <span className="label">ONE DOMAIN MODEL</span>
          <h2>capture → observation → site → verification → intervention → current belief</h2>
          <p>
            Personal discards can stay private. Litter can become public evidence. Cleanup adds an intervention. Reappearance adds another observation. Nothing important needs to be destroyed to make the interface look current.
          </p>
        </section>
      </div>
    </main>
  );
}
