# yuk.wtf 💩🤢🤮

A fresh trash-monster app.

Point the camera at something you are about to throw away. YUK eats the photo, identifies the object and materials, gives best-effort disposal guidance, and remembers what it has eaten on that device.

This branch intentionally starts with a clean application tree instead of modernizing the old 2018 app.

## The loop

1. Show YUK trash.
2. Feed YUK the photo.
3. YUK analyses the object and reacts with 💩, 🤢, or 🤮.
4. Get a likely bin, destination, explanation, and lower-waste alternative.
5. Build a tiny local material autobiography over time.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set:

```bash
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-5-mini
```

The API key is only read by the server route.

## Deploy

This is a Next.js app and can deploy directly to Vercel. Add `OPENAI_API_KEY` as a server environment variable.

## What is real in v0.1

- mobile camera / photo picker
- client-side image downscaling
- server-side vision analysis through the OpenAI Responses API
- optional coarse geolocation sent as context
- 💩 / 🤢 / 🤮 reaction states
- animated trash monster
- best-effort disposal + material explanation
- local device history via `localStorage`
- responsive mobile-first UI
- reduced-motion support

## Important limitation

Waste rules are local and change. The first version asks the model to be explicit about uncertainty and never pretend it knows a municipal rule it cannot establish. A production version should connect to authoritative city / waste-provider datasets and use the model for object/material recognition plus explanation.

## Next

- authoritative local waste-rule adapters
- Supabase account sync and cross-device stomach history
- richer monster evolution based on material mix
- streaks / collections without turning this into generic green gamification
- material and brand statistics
- public aggregate waste map with privacy controls
