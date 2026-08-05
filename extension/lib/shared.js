/** Shared config + Supabase REST helpers for the WordSnap extension. */

export const APP_URL = "https://wordsnap.lovable.app";
export const SUPABASE_URL = "https://dgdrrueqkyosmbwbtghe.supabase.co";
// Publishable (anon) key — safe in client code; all access is enforced by RLS.
export const SUPABASE_KEY = "sb_publishable_5B9NMFbHMa8GULGYxAa8NA_1b6Nk_tB";
export const AUTH_STORAGE_KEY = "sb-dgdrrueqkyosmbwbtghe-auth-token";

export const DEFAULT_SETTINGS = {
  floatingIcon: true,
  doubleClickLookup: false,
  pronunciation: true,
  theme: "dark",
  popupSize: "medium",
  autoSaveConfirm: true,
  level: "beginner",
};

export async function getSettings() {
  const stored = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };
}

export async function setSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  await chrome.storage.local.set({ settings: next });
  return next;
}

/** Session lives in storage.session only — memory-backed, cleared on browser exit. */
export async function readSession() {
  const { session } = await chrome.storage.session.get("session");
  return session || null;
}

export async function writeSession(session) {
  if (!session) return chrome.storage.session.remove("session");
  return chrome.storage.session.set({ session });
}

export async function refreshSession(session) {
  if (!session?.refresh_token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) {
    // Refresh token rejected (revoked/expired): drop the stale session.
    if (res.status === 400 || res.status === 401) await writeSession(null);
    return null;
  }
  const next = await res.json();
  await writeSession(next);
  return next;
}

/** Returns a valid access token, refreshing when close to expiry. */
export async function getAccessToken() {
  let session = await readSession();
  if (!session) return null;
  const expires = (session.expires_at || 0) * 1000;
  // Refresh well before expiry so long sessions keep saving/streaks working.
  if (expires && expires - Date.now() < 5 * 60_000) session = await refreshSession(session);
  return session?.access_token || null;
}

export async function getUser() {
  const session = await readSession();
  return session?.user || null;
}

/** Authenticated PostgREST call scoped to the signed-in user by RLS. */
export async function rest(path, init = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("NOT_SIGNED_IN");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
