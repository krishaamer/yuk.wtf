type SupabaseMode = "service" | "public";

function config(mode: SupabaseMode) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    mode === "service"
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      mode === "service"
        ? "YUK persistence is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        : "YUK public data is not configured. Set the Supabase URL and publishable key.",
    );
  }

  return { url: url.replace(/\/$/, ""), key };
}

export async function supabaseRest<T>(
  path: string,
  init: RequestInit = {},
  mode: SupabaseMode = "service",
): Promise<T> {
  const { url, key } = config(mode);
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: init.cache ?? "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase REST ${response.status}: ${text}`);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function uploadEvidence(path: string, bytes: Uint8Array, contentType: string) {
  const { url, key } = config("service");
  const response = await fetch(`${url}/storage/v1/object/yuk-evidence/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: bytes,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase Storage ${response.status}: ${text}`);
  }
}
