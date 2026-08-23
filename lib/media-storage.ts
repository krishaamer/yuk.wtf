const DEFAULT_URL = "https://suhdyvgijlismwfglsvf.supabase.co";
const BUCKET = "yuk-evidence";

function config() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("YUK media storage is not configured.");
  return { url: url.replace(/\/$/, ""), key };
}

export async function uploadReviewedDerivative(path: string, bytes: Uint8Array, contentType: string) {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: Buffer.from(bytes),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YUK derivative upload failed ${response.status}: ${text}`);
  }
}

export async function downloadPrivateMedia(path: string) {
  const { url, key } = config();
  const response = await fetch(`${url}/storage/v1/object/authenticated/${BUCKET}/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YUK media download failed ${response.status}: ${text}`);
  }

  return {
    bytes: new Uint8Array(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "application/octet-stream",
  };
}
