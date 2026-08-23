import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "yuk_admin";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function expectedToken() {
  return process.env.YUK_ADMIN_TOKEN?.trim() || null;
}

export function adminConfigured() {
  return Boolean(expectedToken());
}

export async function isAdmin() {
  const expected = expectedToken();
  if (!expected) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const expectedSession = createHash("sha256").update(`session:${expected}`).digest("hex");
  return value === expectedSession;
}

export async function establishAdminSession(submitted: string) {
  const expected = expectedToken();
  if (!expected) return false;
  const submittedHash = digest(submitted);
  const expectedHash = digest(expected);
  if (!timingSafeEqual(submittedHash, expectedHash)) return false;

  const session = createHash("sha256").update(`session:${expected}`).digest("hex");
  (await cookies()).set(COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  });
  return true;
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE);
}
