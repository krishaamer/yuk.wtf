"use client";

import { FormEvent, useState } from "react";

export function CleanupForm({ siteId = "", campaignId = "" }: { siteId?: string; campaignId?: string }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage("");
    const data = new FormData(event.currentTarget);

    const response = await fetch("/api/cleanups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: crypto.randomUUID(),
        siteId: String(data.get("siteId") || "").trim(),
        campaignId: String(data.get("campaignId") || "").trim() || undefined,
        note: String(data.get("note") || "").trim(),
        startedAt: String(data.get("startedAt") || "") || undefined,
        endedAt: String(data.get("endedAt") || "") || undefined,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      setState("error");
      setMessage(result?.error || "Could not save cleanup.");
      return;
    }

    setState("saved");
    setMessage(result.message || "Cleanup saved.");
  }

  return (
    <form className="correction-form" onSubmit={submit}>
      <div className="correction-grid">
        <label>
          Site ID
          <input name="siteId" defaultValue={siteId} required />
        </label>
        <label>
          Campaign ID <em>optional</em>
          <input name="campaignId" defaultValue={campaignId} />
        </label>
        <label>
          Started
          <input name="startedAt" type="datetime-local" />
        </label>
        <label>
          Finished
          <input name="endedAt" type="datetime-local" />
        </label>
      </div>
      <label>
        What happened?
        <textarea name="note" rows={4} placeholder="What was removed, what remained, anything unsafe or inaccessible…" />
      </label>
      <button className="feed-button" disabled={state === "saving" || state === "saved"}>
        {state === "saving" ? "saving cleanup…" : state === "saved" ? "cleanup recorded ✓" : "we cleaned it"}
      </button>
      {message && <p className={`save-status save-status--${state === "saved" ? "saved" : "local-only"}`}>{message}</p>}
    </form>
  );
}
