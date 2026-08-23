import { CleanupForm } from "@/components/CleanupForm";

export default async function CleanupPage({ searchParams }: { searchParams: Promise<{ site?: string; campaign?: string }> }) {
  const { site = "", campaign = "" } = await searchParams;

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/map">map</a><a href="/campaigns">campaigns</a><a href="/data">data</a><a href="/">feed</a></nav>
        </header>

        <p className="eyebrow">INTERVENTION, NOT DELETION</p>
        <h1 className="platform-title">we cleaned it.</h1>
        <p className="platform-lede">
          A cleanup becomes another piece of evidence in the Site history. When it belongs to a campaign, the same transaction advances campaign progress without erasing earlier observations or claiming independent verification.
        </p>

        <CleanupForm siteId={site} campaignId={campaign} />
      </div>
    </main>
  );
}
