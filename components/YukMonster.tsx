"use client";

import type { YukEmoji, YukMood } from "@/lib/types";

const MOOD_EMOJI: Record<YukMood, YukEmoji> = {
  idle: "💩",
  hungry: "🤢",
  chewing: "🤢",
  "grossed-out": "🤢",
  vomiting: "🤮",
};

export function YukMonster({
  mood,
  emoji,
}: {
  mood: YukMood;
  emoji?: YukEmoji;
}) {
  const face = emoji ?? MOOD_EMOJI[mood];

  return (
    <div className={`monster-stage monster-stage--${mood}`} aria-live="polite">
      <div className="orbit orbit--one">{mood === "vomiting" ? "🤮" : "💩"}</div>
      <div className="orbit orbit--two">🤢</div>

      <div className="monster" role="img" aria-label={`YUK trash monster feeling ${mood}`}>
        <span className="monster__ear monster__ear--left" />
        <span className="monster__ear monster__ear--right" />
        <span className="monster__eye monster__eye--left" />
        <span className="monster__eye monster__eye--right" />

        <div className="monster__mouth">
          <span className="monster__face">{face}</span>
        </div>

        <span className="monster__spot monster__spot--one" />
        <span className="monster__spot monster__spot--two" />
        <span className="monster__spot monster__spot--three" />
      </div>

      <div className="monster-shadow" />
    </div>
  );
}
