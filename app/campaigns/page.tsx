import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  organization_slug: string | null;
  organization_name: string | null;
  jurisdiction_name: string | null;
  site_count: number;
  completed_interventions: number;
};

export default async function CampaignsPage() {
  let campaigns: Campaign[] = [];
  try {
    campaigns = await supabaseRest<Campaign[]>(
      "yuk_public_campaigns?select=*&order=starts_at.desc.nullslast&limit=500",
    );
  } catch {
    campaigns = [];
  }

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/map">map</a><a href="/organizations">organizations</a><a href="/data">data</a></nav>
        </header>

        <p className="eyebrow">COORDINATE ACTION WITHOUT MAKING EVENTS THE DATABASE</p>
        <h1 className="platform-title">cleanup campaigns.</h1>
        <p className="platform-lede">
          Campaigns organize people around a set of Sites. Observations remain evidence, Sites remain places, and completed cleanups remain interventions that can be checked again later.
        </p>

        <div className="site-grid">
          {campaigns.length ? campaigns.map((campaign) => (
            <article className="site-card" key={campaign.id}>
              <span className="label">{campaign.status}{campaign.jurisdiction_name ? ` · ${campaign.jurisdiction_name}` : ""}</span>
              <h2><a href={`/campaigns/${campaign.slug}`}>{campaign.title}</a></h2>
              <p>{campaign.description || `${campaign.site_count} target sites and ${campaign.completed_interventions} completed interventions.`}</p>
              {campaign.organization_name && campaign.organization_slug && (
                <a className="text-link" href={`/organizations/${campaign.organization_slug}`}>{campaign.organization_name}</a>
              )}
            </article>
          )) : (
            <article className="site-card"><span className="label">FOUNDATION READY</span><h2>No public campaigns yet.</h2><p>The old event capability now has a modern data model ready for real cleanup coordination.</p></article>
          )}
        </div>
      </div>
    </main>
  );
}
