"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { YukMonster } from "@/components/YukMonster";
import type { YukAnalysis, YukMood } from "@/lib/types";

const HISTORY_KEY = "yuk.wtf.history.v1";

type HistoryItem = YukAnalysis & { eatenAt: string };

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

  return new Promise<{ latitude: number; longitude: number } | undefined>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  const eatenCount = history.length;

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

    try {
      const location = await getLocation();
      const response = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, location }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "YUK could not digest that.");
      }

      const nextAnalysis = result as YukAnalysis;
      setAnalysis(nextAnalysis);
      setMood(nextAnalysis.emoji === "🤮" ? "vomiting" : nextAnalysis.emoji === "🤢" ? "grossed-out" : "idle");

      const nextHistory = [
        { ...nextAnalysis, eatenAt: new Date().toISOString() },
        ...history,
      ].slice(0, 100);

      setHistory(nextHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch (err) {
      setError(err instanceof Error ? err.message : "YUK could not digest that.");
      setMood("grossed-out");
    }
  }

  function reset() {
    setImage(null);
    setAnalysis(null);
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
        <div className="stomach">
          <span>{eatenCount}</span> things eaten
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow">AI TRASH CREATURE 💩🤢🤮</div>
        <h1>feed me trash.</h1>
        <p className="intro">
          Show YUK what you are throwing away. It eats the photo, identifies the mess,
          and tells you where it probably goes.
        </p>

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
            show me your garbage
          </button>
        ) : (
          <div className="feeding-zone">
            <button className="photo-card" onClick={() => inputRef.current?.click()} aria-label="Choose a different photo">
              <img src={image} alt="Trash waiting to be fed to YUK" />
              <span>change photo</span>
            </button>

            <button className="feed-button feed-button--hot" onClick={feedYuk} disabled={mood === "chewing"}>
              {mood === "chewing" ? "CHOMP CHOMP…" : "FEED YUK"}
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

            <button className="again" onClick={reset}>feed me something else</button>
          </div>
        </section>
      )}

      <section className="memory">
        <div>
          <span className="label">YUK'S STOMACH</span>
          <h2>{eatenCount ? `${eatenCount} objects remembered` : "empty. suspiciously clean."}</h2>
        </div>
        <p>{recentMaterials || "Your material autobiography starts with the first bite."}</p>
      </section>

      <footer>
        <span>yuk.wtf</span>
        <span>trash is data</span>
      </footer>
    </main>
  );
}
