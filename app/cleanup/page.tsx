import { CleanupForm } from "@/components/CleanupForm";

export default async function CleanupPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site = "" } = await searchParams;

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/map">map</a><a href="/data">data</a><a href="/">feed</a></nav>
        </header>

        <p className="eyebrow">INTERVENTION, NOT DELETION</p>
        <h1 className="platform-title">we cleaned it.</h1>
        <p className="platform-lede">
          A cleanup becomes another piece of evidence in the site history. YUK records what happened without erasing the earlier waste observations or automatically treating one report as independent verification.
        </p>

        <CleanupForm siteId={site} />
      </div>
    </main>
  );
}
