/**
 * Runs only on the WordSnap web app origin. Mirrors the existing Supabase
 * session into the extension's in-memory session store so the extension uses
 * the same account. Nothing is written back into the page.
 */
const AUTH_STORAGE_KEY = "sb-dgdrrueqkyosmbwbtghe-auth-token";

function read() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token ? parsed : null;
  } catch {
    return null;
  }
}

let last = "";
function sync() {
  const session = read();
  const fingerprint = session ? `${session.user?.id}:${session.expires_at}` : "";
  if (fingerprint === last) return;
  last = fingerprint;
  chrome.runtime.sendMessage(
    session ? { type: "SESSION_SYNC", session } : { type: "SIGN_OUT" },
    () => void chrome.runtime.lastError,
  );
}

sync();
setInterval(sync, 5000);
window.addEventListener("storage", (e) => {
  if (e.key === AUTH_STORAGE_KEY) sync();
});
