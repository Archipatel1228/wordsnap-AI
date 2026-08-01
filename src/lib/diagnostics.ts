/**
 * Client-side diagnostics: keeps a rolling in-memory + session log of API and
 * rendering failures and forwards them to the Lovable error pipeline so
 * production issues surface with actionable detail (route, payload, cause).
 */

import { reportLovableError } from "@/lib/lovable-error-reporting";

export type DiagnosticEntry = {
  at: number;
  level: "info" | "error";
  event: string;
  detail: Record<string, unknown>;
};

const MAX_ENTRIES = 100;
const STORAGE_KEY = "wordsnap.diagnostics";
let entries: DiagnosticEntry[] = [];

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    /* storage full or unavailable — diagnostics stay in memory */
  }
}

function push(entry: DiagnosticEntry) {
  entries = [...entries, entry].slice(-MAX_ENTRIES);
  persist();
}

function describe(error: unknown): Record<string, unknown> {
  if (error instanceof Response) {
    return { kind: "Response", status: error.status, url: error.url };
  }
  if (error instanceof Error) {
    return {
      kind: error.name,
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 6).join("\n"),
      cause: error.cause ? String(error.cause) : undefined,
    };
  }
  return { kind: typeof error, message: String(error) };
}

/** Record a non-fatal diagnostic breadcrumb. */
export function logEvent(event: string, detail: Record<string, unknown> = {}) {
  push({ at: Date.now(), level: "info", event, detail });
}

/** Record a failure, log it with context, and forward it to error monitoring. */
export function logError(event: string, error: unknown, detail: Record<string, unknown> = {}) {
  const described = describe(error);
  push({ at: Date.now(), level: "error", event, detail: { ...detail, ...described } });
  // eslint-disable-next-line no-console
  console.error(`[wordsnap] ${event}`, { ...detail, ...described });
  reportLovableError(error, { event, ...detail });
}

/** Full breadcrumb trail — used by the diagnostics export in Settings. */
export function getDiagnostics(): DiagnosticEntry[] {
  if (entries.length === 0 && typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) entries = JSON.parse(raw) as DiagnosticEntry[];
    } catch {
      /* ignore */
    }
  }
  return entries;
}

let installed = false;

/** Attach global handlers once, from the root route. */
export function installDiagnostics() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (event) => {
    logError("window.error", event.error ?? event.message, { filename: event.filename });
  });
  window.addEventListener("unhandledrejection", (event) => {
    logError("unhandled.rejection", event.reason);
  });
}
