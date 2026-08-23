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

export default async function OrganizationsPage() {
  let organizations: Organization[] = [];
  try {
    organizations = await supabaseRest<Organization[]>("yuk_public_organizations?select=*&order=name.asc&limit=500");
  } catch {
    organizations = [];
  }

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/map">map</a><a href="/campaigns">campaigns</a><a href="/data">data</a></nav>
        </header>

        <p className="eyebrow">PEOPLE CAN ORGANIZE WITHOUT OWNING THE EVIDENCE</p>
        <h1 className="platform-title">organizations.</h1>
        <p className="platform-lede">
          Municipalities, cleanup groups, researchers and communities can steward places and run campaigns. The waste evidence remains independently addressable instead of living inside a team hierarchy.
        </p>

        <div className="site-grid">
          {organizations.length ? organizations.map((organization) => (
            <article className="site-card" key={organization.id}>
              <span className="label">{organization.kind}{organization.country_code ? ` · ${organization.country_code}` : ""}</span>
              <h2><a href={`/organizations/${organization.slug}`}>{organization.name}</a></h2>
              <p>{organization.description || "Public YUK organization."}</p>
              {organization.website && <a className="text-link" href={organization.website} target="_blank" rel="noreferrer">website ↗</a>}
            </article>
          )) : (
            <article className="site-card">
              <span className="label">FOUNDATION READY</span>
              <h2>No public organizations yet.</h2>
              <p>The platform can now represent them without making organization membership a prerequisite for reporting waste.</p>
            </article>
          )}
        </div>
      </div>
    </main>
  );
}
