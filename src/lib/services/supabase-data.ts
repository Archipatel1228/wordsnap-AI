import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/diagnostics";
import {
  getCachedExplanation,
  setCachedExplanation,
} from "@/lib/ai-cache";
import { isDue } from "@/lib/srs";
import type {
  DataService,
  HistoryItem,
  SavedWord,
  SrsState,
  UserPreferences,
  UserStats,
  VocabularyBackup,
} from "./types";

/**
 * Cloud-backed data service. Every read and write is scoped to the signed-in
 * user by row-level security, so one account can never see another's data.
 */

const DEFAULT_PREFS: UserPreferences = {
  translationLanguage: "hindi",
  reduceMotion: false,
  dyslexiaFont: false,
  dailyWord: true,
  streakReminder: false,
  hour: 9,
};

async function userId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function requireUser(action: string): Promise<string> {
  const id = await userId();
  if (!id) throw new Error(`Sign in to ${action}.`);
  return id;
}

type SavedRow = {
  word: string;
  definition: string;
  part_of_speech: string | null;
  phonetic: string | null;
  audio: string | null;
  folder: string | null;
  favourite: boolean;
  srs_ease: number;
  srs_interval_days: number;
  srs_repetitions: number;
  srs_due_at: string;
  created_at: string;
};

function toSavedWord(row: SavedRow): SavedWord {
  return {
    word: row.word,
    definition: row.definition,
    ...(row.part_of_speech ? { partOfSpeech: row.part_of_speech } : {}),
    ...(row.phonetic ? { phonetic: row.phonetic } : {}),
    ...(row.audio ? { audio: row.audio } : {}),
    ...(row.folder ? { folder: row.folder } : {}),
    favourite: row.favourite,
    createdAt: new Date(row.created_at).getTime(),
    srs: {
      ease: row.srs_ease,
      intervalDays: row.srs_interval_days,
      repetitions: row.srs_repetitions,
      dueAt: new Date(row.srs_due_at).getTime(),
    },
  };
}

function fail(scope: string, error: unknown): never {
  logError(`data.${scope}`, error);
  throw error instanceof Error ? error : new Error(String(error));
}

const dayKey = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

export const supabaseDataService: DataService = {
  isLocalOnly: false,

  async listHistory() {
    const id = await userId();
    if (!id) return [];
    const { data, error } = await supabase
      .from("search_history")
      .select("word, viewed_at")
      .order("viewed_at", { ascending: false })
      .limit(200);
    if (error) fail("listHistory", error);
    return (data ?? []).map<HistoryItem>((row) => ({
      word: row.word,
      at: new Date(row.viewed_at).getTime(),
    }));
  },

  async addHistory(word) {
    const id = await userId();
    if (!id) return;
    const { error } = await supabase
      .from("search_history")
      .upsert(
        { user_id: id, word, viewed_at: new Date().toISOString() },
        { onConflict: "user_id,word_key" },
      );
    if (error) fail("addHistory", error);
  },

  async removeHistory(word) {
    const id = await requireUser("manage your history");
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("user_id", id)
      .eq("word_key", word.toLowerCase());
    if (error) fail("removeHistory", error);
  },

  async clearHistory() {
    const id = await requireUser("manage your history");
    const { error } = await supabase.from("search_history").delete().eq("user_id", id);
    if (error) fail("clearHistory", error);
  },

  async listSavedWords() {
    const id = await userId();
    if (!id) return [];
    const { data, error } = await supabase
      .from("saved_words")
      .select(
        "word, definition, part_of_speech, phonetic, audio, folder, favourite, srs_ease, srs_interval_days, srs_repetitions, srs_due_at, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) fail("listSavedWords", error);
    return (data ?? []).map((row) => toSavedWord(row as SavedRow));
  },

  async saveWord(word) {
    const id = await requireUser("save words to your vocabulary");
    const { error } = await supabase.from("saved_words").upsert(
      {
        user_id: id,
        word: word.word,
        definition: word.definition ?? "",
        part_of_speech: word.partOfSpeech ?? null,
        phonetic: word.phonetic ?? null,
        audio: word.audio ?? null,
        folder: word.folder ?? null,
      },
      { onConflict: "user_id,word_key", ignoreDuplicates: true },
    );
    if (error) fail("saveWord", error);
  },

  async removeSavedWord(word) {
    const id = await requireUser("manage your vocabulary");
    const { error } = await supabase
      .from("saved_words")
      .delete()
      .eq("user_id", id)
      .eq("word_key", word.toLowerCase());
    if (error) fail("removeSavedWord", error);
  },

  async toggleFavourite(word) {
    const id = await requireUser("manage your vocabulary");
    const { data, error } = await supabase
      .from("saved_words")
      .select("id, favourite")
      .eq("user_id", id)
      .eq("word_key", word.toLowerCase())
      .maybeSingle();
    if (error) fail("toggleFavourite", error);
    if (!data) return;
    const { error: updateError } = await supabase
      .from("saved_words")
      .update({ favourite: !data.favourite })
      .eq("id", data.id);
    if (updateError) fail("toggleFavourite", updateError);
  },

  async updateSrs(word, srs: SrsState) {
    const id = await requireUser("track flashcard progress");
    const { error } = await supabase
      .from("saved_words")
      .update({
        srs_ease: srs.ease,
        srs_interval_days: srs.intervalDays,
        srs_repetitions: srs.repetitions,
        srs_due_at: new Date(srs.dueAt).toISOString(),
      })
      .eq("user_id", id)
      .eq("word_key", word.toLowerCase());
    if (error) fail("updateSrs", error);
  },

  async getPreferences() {
    const id = await userId();
    if (!id) return DEFAULT_PREFS;
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", id)
      .maybeSingle();
    if (error) fail("getPreferences", error);
    if (!data) return DEFAULT_PREFS;
    return {
      translationLanguage: (data.translation_language === "gujarati"
        ? "gujarati"
        : "hindi") as UserPreferences["translationLanguage"],
      reduceMotion: data.reduce_motion,
      dyslexiaFont: data.dyslexia_font,
      dailyWord: data.daily_word,
      streakReminder: data.streak_reminder,
      hour: data.hour,
    };
  },

  async setPreferences(prefs) {
    const id = await requireUser("save your preferences");
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: id,
        translation_language: prefs.translationLanguage,
        reduce_motion: prefs.reduceMotion,
        dyslexia_font: prefs.dyslexiaFont,
        daily_word: prefs.dailyWord,
        streak_reminder: prefs.streakReminder,
        hour: prefs.hour,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) fail("setPreferences", error);
  },

  async getStats(): Promise<UserStats> {
    const id = await userId();
    if (!id) {
      return { wordsLearned: 0, wordsSaved: 0, favourites: 0, streak: 0, dueToday: 0 };
    }
    const [saved, history, days] = await Promise.all([
      supabase.from("saved_words").select("favourite, srs_due_at"),
      supabase.from("search_history").select("id"),
      supabase.from("activity_days").select("day").order("day", { ascending: false }).limit(400),
    ]);

    const savedRows = saved.data ?? [];
    const dayList = (days.data ?? []).map((d) => d.day as string);

    let streak = 0;
    for (let i = 0; ; i++) {
      const day = dayKey(Date.now() - i * 86_400_000);
      if (dayList.includes(day)) streak++;
      else if (i === 0) continue; // today not logged yet — check yesterday onwards
      else break;
      if (i > 400) break;
    }

    return {
      wordsLearned: history.data?.length ?? 0,
      wordsSaved: savedRows.length,
      favourites: savedRows.filter((w) => w.favourite).length,
      streak,
      dueToday: savedRows.filter((w) =>
        isDue({
          ease: 0,
          intervalDays: 0,
          repetitions: 0,
          dueAt: new Date(w.srs_due_at as string).getTime(),
        }),
      ).length,
    };
  },

  async recordActivity() {
    const id = await userId();
    if (!id) return;
    const { error } = await supabase
      .from("activity_days")
      .upsert({ user_id: id, day: dayKey() }, { onConflict: "user_id,day" });
    if (error) logError("data.recordActivity", error);
  },

  async getCachedExplanation<T>(key: string) {
    return getCachedExplanation<T>(key);
  },
  async setCachedExplanation<T>(key: string, value: T) {
    setCachedExplanation(key, value);
  },

  async exportBackup(): Promise<VocabularyBackup> {
    const [savedWords, history, preferences] = await Promise.all([
      supabaseDataService.listSavedWords(),
      supabaseDataService.listHistory(),
      supabaseDataService.getPreferences(),
    ]);
    return {
      format: "wordsnap-backup",
      version: 1,
      exportedAt: Date.now(),
      savedWords,
      history,
      preferences,
    };
  },

  async importBackup(backup) {
    const id = await requireUser("import a backup");
    if (backup?.format !== "wordsnap-backup") {
      throw new Error("That file isn't a WordSnap backup.");
    }
    const words = Array.isArray(backup.savedWords) ? backup.savedWords : [];
    const history = Array.isArray(backup.history) ? backup.history : [];

    if (words.length) {
      const rows = words.map((w) => ({
        user_id: id,
        word: w.word,
        definition: w.definition ?? "",
        part_of_speech: w.partOfSpeech ?? null,
        phonetic: w.phonetic ?? null,
        audio: w.audio ?? null,
        folder: w.folder ?? null,
        favourite: Boolean(w.favourite),
        srs_ease: w.srs?.ease ?? 2.5,
        srs_interval_days: w.srs?.intervalDays ?? 0,
        srs_repetitions: w.srs?.repetitions ?? 0,
        srs_due_at: new Date(w.srs?.dueAt ?? Date.now()).toISOString(),
      }));
      const { error } = await supabase
        .from("saved_words")
        .upsert(rows, { onConflict: "user_id,word_key" });
      if (error) fail("importBackup.words", error);
    }

    if (history.length) {
      const rows = history.slice(0, 200).map((h) => ({
        user_id: id,
        word: h.word,
        viewed_at: new Date(h.at ?? Date.now()).toISOString(),
      }));
      const { error } = await supabase
        .from("search_history")
        .upsert(rows, { onConflict: "user_id,word_key" });
      if (error) fail("importBackup.history", error);
    }

    if (backup.preferences) await supabaseDataService.setPreferences(backup.preferences);

    return { words: words.length, history: history.length };
  },

  async registerPushToken(token) {
    const id = await userId();
    if (!id) return;
    const { error } = await supabase
      .from("push_tokens")
      .upsert({ user_id: id, token }, { onConflict: "user_id,token" });
    if (error) logError("data.registerPushToken", error);
  },
};
