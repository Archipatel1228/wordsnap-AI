/**
 * Backend-agnostic contracts.
 *
 * Every screen talks to these interfaces only. Connecting Supabase later means
 * providing a Supabase implementation of `AuthService` / `DataService` and
 * passing it to `<ServicesProvider services={...}>` — no UI changes required.
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
  /** Resolves to null when the provider redirects the browser away. */
  signInWithGoogle(): Promise<AppUser | null>;
  /** Guests browse without an account; nothing is persisted. */
  signInAsGuest(): Promise<AppUser | null>;
  sendPasswordReset(email: string): Promise<void>;
  updateProfile(patch: Partial<Pick<AppUser, "name" | "avatarUrl">>): Promise<AppUser>;
  signOut(): Promise<void>;
  onAuthStateChange(cb: (user: AppUser | null) => void): () => void;
};


/** Spaced-repetition state (SM-2 inspired). */
export type SrsState = {
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: number;
};

export type SavedWord = {
  word: string;
  definition: string;
  partOfSpeech?: string;
  phonetic?: string;
  audio?: string;
  /** Optional collection the word belongs to. */
  folder?: string;
  favourite: boolean;
  createdAt: number;
  srs: SrsState;
};

/** Portable JSON backup of everything the learner owns. */
export type VocabularyBackup = {
  format: "wordsnap-backup";
  version: 1;
  exportedAt: number;
  savedWords: SavedWord[];
  history: HistoryItem[];
  preferences?: UserPreferences;
};


export type HistoryItem = { word: string; at: number };

export type UserPreferences = {
  translationLanguage: "hindi" | "gujarati";
  reduceMotion: boolean;
  dyslexiaFont: boolean;
  dailyWord: boolean;
  streakReminder: boolean;
  hour: number;
};

export type UserStats = {
  wordsLearned: number;
  wordsSaved: number;
  favourites: number;
  streak: number;
  dueToday: number;
};

export type CachedExplanation<T> = { value: T; at: number };

export type DataService = {
  /** History */
  listHistory(): Promise<HistoryItem[]>;
  addHistory(word: string): Promise<void>;
  removeHistory(word: string): Promise<void>;
  clearHistory(): Promise<void>;

  /** Saved vocabulary */
  listSavedWords(): Promise<SavedWord[]>;
  saveWord(word: Omit<SavedWord, "favourite" | "createdAt" | "srs">): Promise<void>;
  removeSavedWord(word: string): Promise<void>;
  toggleFavourite(word: string): Promise<void>;
  updateSrs(word: string, srs: SrsState): Promise<void>;

  /** Preferences + stats */
  getPreferences(): Promise<UserPreferences>;
  setPreferences(prefs: UserPreferences): Promise<void>;
  getStats(): Promise<UserStats>;
  recordActivity(): Promise<void>;

  /** Offline-friendly AI response cache */
  getCachedExplanation<T>(key: string): Promise<CachedExplanation<T> | null>;
  setCachedExplanation<T>(key: string, value: T): Promise<void>;

  /** JSON backup of saved words, folders and flashcard progress */
  exportBackup(): Promise<VocabularyBackup>;
  importBackup(backup: VocabularyBackup): Promise<{ words: number; history: number }>;

  /** Persist a device push token once a push provider is connected. */
  registerPushToken(token: string): Promise<void>;


  /** True while data lives on the device only (pre-Supabase). */
  readonly isLocalOnly: boolean;
};
