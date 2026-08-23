# YUK mobile

Expo SDK 57 + Expo Router native client for the YUK platform.

## Run

```bash
cd apps/mobile
npm install
npx expo start
```

Start with Expo Go. The current dependencies are all Expo Go compatible.

Optional API override:

```bash
EXPO_PUBLIC_YUK_API_URL=https://your-preview.example
```

The default is `https://yuk.wtf`.

## Offline contract

A photo is written into the local SQLite `capture_ops` operation log before any network request begins.

For each capture:

1. generate a stable UUID
2. save photo + capture intent + location context locally
3. attempt `/api/analyse`
4. persist the analysis locally as soon as it succeeds
5. attempt `/api/observations` using the same UUID
6. keep the operation pending if either network step fails
7. retry later without re-running AI when an analysis is already stored

The server treats the client UUID as an idempotency key, so replaying an operation is expected behavior rather than an error case.

## Capture intents

- `discard`: private personal waste history, no location required
- `litter`: physical-world evidence, foreground location required, public map visibility remains opt-in

## Next native work

- background sync when appropriate
- durable media files instead of long-lived base64 rows
- correction UI
- nearby Site candidate selection
- cleanup/before-after capture
- public nearby Site list and native map after the Expo Go-first flow is proven
- account sync without making identity mandatory for basic reporting
