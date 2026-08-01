import type { CachedExplanation } from "./services/types";

/**
 * Durable offline cache for AI explanations.
 *
 * Survives reloads and sessions, evicts by age (invalidation) and by both entry
 * count and approximate byte size so it can never grow unbounded.
 */

const KEY = "wordsnap.ai-cache.v2";
const MAX_ENTRIES = 300;
const MAX_BYTES = 1_500_000; // ~1.5 MB
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

type Entry = { value: unknown; at: number };
type CacheShape = Record<string, Entry>;

function read(): CacheShape {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CacheShape) : {};
  } catch {
    return {};
  }
}

function write(cache: CacheShape) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Quota exceeded: drop the oldest half and retry once.
    const halved = Object.fromEntries(
      Object.entries(cache)
        .sort((a, b) => b[1].at - a[1].at)
        .slice(0, Math.floor(Object.keys(cache).length / 2)),
    );
    try {
      window.localStorage.setItem(KEY, JSON.stringify(halved));
    } catch {
      window.localStorage.removeItem(KEY);
    }
  }
}

function prune(cache: CacheShape): CacheShape {
  const now = Date.now();
  let ordered = Object.entries(cache)
    .filter(([, entry]) => now - entry.at < TTL_MS)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, MAX_ENTRIES);

  while (ordered.length > 1 && JSON.stringify(Object.fromEntries(ordered)).length > MAX_BYTES) {
    ordered = ordered.slice(0, Math.ceil(ordered.length * 0.8));
  }
  return Object.fromEntries(ordered);
}

export function getCachedExplanation<T>(key: string): CachedExplanation<T> | null {
  const entry = read()[key];
  if (!entry) return null;
  if (Date.now() - entry.at >= TTL_MS) {
    clearCachedExplanation(key);
    return null;
  }
  return { value: entry.value as T, at: entry.at };
}

export function setCachedExplanation<T>(key: string, value: T) {
  const next = prune({ ...read(), [key]: { value, at: Date.now() } });
  write(next);
}

export function clearCachedExplanation(key: string) {
  const cache = read();
  delete cache[key];
  write(cache);
}

export function clearExplanationCache() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
}

export function explanationCacheStats() {
  const cache = read();
  const keys = Object.keys(cache);
  return {
    entries: keys.length,
    bytes: keys.length ? JSON.stringify(cache).length : 0,
    maxEntries: MAX_ENTRIES,
  };
}
