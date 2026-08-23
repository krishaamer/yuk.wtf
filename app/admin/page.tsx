import { redirect } from "next/navigation";
import { adminConfigured, establishAdminSession, isAdmin } from "@/lib/admin";

async function login(formData: FormData) {
  "use server";
  const token = String(formData.get("token") || "");
  if (await establishAdminSession(token)) redirect("/admin/moderation");
  redirect("/admin?error=1");
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin/moderation");
  const { error } = await searchParams;

  return (
    <main className="platform-page">
      <div className="platform-page__inner" style={{ maxWidth: 620 }}>
        <header className="platform-header">
          <a className="wordmark" href="/">YUK<span>.WTF</span></a>
        </header>

        <p className="eyebrow">OPERATOR ACCESS</p>
        <h1 className="platform-title">the messy queue.</h1>
        {!adminConfigured() ? (
          <article className="site-card">
            <h2>Admin access is disabled.</h2>
            <p>Set the server-only `YUK_ADMIN_TOKEN` environment variable to enable the moderation console.</p>
          </article>
        ) : (
          <form action={login} className="correction-form">
            <label>
              Operator token
              <input name="token" type="password" autoComplete="current-password" required />
            </label>
            <button className="feed-button" type="submit">open moderation</button>
            {error && <p className="error">That token did not match.</p>}
          </form>
        )}
      </div>
    </main>
  );
}
