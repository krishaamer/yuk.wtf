import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type Organization = { id: string; slug: string; name: string; kind: string };
type Jurisdiction = { id: string; slug: string; name: string; kind: string; country_code: string | null };
type Campaign = { id: string; slug: string; title: string; status: string };
type Site = { id: string; title: string | null; status: string; last_observed_at: string | null };

function optional(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

async function guard() {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
}

async function createOrganization(formData: FormData) {
  "use server";
  await guard();
  await supabaseRest("yuk_organizations", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      slug: String(formData.get("slug") || "").trim().toLowerCase(),
      name: String(formData.get("name") || "").trim(),
      kind: String(formData.get("kind") || "community"),
      description: optional(formData.get("description")),
      country_code: optional(formData.get("country_code"))?.toUpperCase(),
      website: optional(formData.get("website")),
      public_visibility: String(formData.get("visibility") || "public"),
    }),
  });
  revalidatePath("/admin/operations");
  revalidatePath("/organizations");
}

async function createJurisdiction(formData: FormData) {
  "use server";
  await guard();
  await supabaseRest("yuk_jurisdictions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      slug: String(formData.get("slug") || "").trim().toLowerCase(),
      name: String(formData.get("name") || "").trim(),
      kind: String(formData.get("kind") || "municipality"),
      country_code: optional(formData.get("country_code"))?.toUpperCase(),
      public_visibility: "public",
    }),
  });
  revalidatePath("/admin/operations");
}

async function createStewardship(formData: FormData) {
  "use server";
  await guard();
  await supabaseRest("yuk_stewardships", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      organization_id: String(formData.get("organization_id") || ""),
      jurisdiction_id: String(formData.get("jurisdiction_id") || ""),
      role: String(formData.get("role") || "steward"),
      valid_from: optional(formData.get("valid_from")),
      valid_to: optional(formData.get("valid_to")),
    }),
  });
  revalidatePath("/admin/operations");
}

async function createCampaign(formData: FormData) {
  "use server";
  await guard();
  await supabaseRest("yuk_campaigns", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      slug: String(formData.get("slug") || "").trim().toLowerCase(),
      title: String(formData.get("title") || "").trim(),
      description: optional(formData.get("description")),
      status: String(formData.get("status") || "planned"),
      organization_id: optional(formData.get("organization_id")),
      jurisdiction_id: optional(formData.get("jurisdiction_id")),
      starts_at: optional(formData.get("starts_at")),
      ends_at: optional(formData.get("ends_at")),
      public_visibility: String(formData.get("visibility") || "public"),
    }),
  });
  revalidatePath("/admin/operations");
  revalidatePath("/campaigns");
}

async function attachSite(formData: FormData) {
  "use server";
  await guard();
  await supabaseRest("yuk_campaign_sites", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      campaign_id: String(formData.get("campaign_id") || ""),
      site_id: String(formData.get("site_id") || ""),
      role: String(formData.get("role") || "target"),
    }),
  });
  revalidatePath("/admin/operations");
  revalidatePath("/campaigns");
}

async function updateCampaignStatus(formData: FormData) {
  "use server";
  await guard();
  const id = String(formData.get("campaign_id") || "");
  const status = String(formData.get("status") || "planned");
  if (!id || !["planned", "active", "completed", "cancelled"].includes(status)) return;
  await supabaseRest(`yuk_campaigns?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
  });
  revalidatePath("/admin/operations");
  revalidatePath("/campaigns");
}

const inputStyle = { width: "100%" };

export default async function OperationsPage() {
  if (!(await isAdmin())) redirect("/admin");

  let organizations: Organization[] = [];
  let jurisdictions: Jurisdiction[] = [];
  let campaigns: Campaign[] = [];
  let sites: Site[] = [];
  try {
    [organizations, jurisdictions, campaigns, sites] = await Promise.all([
      supabaseRest<Organization[]>("yuk_organizations?select=id,slug,name,kind&order=name.asc&limit=500"),
      supabaseRest<Jurisdiction[]>("yuk_jurisdictions?select=id,slug,name,kind,country_code&order=name.asc&limit=500"),
      supabaseRest<Campaign[]>("yuk_campaigns?select=id,slug,title,status&order=created_at.desc&limit=500"),
      supabaseRest<Site[]>("yuk_sites?select=id,title,status,last_observed_at&status=neq.archived&order=last_observed_at.desc.nullslast&limit=500"),
    ]);
  } catch (error) {
    console.error("YUK operations data failed", error);
  }

  return (
    <main className="platform-page">
      <div className="platform-page__inner">
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
          <nav><a href="/admin/moderation">moderation</a><a href="/campaigns">public campaigns</a><a href="/organizations">public organizations</a></nav>
        </header>

        <p className="eyebrow">OPERATIONS WITHOUT A MOVEMENT HIERARCHY</p>
        <h1 className="platform-title">coordinate action.</h1>
        <p className="platform-lede">Create organizations, jurisdictions, stewardship relationships and cleanup campaigns while keeping reporting open to people outside those structures.</p>

        <div className="platform-grid">
          <article className="platform-card">
            <span className="label">ORGANIZATION</span><h2>Add a group</h2>
            <form action={createOrganization} className="correction-form">
              <label>Name<input name="name" required style={inputStyle} /></label>
              <label>Slug<input name="slug" required pattern="[a-z0-9-]+" style={inputStyle} /></label>
              <label>Kind<select name="kind" defaultValue="community"><option>community</option><option>municipality</option><option>research</option><option>nonprofit</option><option>company</option></select></label>
              <label>Country code<input name="country_code" maxLength={2} /></label>
              <label>Website<input name="website" type="url" /></label>
              <label>Description<textarea name="description" rows={3} /></label>
              <label>Visibility<select name="visibility" defaultValue="public"><option value="public">public</option><option value="aggregate">aggregate</option><option value="private">private</option></select></label>
              <button className="again" type="submit">create organization</button>
            </form>
          </article>

          <article className="platform-card">
            <span className="label">JURISDICTION</span><h2>Add an area</h2>
            <form action={createJurisdiction} className="correction-form">
              <label>Name<input name="name" required /></label>
              <label>Slug<input name="slug" required pattern="[a-z0-9-]+" /></label>
              <label>Kind<select name="kind" defaultValue="municipality"><option value="country">country</option><option value="region">region</option><option value="municipality">municipality</option><option value="district">district</option><option value="protected_area">protected area</option><option value="other">other</option></select></label>
              <label>Country code<input name="country_code" maxLength={2} /></label>
              <button className="again" type="submit">create jurisdiction</button>
            </form>
          </article>

          <article className="platform-card">
            <span className="label">STEWARDSHIP</span><h2>Assign responsibility</h2>
            <form action={createStewardship} className="correction-form">
              <label>Organization<select name="organization_id" required defaultValue=""><option value="" disabled>choose…</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Jurisdiction<select name="jurisdiction_id" required defaultValue=""><option value="" disabled>choose…</option>{jurisdictions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Role<select name="role" defaultValue="steward"><option>steward</option><option>operator</option><option>partner</option><option>researcher</option></select></label>
              <label>From<input name="valid_from" type="date" /></label><label>Until<input name="valid_to" type="date" /></label>
              <button className="again" type="submit">assign stewardship</button>
            </form>
          </article>

          <article className="platform-card">
            <span className="label">CAMPAIGN</span><h2>Start a cleanup campaign</h2>
            <form action={createCampaign} className="correction-form">
              <label>Title<input name="title" required /></label><label>Slug<input name="slug" required pattern="[a-z0-9-]+" /></label>
              <label>Organization<select name="organization_id" defaultValue=""><option value="">none</option>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Jurisdiction<select name="jurisdiction_id" defaultValue=""><option value="">none</option>{jurisdictions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Status<select name="status" defaultValue="planned"><option>planned</option><option>active</option><option>completed</option><option>cancelled</option></select></label>
              <label>Starts<input name="starts_at" type="datetime-local" /></label><label>Ends<input name="ends_at" type="datetime-local" /></label>
              <label>Description<textarea name="description" rows={3} /></label>
              <label>Visibility<select name="visibility" defaultValue="public"><option>public</option><option>aggregate</option><option>private</option></select></label>
              <button className="again" type="submit">create campaign</button>
            </form>
          </article>

          <article className="platform-card">
            <span className="label">CAMPAIGN TARGET</span><h2>Add a Site</h2>
            <form action={attachSite} className="correction-form">
              <label>Campaign<select name="campaign_id" required defaultValue=""><option value="" disabled>choose…</option>{campaigns.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
              <label>Site<select name="site_id" required defaultValue=""><option value="" disabled>choose…</option>{sites.map((item) => <option key={item.id} value={item.id}>{item.title || item.id.slice(0, 8)} · {item.status}</option>)}</select></label>
              <label>Role<select name="role" defaultValue="target"><option>target</option><option>reference</option><option>excluded</option></select></label>
              <button className="again" type="submit">attach Site</button>
            </form>
          </article>
        </div>

        <section style={{ marginTop: 58 }}>
          <p className="eyebrow">CAMPAIGN STATE</p>
          <div className="site-grid">
            {campaigns.length ? campaigns.map((campaign) => (
              <article className="site-card" key={campaign.id}>
                <span className="label">{campaign.status}</span><h2>{campaign.title}</h2>
                <form action={updateCampaignStatus} className="correction-form">
                  <input type="hidden" name="campaign_id" value={campaign.id} />
                  <label>Status<select name="status" defaultValue={campaign.status}><option>planned</option><option>active</option><option>completed</option><option>cancelled</option></select></label>
                  <button className="again" type="submit">update status</button>
                </form>
              </article>
            )) : <article className="site-card"><h2>No campaigns yet.</h2></article>}
          </div>
        </section>
      </div>
    </main>
  );
}
