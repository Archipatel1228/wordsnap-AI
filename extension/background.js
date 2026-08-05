import {
  APP_URL,
  getAccessToken,
  getSettings,
  getUser,
  readSession,
  rest,
  writeSession,
} from "./lib/shared.js";

/** Service worker: lookups, saving, streaks, context menu, auth handoff. */

const LOOKUP_URL = `${APP_URL}/api/public/lookup`;
const cache = new Map(); // word -> { at, data }
const TTL = 1000 * 60 * 60 * 12;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "wordsnap-explain",
      title: "WordSnap → Explain \"%s\"",
      contexts: ["selection"],
    });
  });
});

/** Keep the Supabase session fresh even while the popup is closed. */
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("wordsnap-session-refresh", { periodInMinutes: 30 });
});
chrome.runtime.onStartup?.addListener(() => {
  chrome.alarms.create("wordsnap-session-refresh", { periodInMinutes: 30 });
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "wordsnap-session-refresh") void getAccessToken();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "wordsnap-explain" || !tab?.id) return;
  chrome.tabs.sendMessage(tab.id, {
    type: "WORDSNAP_SHOW",
    word: (info.selectionText || "").trim(),
  });
});

/** "words" -> "word", "boxes" -> "box": used only as a retry when a lookup misses. */
function singularise(word) {
  const w = word.toLowerCase();
  if (/(ss|us|is)$/.test(w)) return null;
  if (/ies$/.test(w)) return `${w.slice(0, -3)}y`;
  if (/(ches|shes|xes|zes|ses)$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w)) return w.slice(0, -1);
  return null;
}

async function lookup(word, level) {
  const key = `${word.toLowerCase()}::${level}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const res = await fetch(LOOKUP_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ word, level }),
  });
  const data = await res.json();
  if (!res.ok) {
    const singular = singularise(word);
    if (singular && singular !== word) return lookup(singular, level);
    throw new Error(data?.error || "Lookup failed");
  }
  cache.set(key, { at: Date.now(), data });
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  return data;
}

const today = () => new Date().toISOString().slice(0, 10);

async function saveWord(payload) {
  const user = await getUser();
  if (!user) throw new Error("NOT_SIGNED_IN");
  await rest("saved_words?on_conflict=user_id,word_key", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: user.id,
      word: payload.word,
      definition: payload.definition || "",
      part_of_speech: payload.partOfSpeech || null,
      phonetic: payload.phonetic || null,
      audio: payload.audio || null,
      favourite: Boolean(payload.favourite),
    }),
  });
  if (payload.favourite) {
    await rest(
      `saved_words?user_id=eq.${user.id}&word_key=eq.${encodeURIComponent(payload.word.toLowerCase())}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ favourite: true }),
      },
    );
  }
  await rest("activity_days?on_conflict=user_id,day", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: user.id, day: today() }),
  }).catch(() => {});
  await rest("search_history?on_conflict=user_id,word_key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: user.id,
      word: payload.word,
      viewed_at: new Date().toISOString(),
    }),
  }).catch(() => {});
  return { ok: true };
}

async function stats() {
  const user = await getUser();
  if (!user) return { signedIn: false };
  const [saved, days] = await Promise.all([
    rest("saved_words?select=word,favourite,created_at&order=created_at.desc&limit=50"),
    rest("activity_days?select=day&order=day.desc&limit=400"),
  ]);
  const dayList = (days || []).map((d) => d.day);
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    if (dayList.includes(day)) streak++;
    else if (i === 0) continue;
    else break;
  }
  return {
    signedIn: true,
    email: user.email,
    streak,
    total: (saved || []).length,
    recent: (saved || []).slice(0, 5).map((w) => w.word),
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg?.type) {
        case "SESSION_SYNC":
          await writeSession(msg.session);
          return sendResponse({ ok: true });
        case "SIGN_OUT":
          await writeSession(null);
          return sendResponse({ ok: true });
        case "GET_STATE": {
          const [session, settings] = await Promise.all([readSession(), getSettings()]);
          return sendResponse({ ok: true, signedIn: Boolean(session), settings });
        }
        case "LOOKUP": {
          const settings = await getSettings();
          const data = await lookup(msg.word, msg.level || settings.level);
          return sendResponse({ ok: true, data, settings });
        }
        case "SAVE_WORD":
          return sendResponse({ ok: true, data: await saveWord(msg.payload) });
        case "STATS":
          return sendResponse({ ok: true, data: await stats() });
        case "OPEN_APP":
          chrome.tabs.create({ url: `${APP_URL}${msg.path || "/"}` });
          return sendResponse({ ok: true });
        default:
          return sendResponse({ ok: false, error: "Unknown message" });
      }
    } catch (error) {
      sendResponse({ ok: false, error: String(error?.message || error) });
    }
  })();
  return true; // async response
});
