import type { WordEntry } from "@/lib/mock-data";

/**
 * Backend-agnostic contracts. Swap the mock implementations for Supabase
 * (auth + database) later without touching any UI screen.
 */

export type AppUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export type AuthService = {
  getUser(): Promise<AppUser | null>;
  signInWithPassword(email: string, password: string): Promise<AppUser>;
  signUp(name: string, email: string, password: string): Promise<AppUser>;
  signInWithGoogle(): Promise<AppUser>;
  signInAsGuest(): Promise<AppUser>;
  signOut(): Promise<void>;
  onAuthStateChange(cb: (user: AppUser | null) => void): () => void;
};

export type HistoryItem = { id: string; word: string; time: string };
export type SavedFolder = { id: string; name: string; count: number; color: string };
export type UserStats = {
  wordsLearned: number;
  wordsSaved: number;
  streak: number;
  level: number;
  xp: number;
  xpToNext: number;
};

export type NotificationPrefs = {
  dailyWord: boolean;
  streakReminder: boolean;
  hour: number;
};

export type DataService = {
  listRecentHistory(): Promise<HistoryItem[]>;
  addHistory(word: WordEntry): Promise<void>;
  clearHistory(): Promise<void>;
  listFolders(): Promise<SavedFolder[]>;
  listSavedWords(): Promise<WordEntry[]>;
  saveWord(word: WordEntry): Promise<void>;
  removeSavedWord(id: string): Promise<void>;
  getStats(): Promise<UserStats>;
  getNotificationPrefs(): Promise<NotificationPrefs>;
  setNotificationPrefs(prefs: NotificationPrefs): Promise<void>;
  /** Persist a device push token once a push provider is connected. */
  registerPushToken(token: string): Promise<void>;
};
