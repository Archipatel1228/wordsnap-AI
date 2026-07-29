export type WordEntry = {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  meaning: string;
  translation: string;
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  related: string[];
};

export const MOCK_WORDS: WordEntry[] = [
  {
    id: "serendipity",
    word: "Serendipity",
    phonetic: "/ˌsɛr.ənˈdɪp.ɪ.ti/",
    partOfSpeech: "noun",
    level: "Advanced",
    meaning: "The occurrence of events by chance in a happy or beneficial way.",
    translation: "अप्रत्याशित सुखद खोज",
    examples: [
      "Meeting her at the café was pure serendipity.",
      "A fortunate stroke of serendipity led to the discovery.",
    ],
    synonyms: ["chance", "fortune", "luck", "providence"],
    antonyms: ["misfortune", "design"],
    related: ["fluke", "kismet", "windfall"],
  },
  {
    id: "ephemeral",
    word: "Ephemeral",
    phonetic: "/ɪˈfɛm.ər.əl/",
    partOfSpeech: "adjective",
    level: "Advanced",
    meaning: "Lasting for a very short time.",
    translation: "क्षणिक",
    examples: [
      "The beauty of the sunset was ephemeral.",
      "Fame can be ephemeral in the digital age.",
    ],
    synonyms: ["fleeting", "transient", "momentary"],
    antonyms: ["permanent", "eternal"],
    related: ["evanescent", "brief"],
  },
  {
    id: "resilient",
    word: "Resilient",
    phonetic: "/rɪˈzɪl.i.ənt/",
    partOfSpeech: "adjective",
    level: "Intermediate",
    meaning: "Able to withstand or recover quickly from difficult conditions.",
    translation: "लचीला, मज़बूत",
    examples: [
      "She is remarkably resilient after the setback.",
      "A resilient economy bounces back from shocks.",
    ],
    synonyms: ["tough", "hardy", "strong"],
    antonyms: ["fragile", "weak"],
    related: ["adaptable", "durable"],
  },
  {
    id: "eloquent",
    word: "Eloquent",
    phonetic: "/ˈɛl.ə.kwənt/",
    partOfSpeech: "adjective",
    level: "Intermediate",
    meaning: "Fluent or persuasive in speaking or writing.",
    translation: "वाग्मी",
    examples: [
      "Her eloquent speech moved the entire audience.",
      "He gave an eloquent defense of his ideas.",
    ],
    synonyms: ["articulate", "expressive", "fluent"],
    antonyms: ["inarticulate", "tongue-tied"],
    related: ["persuasive", "silver-tongued"],
  },
  {
    id: "luminous",
    word: "Luminous",
    phonetic: "/ˈluː.mɪ.nəs/",
    partOfSpeech: "adjective",
    level: "Intermediate",
    meaning: "Full of or shedding light; bright or shining.",
    translation: "प्रकाशमान",
    examples: ["A luminous full moon lit the path.", "Her luminous smile brightened the room."],
    synonyms: ["radiant", "glowing", "bright"],
    antonyms: ["dark", "dim"],
    related: ["incandescent", "shining"],
  },
  {
    id: "quintessential",
    word: "Quintessential",
    phonetic: "/ˌkwɪn.tɪˈsɛn.ʃəl/",
    partOfSpeech: "adjective",
    level: "Advanced",
    meaning: "Representing the most perfect example of a quality or class.",
    translation: "सर्वोत्तम उदाहरण",
    examples: ["He is the quintessential English gentleman."],
    synonyms: ["archetypal", "classic", "definitive"],
    antonyms: ["atypical"],
    related: ["prototype", "epitome"],
  },
];

export function findWord(id: string) {
  return MOCK_WORDS.find((w) => w.id.toLowerCase() === id.toLowerCase());
}

export const RECENT_HISTORY = [
  { id: "serendipity", word: "Serendipity", time: "2m ago" },
  { id: "ephemeral", word: "Ephemeral", time: "1h ago" },
  { id: "resilient", word: "Resilient", time: "Yesterday" },
  { id: "eloquent", word: "Eloquent", time: "2 days ago" },
];

export const SAVED_FOLDERS = [
  { id: "toefl", name: "TOEFL Prep", count: 42, color: "from-violet-500 to-fuchsia-500" },
  { id: "daily", name: "Daily Discoveries", count: 18, color: "from-pink-500 to-rose-500" },
  { id: "business", name: "Business English", count: 27, color: "from-emerald-500 to-teal-500" },
  { id: "poetic", name: "Poetic Words", count: 12, color: "from-amber-500 to-orange-500" },
];

export const ACHIEVEMENTS = [
  { id: "streak-7", name: "7-Day Streak", icon: "🔥", unlocked: true },
  { id: "words-100", name: "100 Words", icon: "📚", unlocked: true },
  { id: "night-owl", name: "Night Owl", icon: "🌙", unlocked: true },
  { id: "polyglot", name: "Polyglot", icon: "🌍", unlocked: false },
  { id: "scholar", name: "Scholar", icon: "🎓", unlocked: false },
  { id: "master", name: "Word Master", icon: "👑", unlocked: false },
];

export const USER_STATS = {
  name: "Alex Morgan",
  email: "alex@wordsnap.ai",
  wordsLearned: 247,
  wordsSaved: 89,
  streak: 12,
  level: 8,
  xp: 640,
  xpToNext: 1000,
};
