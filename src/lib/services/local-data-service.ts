import type {
  CachedExplanation,
  DataService,
  HistoryItem,
  SavedWord,
  UserPreferences,
  UserStats,
} from "./types";
import { NEW_CARD, isDue } from "@/lib/srs";

/**
 * Device-local implementation (localStorage). Temporary until Supabase is
 * connected — the UI surfaces this via `isLocalOnly`.
 */

const KEYS = {
  history: "wordsnap.history",
  saved: "wordsnap.saved",
  prefs: "wordsnap.prefs",
  streak: "wordsnap.streak",
  ai: "wordsnap.ai-cache",
  push: "wordsnap.pushToken",
};

const DEFAULT_PREFS: UserPreferences = {
  translationLanguage: "hindi",
  reduceMotion: false,
  dyslexiaFont: false,
  dailyWord: true,
  streakReminder: false,
  hour: 9,
};

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
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — non fatal */
  }
}

const dayKey = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

export const localDataService: DataService = {
  isLocalOnly: true,

  async listHistory() {
    return load<HistoryItem[]>(KEYS.history, []);
  },
  async addHistory(word) {
    const current = load<HistoryItem[]>(KEYS.history, []);
    const next = [
      { word, at: Date.now() },
      ...current.filter((h) => h.word.toLowerCase() !== word.toLowerCase()),
    ].slice(0, 100);
    store(KEYS.history, next);
  },
  async removeHistory(word) {
    store(
      KEYS.history,
      load<HistoryItem[]>(KEYS.history, []).filter((h) => h.word !== word),
    );
  },
  async clearHistory() {
    store(KEYS.history, []);
  },

  async listSavedWords() {
    return load<SavedWord[]>(KEYS.saved, []);
  },
  async saveWord(word) {
    const current = load<SavedWord[]>(KEYS.saved, []);
    if (current.some((w) => w.word.toLowerCase() === word.word.toLowerCase())) return;
    store(KEYS.saved, [
      { ...word, favourite: false, createdAt: Date.now(), srs: { ...NEW_CARD, dueAt: Date.now() } },
      ...current,
    ]);
  },
  async removeSavedWord(word) {
    store(
      KEYS.saved,
      load<SavedWord[]>(KEYS.saved, []).filter(
        (w) => w.word.toLowerCase() !== word.toLowerCase(),
      ),
    );
  },
  async toggleFavourite(word) {
    store(
      KEYS.saved,
      load<SavedWord[]>(KEYS.saved, []).map((w) =>
        w.word.toLowerCase() === word.toLowerCase() ? { ...w, favourite: !w.favourite } : w,
      ),
    );
  },
  async updateSrs(word, srs) {
    store(
      KEYS.saved,
      load<SavedWord[]>(KEYS.saved, []).map((w) =>
        w.word.toLowerCase() === word.toLowerCase() ? { ...w, srs } : w,
      ),
    );
  },

  async getPreferences() {
    return { ...DEFAULT_PREFS, ...load<Partial<UserPreferences>>(KEYS.prefs, {}) };
  },
  async setPreferences(prefs) {
    store(KEYS.prefs, prefs);
  },

  async getStats(): Promise<UserStats> {
    const saved = load<SavedWord[]>(KEYS.saved, []);
    const history = load<HistoryItem[]>(KEYS.history, []);
    const streak = load<{ days: string[] }>(KEYS.streak, { days: [] });
    const learned = new Set(history.map((h) => h.word.toLowerCase())).size;

    let count = 0;
    for (let i = 0; ; i++) {
      const day = dayKey(Date.now() - i * 86_400_000);
      if (streak.days.includes(day)) count++;
      else if (i > 0) break;
      else if (!streak.days.includes(dayKey(Date.now() - 86_400_000))) break;
    }

    return {
      wordsLearned: learned,
      wordsSaved: saved.length,
      favourites: saved.filter((w) => w.favourite).length,
      streak: count,
      dueToday: saved.filter((w) => isDue(w.srs)).length,
    };
  },
  async recordActivity() {
    const streak = load<{ days: string[] }>(KEYS.streak, { days: [] });
    const today = dayKey();
    if (!streak.days.includes(today)) store(KEYS.streak, { days: [...streak.days, today].slice(-400) });
  },

  async getCachedExplanation<T>(key: string) {
    const cache = load<Record<string, CachedExplanation<T>>>(KEYS.ai, {});
    return cache[key] ?? null;
  },
  async setCachedExplanation<T>(key: string, value: T) {
    const cache = load<Record<string, CachedExplanation<T>>>(KEYS.ai, {});
    const entries = Object.entries({ ...cache, [key]: { value, at: Date.now() } })
      .sort((a, b) => b[1].at - a[1].at)
      .slice(0, 200);
    store(KEYS.ai, Object.fromEntries(entries));
  },

  async registerPushToken(token) {
    store(KEYS.push, token);
  },
};
