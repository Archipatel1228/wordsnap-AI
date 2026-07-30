import { MOCK_WORDS, RECENT_HISTORY, SAVED_FOLDERS, USER_STATS, type WordEntry } from "@/lib/mock-data";
import type { DataService, HistoryItem, NotificationPrefs } from "./types";

const HISTORY_KEY = "wordsnap.history";
const SAVED_KEY = "wordsnap.saved";
const PREFS_KEY = "wordsnap.notifications";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function store(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_PREFS: NotificationPrefs = { dailyWord: true, streakReminder: false, hour: 9 };

/** Mock data layer. Replace with a Supabase-backed implementation of DataService. */
export const mockDataService: DataService = {
  async listRecentHistory() {
    return load<HistoryItem[]>(HISTORY_KEY, RECENT_HISTORY);
  },
  async addHistory(word: WordEntry) {
    const current = load<HistoryItem[]>(HISTORY_KEY, RECENT_HISTORY);
    const next = [
      { id: word.id, word: word.word, time: "Just now" },
      ...current.filter((h) => h.id !== word.id),
    ].slice(0, 30);
    store(HISTORY_KEY, next);
  },
  async clearHistory() {
    store(HISTORY_KEY, []);
  },
  async listFolders() {
    return SAVED_FOLDERS;
  },
  async listSavedWords() {
    return load<WordEntry[]>(SAVED_KEY, MOCK_WORDS.slice(0, 3));
  },
  async saveWord(word) {
    const current = load<WordEntry[]>(SAVED_KEY, MOCK_WORDS.slice(0, 3));
    if (!current.some((w) => w.id === word.id)) store(SAVED_KEY, [word, ...current]);
  },
  async removeSavedWord(id) {
    const current = load<WordEntry[]>(SAVED_KEY, MOCK_WORDS.slice(0, 3));
    store(
      SAVED_KEY,
      current.filter((w) => w.id !== id),
    );
  },
  async getStats() {
    const { wordsLearned, wordsSaved, streak, level, xp, xpToNext } = USER_STATS;
    return { wordsLearned, wordsSaved, streak, level, xp, xpToNext };
  },
  async getNotificationPrefs() {
    return load<NotificationPrefs>(PREFS_KEY, DEFAULT_PREFS);
  },
  async setNotificationPrefs(prefs) {
    store(PREFS_KEY, prefs);
  },
  async registerPushToken(token) {
    store("wordsnap.pushToken", token);
  },
};
