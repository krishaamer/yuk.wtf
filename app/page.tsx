"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { YukMonster } from "@/components/YukMonster";
import type { PersistedObservation } from "@/lib/platform";
import type { YukAnalysis, YukMood } from "@/lib/types";

const HISTORY_KEY = "yuk.wtf.history.v2";

type CaptureMode = "discard" | "litter";
type SaveState = "idle" | "saving" | "saved" | "local-only";
type HistoryItem = YukAnalysis & {
  eatenAt: string;
  kind: CaptureMode;
  observationId?: string;
  siteId?: string | null;
};

async function shrinkImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const max = 1400;
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

async function getLocation() {
  if (!("geolocation" in navigator)) return undefined;

  return new Promise<{ latitude: number; longitude: number; accuracy: number } | undefined>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => resolve(undefined),
      { enableHighAccuracy: false, timeout: 4500, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<YukAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mood, setMood] = useState<YukMood>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<CaptureMode>("discard");
  const [publishLitter, setPublishLitter] = useState(false);
  const [saved, setSaved] = useState<PersistedObservation | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionState, setCorrectionState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  const eatenCount = history.length;
  const mappedCount = history.filter((item) => item.kind === "litter" && item.siteId).length;

  const recentMaterials = useMemo(() => {
    return history
      .slice(0, 4)
      .map((item) => item.material)
      .join(" · ");
  }, [history]);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setAnalysis(null);
    setSaved(null);
    setSaveState("idle");
    setSaveMessage(null);
    setCorrectionOpen(false);
    setMood("hungry");

    try {
      setImage(await shrinkImage(file));
    } catch {
      setError("YUK could not read that photo. Try another one.");
      setMood("grossed-out");
    }
  }

  async function feedYuk() {
    if (!image) {
      inputRef.current?.click();
      return;
    }

    setMood("chewing");
    setError(null);
    setSaveMessage(null);

    try {
      const location = await getLocation();
      if (mode === "litter" && !location) {
        throw new Error("YUK needs your location to map litter. Allow location access and try again.");
      }

      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, location }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "YUK could not digest that.");

      const nextAnalysis = result as YukAnalysis;
      setAnalysis(nextAnalysis);
      setMood(nextAnalysis.emoji === "🤮" ? "vomiting" : nextAnalysis.emoji === "🤢" ? "grossed-out" : "idle");

      const clientId = crypto.randomUUID();
      let persisted: PersistedObservation | null = null;
      setSaveState("saving");

      try {
        const persistenceResponse = await fetch("/api/observations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            kind: mode,
            image,
            analysis: nextAnalysis,
            location,
            publish: mode === "litter" && publishLitter,
          }),
        });
        const persistenceResult = await persistenceResponse.json();
        if (!persistenceResponse.ok) throw new Error(persistenceResult?.error || "Could not save observation.");
        persisted = persistenceResult as PersistedObservation;
        setSaved(persisted);
        setSaveState("saved");
        setSaveMessage(
          mode === "litter"
            ? publishLitter
              ? "Mapped. Public coordinates are rounded before publication."
              : "Mapped privately. It can still contribute to aggregate intelligence."
            : "Saved as a private discard observation.",
        );
      } catch (persistenceError) {
        console.error(persistenceError);
        setSaveState("local-only");
        setSaveMessage("Analysis worked, but this bite is only saved on this device for now.");
      }

      const nextHistory = [
        {
          ...nextAnalysis,
          eatenAt: new Date().toISOString(),
          kind: mode,
          observationId: persisted?.observationId,
          siteId: persisted?.siteId,
        },
        ...history,
      ].slice(0, 100);

      setHistory(nextHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch (err) {
      setError(err instanceof Error ? err.message : "YUK could not digest that.");
      setMood("grossed-out");
      setSaveState("idle");
    }
  }

  async function saveCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!saved?.observationId) return;
    setCorrectionState("saving");

    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/corrections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        observationId: saved.observationId,
        item: String(data.get("item") || ""),
        material: String(data.get("material") || ""),
        bin: String(data.get("bin") || ""),
        destination: String(data.get("destination") || ""),
        note: String(data.get("note") || ""),
      }),
    });

    if (response.ok) {
      setCorrectionState("saved");
      setCorrectionOpen(false);
    } else {
      setCorrectionState("error");
    }
  }

  function reset() {
    setImage(null);
    setAnalysis(null);
    setSaved(null);
    setSaveState("idle");
    setSaveMessage(null);
    setCorrectionOpen(false);
    setCorrectionState("idle");
    setError(null);
    setMood("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="YUK.WTF home">
          YUK<span>.WTF</span>
        </a>
        <nav className="platform-nav" aria-label="YUK platform">
          <a href="/map">map</a>
          <a href="/data">data</a>
          <a href="/platform">platform</a>
        </nav>
        <div className="stomach">
          <span>{eatenCount}</span> eaten · <span>{mappedCount}</span> mapped
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">AI TRASH CREATURE 💩🤢🤮</div>
        <h1>{mode === "discard" ? "feed me trash." : "show me the mess."}</h1>
        <p className="intro">
          {mode === "discard"
            ? "Show YUK something you are throwing away. It eats the photo, identifies the mess, and records what left your hands."
            : "Found waste outside? YUK turns the photo into evidence about a persistent place instead of another disposable map pin."}
        </p>

        <div className="mode-switch" role="group" aria-label="What kind of waste is this?">
          <button className={mode === "discard" ? "active" : ""} aria-pressed={mode === "discard"} onClick={() => setMode("discard")}>
            <strong>I&apos;m throwing this away</strong>
            <span>personal discard</span>
          </button>
          <button className={mode === "litter" ? "active" : ""} aria-pressed={mode === "litter"} onClick={() => setMode("litter")}>
            <strong>I found this outside</strong>
            <span>map litter</span>
          </button>
        </div>

        {mode === "litter" && (
          <label className="publish-toggle">
            <input type="checkbox" checked={publishLitter} onChange={(event) => setPublishLitter(event.target.checked)} />
            <span>Show this site on the public map. YUK rounds public coordinates to roughly 100 m.</span>
          </label>
        )}

        <YukMonster mood={mood} emoji={analysis?.emoji} />

        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
        />

        {!image ? (
          <button className="feed-button" onClick={() => inputRef.current?.click()}>
            <span>📷</span>
            {mode === "discard" ? "show me your garbage" : "photograph the litter"}
          </button>
        ) : (
          <div className="feeding-zone">
            <button className="photo-card" onClick={() => inputRef.current?.click()} aria-label="Choose a different photo">
              <img src={image} alt="Waste waiting to be fed to YUK" />
              <span>change photo</span>
            </button>

            <button className="feed-button feed-button--hot" onClick={feedYuk} disabled={mood === "chewing" || saveState === "saving"}>
              {mood === "chewing" ? "CHOMP CHOMP…" : saveState === "saving" ? "REMEMBERING…" : "FEED YUK"}
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}
      </section>

      {analysis && (
        <section className="result" aria-live="polite">
          <div className="result__reaction">{analysis.emoji}</div>
          <div className="result__main">
            <div className="result__kicker">{analysis.item}</div>
            <h2>{analysis.verdict}</h2>
            <p className="material">{analysis.material}</p>

            <div className="result-grid">
              <div>
                <span className="label">PUT IT</span>
                <strong>{analysis.bin}</strong>
              </div>
              <div>
                <span className="label">THEN</span>
                <strong>{analysis.destination}</strong>
              </div>
            </div>

            <p className="reason">{analysis.reason}</p>

            <div className="swap">
              <span className="label">LESS YUK NEXT TIME</span>
              <p>{analysis.betterAlternative}</p>
            </div>

            <p className="confidence">
              {analysis.confidence} confidence · {analysis.locationNote}
            </p>

            {saveMessage && <p className={`save-status save-status--${saveState}`}>{saveMessage}</p>}

            <div className="result-actions">
              {saved?.siteId && <a className="again" href={`/sites/${saved.siteId}`}>open site</a>}
              {saved?.observationId && (
                <button className="again" onClick={() => setCorrectionOpen((value) => !value)}>
                  YUK got it wrong?
                </button>
              )}
              <button className="again" onClick={reset}>feed me something else</button>
            </div>

            {correctionState === "saved" && <p className="save-status save-status--saved">Correction saved as new evidence.</p>}
            {correctionState === "error" && <p className="error">Could not save the correction.</p>}

            {correctionOpen && saved?.observationId && (
              <form className="correction-form" onSubmit={saveCorrection}>
                <span className="label">CORRECT THE CREATURE</span>
                <div className="correction-grid">
                  <label>Object<input name="item" defaultValue={analysis.item} /></label>
                  <label>Material<input name="material" defaultValue={analysis.material} /></label>
                  <label>Bin<input name="bin" defaultValue={analysis.bin} /></label>
                  <label>Destination<input name="destination" defaultValue={analysis.destination} /></label>
                </div>
                <label>Anything else?<textarea name="note" rows={2} /></label>
                <button className="feed-button" disabled={correctionState === "saving"}>
                  {correctionState === "saving" ? "saving…" : "save correction"}
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      <section className="memory">
        <div>
          <span className="label">YUK&apos;S STOMACH</span>
          <h2>{eatenCount ? `${eatenCount} objects remembered` : "empty. suspiciously clean."}</h2>
        </div>
        <p>{recentMaterials || "Your material autobiography starts with the first bite."}</p>
      </section>

      <footer>
        <span>yuk.wtf</span>
        <span>capture → evidence → site → action</span>
      </footer>
    </main>
  );
}
