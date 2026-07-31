/** Web Speech API helpers with graceful degradation. */

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, lang = "en-US") {
  if (!speechSupported()) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
  return true;
}

/** Plays a real pronunciation file when the dictionary provides one, else falls back to TTS. */
export async function pronounce(text: string, audioUrl?: string) {
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
      return "audio" as const;
    } catch {
      /* fall through to speech synthesis */
    }
  }
  return speak(text) ? ("tts" as const) : ("unsupported" as const);
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export function voiceSearchSupported() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/** Starts dictation; returns a stop function, or null when unsupported. */
export function startVoiceSearch(onResult: (text: string) => void, onEnd?: () => void) {
  if (!voiceSearchSupported()) return null;
  const w = window as unknown as Record<string, new () => SpeechRecognitionLike>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  const recognition = new Ctor();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript;
    if (transcript) onResult(transcript);
  };
  recognition.onerror = () => onEnd?.();
  recognition.onend = () => onEnd?.();
  recognition.start();
  return () => recognition.stop();
}
