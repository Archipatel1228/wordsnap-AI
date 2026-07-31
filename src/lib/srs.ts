import type { SrsState } from "@/lib/services/types";

export const NEW_CARD: SrsState = { ease: 2.5, intervalDays: 0, repetitions: 0, dueAt: Date.now() };

export type ReviewGrade = "again" | "hard" | "good" | "easy";

const DAY = 86_400_000;

/** SM-2 inspired scheduler used by flashcard revision mode. */
export function scheduleNext(state: SrsState, grade: ReviewGrade): SrsState {
  const quality = { again: 2, hard: 3, good: 4, easy: 5 }[grade];
  let { ease, intervalDays, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 0;
  } else {
    repetitions += 1;
    intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.round(intervalDays * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  }

  return {
    ease,
    repetitions,
    intervalDays,
    dueAt: Date.now() + Math.max(intervalDays, quality < 3 ? 0 : 1) * DAY,
  };
}

export function isDue(state: SrsState, now = Date.now()) {
  return state.dueAt <= now;
}

/** Due cards first (most overdue first), then never-reviewed, then the rest. */
export function sortForRevision<T extends { srs: SrsState }>(cards: T[], now = Date.now()): T[] {
  return [...cards].sort((a, b) => {
    const aDue = a.srs.dueAt <= now ? 0 : 1;
    const bDue = b.srs.dueAt <= now ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    return a.srs.dueAt - b.srs.dueAt;
  });
}

export function formatDue(state: SrsState, now = Date.now()) {
  const diff = state.dueAt - now;
  if (diff <= 0) return "Due now";
  const days = Math.ceil(diff / DAY);
  return days <= 1 ? "Due tomorrow" : `Due in ${days} days`;
}
