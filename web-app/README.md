# yuk.wtf web app

The old World Cleanup web client is now the home of the YUK trash monster MVP.

## What works

- camera / photo-library input
- animated trash monster that reacts while feeding
- sample trash objects for an instant end-to-end demo
- material + disposal + fate result card
- evolving monster traits based on the materials you feed it
- local browser history as a tiny personal material autobiography
- gross YUK language and emoji identity: 💩 🤢 🤮
- safe fallback when a real vision service is not configured

## Run locally

```bash
npm install
npm start
```

The YUK entry screen no longer requires the legacy World Cleanup backend to boot.

## Real photo analysis

Set `REACT_APP_YUK_ANALYZE_URL` to an HTTP endpoint that accepts a multipart form upload:

- `image`: uploaded image file
- `locale`: browser language, for example `en-US`

The endpoint should return JSON shaped roughly like this:

```json
{
  "item": "PET bottle",
  "emoji": "🧴",
  "material": "PET plastic",
  "materialKey": "plastic",
  "bin": "packaging recycling or deposit return",
  "fate": "What usually happens to the material next.",
  "verdict": "YUK's short reaction.",
  "tip": "One useful action for the person."
}
```

If the endpoint is absent or fails, YUK does not invent local waste rules. It falls back to a clearly labeled prototype result instead.

## Product direction

The monster is not just a mascot. Its body mutates based on the material mix in the user's history. Over time YUK should become a visual autobiography of consumption and disposal, while the analysis service becomes location-aware enough to answer the practical question: what is this, where does it go here, and what happens to it next?

## Production build

```bash
npm run build
```
