"use client";

import { FormEvent, useState } from "react";

const SUPABASE_URL = "https://suhdyvgijlismwfglsvf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ym56QqUoLM1oNtEXuBAkqw_2J3S25ql";

type FormState = "idle" | "submitting" | "success" | "error";

export function WaitlistForm() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const honeypot = String(data.get("company") ?? "");

    if (honeypot) {
      setState("success");
      setMessage("You’re on the list.");
      return;
    }

    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const name = String(data.get("name") ?? "").trim();
    const interest = String(data.get("interest") ?? "").trim();
    const consent = data.get("consent") === "on";

    setState("submitting");
    setMessage("");

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/yuk_waitlist`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          email,
          name: name || null,
          interest: interest || null,
          consent,
          source: "yuk.wtf"
        })
      });

      if (response.ok || response.status === 409) {
        form.reset();
        setState("success");
        setMessage(response.status === 409 ? "You’re already on the list." : "You’re on the list.");
        return;
      }

      throw new Error(`Waitlist request failed with ${response.status}`);
    } catch {
      setState("error");
      setMessage("That didn’t go through. Try again in a moment.");
    }
  }

  return (
    <form className="waitlist-form" onSubmit={onSubmit}>
      <div className="form-row">
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label>
          <span>Name <em>optional</em></span>
          <input name="name" type="text" autoComplete="name" placeholder="Your name" />
        </label>
      </div>

      <label>
        <span>What are you interested in? <em>optional</em></span>
        <textarea
          name="interest"
          rows={3}
          placeholder="Mapping, cleanup data, computer vision, local action, research…"
        />
      </label>

      <label className="honeypot" aria-hidden="true">
        Company
        <input name="company" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="form-footer">
        <label className="consent">
          <input name="consent" type="checkbox" required />
          <span>Send me occasional YUK project updates.</span>
        </label>
        <button type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? "Joining…" : "Join the waitlist ↗"}
        </button>
      </div>

      <p className={`form-status ${state}`} aria-live="polite">
        {message}
      </p>
    </form>
  );
}
