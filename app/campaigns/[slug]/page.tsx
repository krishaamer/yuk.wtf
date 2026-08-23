import { notFound } from "next/navigation";
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

type CampaignSite = {
  role: string;
  site_id: string;
  yuk_sites: {
    id: string;
    title: string | null;
    status: string;
    last_observed_at: string | null;
    public_visibility: string;
  } | null;
};

type Intervention = {
  id: string;
  title: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let campaign: Campaign | undefined;
  let sites: CampaignSite[] = [];
  let interventions: Intervention[] = [];

  try {
    const campaigns = await supabaseRest<Campaign[]>(
      `yuk_public_campaigns?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
    );
    campaign = campaigns[0];
    if (!campaign) notFound();

    [sites, interventions] = await Promise.all([
      supabaseRest<CampaignSite[]>(
        `yuk_campaign_sites?campaign_id=eq.${campaign.id}&select=role,site_id,yuk_sites(id,title,status,last_observed_at,public_visibility)&order=created_at.asc`,
      ),
      supabaseRest<Intervention[]>(
        `yuk_interventions?campaign_id=eq.${campaign.id}&select=id,title,status,starts_at,ends_at,created_at&order=created_at.desc`,
      ),
    ]);
  } catch (error) {
    if (!campaign) notFound();
    console.error("YUK campaign detail failed", error);
  }

  if (!campaign) notFound();
  const publicSites = sites.filter((site) => site.yuk_sites?.public_visibility === "public");

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/campaigns">campaigns</a><a href="/map">map</a><a href="/data">data</a></nav>
        </header>

        <p className="eyebrow">{campaign.status}{campaign.jurisdiction_name ? ` · ${campaign.jurisdiction_name}` : ""}</p>
        <h1 className="platform-title">{campaign.title}</h1>
        <p className="platform-lede">{campaign.description || "A YUK cleanup campaign built around persistent waste Sites and evidence-backed interventions."}</p>

        {campaign.organization_name && campaign.organization_slug && (
          <a className="code-link" href={`/organizations/${campaign.organization_slug}`}>by {campaign.organization_name}</a>
        )}

        <div className="metric-grid">
          <div className="metric"><strong>{campaign.site_count}</strong><span>target sites</span></div>
          <div className="metric"><strong>{campaign.completed_interventions}</strong><span>completed interventions</span></div>
          <div className="metric"><strong>{publicSites.filter((entry) => entry.yuk_sites?.status === "verified_clean").length}</strong><span>verified clean public sites</span></div>
        </div>

        <section>
          <p className="eyebrow">SITES</p>
          <div className="site-grid">
            {publicSites.length ? publicSites.map((entry) => (
              <article className="site-card" key={entry.site_id}>
                <span className="label">{entry.role} · {entry.yuk_sites?.status.replaceAll("_", " ")}</span>
                <h2><a href={`/sites/${entry.site_id}`}>{entry.yuk_sites?.title || "Unnamed waste site"}</a></h2>
                <p>{entry.yuk_sites?.last_observed_at ? `Last evidence ${new Date(entry.yuk_sites.last_observed_at).toLocaleDateString("en-GB")}` : "No dated evidence yet."}</p>
                <a className="text-link" href={`/cleanup?site=${entry.site_id}&campaign=${campaign.id}`}>we cleaned it</a>
              </article>
            )) : <article className="site-card"><h2>No public target Sites yet.</h2></article>}
          </div>
        </section>

        <section style={{ marginTop: 58 }}>
          <p className="eyebrow">INTERVENTIONS</p>
          <div className="timeline">
            {interventions.length ? interventions.map((intervention) => (
              <article className="timeline-item" key={intervention.id}>
                <time>{new Date(intervention.ends_at || intervention.starts_at || intervention.created_at).toLocaleString("en-GB")}</time>
                <div><strong>{intervention.title || "Cleanup"} · {intervention.status}</strong></div>
              </article>
            )) : <article className="timeline-item"><strong>No cleanup interventions yet.</strong></article>}
          </div>
        </section>
      </div>
    </main>
  );
}
