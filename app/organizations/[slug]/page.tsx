import { notFound } from "next/navigation";
import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type Organization = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  description: string | null;
  country_code: string | null;
  website: string | null;
};

type Campaign = {
  id: string;
  slug: string;
  title: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  site_count: number;
  completed_interventions: number;
};

type Stewardship = {
  role: string;
  valid_from: string | null;
  valid_to: string | null;
  yuk_jurisdictions: { slug: string; name: string; kind: string; country_code: string | null } | null;
};

export default async function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let organization: Organization | undefined;
  let campaigns: Campaign[] = [];
  let stewardship: Stewardship[] = [];

  try {
    const organizations = await supabaseRest<Organization[]>(
      `yuk_public_organizations?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
    );
    organization = organizations[0];
    if (!organization) notFound();

    [campaigns, stewardship] = await Promise.all([
      supabaseRest<Campaign[]>(
        `yuk_public_campaigns?organization_id=eq.${organization.id}&select=id,slug,title,status,starts_at,ends_at,site_count,completed_interventions&order=starts_at.desc.nullslast`,
      ),
      supabaseRest<Stewardship[]>(
        `yuk_stewardships?organization_id=eq.${organization.id}&select=role,valid_from,valid_to,yuk_jurisdictions(slug,name,kind,country_code)&order=valid_from.desc.nullslast`,
      ),
    ]);
  } catch (error) {
    if (!organization) notFound();
    console.error("YUK organization detail failed", error);
  }

  if (!organization) notFound();

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/organizations">organizations</a><a href="/campaigns">campaigns</a><a href="/map">map</a></nav>
        </header>

        <p className="eyebrow">{organization.kind}{organization.country_code ? ` · ${organization.country_code}` : ""}</p>
        <h1 className="platform-title">{organization.name}</h1>
        <p className="platform-lede">{organization.description || "A public organization participating in the YUK waste intelligence network."}</p>
        {organization.website && <a className="code-link" href={organization.website} target="_blank" rel="noreferrer">organization website ↗</a>}

        <section style={{ marginTop: 58 }}>
          <p className="eyebrow">STEWARDSHIP</p>
          <div className="site-grid">
            {stewardship.length ? stewardship.map((item, index) => (
              <article className="site-card" key={`${item.role}-${index}`}>
                <span className="label">{item.role}</span>
                <h2>{item.yuk_jurisdictions?.name || "Jurisdiction"}</h2>
                <p>{item.yuk_jurisdictions?.kind || "area"}{item.yuk_jurisdictions?.country_code ? ` · ${item.yuk_jurisdictions.country_code}` : ""}</p>
              </article>
            )) : <article className="site-card"><h2>No public stewardship assignments yet.</h2></article>}
          </div>
        </section>

        <section style={{ marginTop: 58 }}>
          <p className="eyebrow">CAMPAIGNS</p>
          <div className="site-grid">
            {campaigns.length ? campaigns.map((campaign) => (
              <article className="site-card" key={campaign.id}>
                <span className="label">{campaign.status}</span>
                <h2><a href={`/campaigns/${campaign.slug}`}>{campaign.title}</a></h2>
                <p>{campaign.site_count} sites · {campaign.completed_interventions} completed interventions</p>
              </article>
            )) : <article className="site-card"><h2>No public campaigns yet.</h2></article>}
          </div>
        </section>
      </div>
    </main>
  );
}
