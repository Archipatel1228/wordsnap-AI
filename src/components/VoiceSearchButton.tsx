import { Mic, MicOff } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { startVoiceSearch, voiceSearchSupported } from "@/lib/speech";
import { cn } from "@/lib/utils";

/**
 * Client-only voice control. This component is never rendered on the server,
 * so SpeechRecognition support is read directly — no SSR guessing, no mismatch.
 */
export function VoiceSearchButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const supported = voiceSearchSupported();
  const [listening, setListening] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const toggleVoice = () => {
    if (listening) {
      stopRef.current?.();
      setListening(false);
      return;
    }
    const stop = startVoiceSearch(onTranscript, () => setListening(false));
    if (!stop) {
      toast.info("Voice search isn't supported in this browser yet.");
      return;
    }
    stopRef.current = stop;
    setListening(true);
  };

  return (
    <button
      type="button"
      data-testid="voice-search-button"
      data-voice-supported={supported ? "true" : "false"}
      aria-label={
        !supported
          ? "Voice search unavailable in this browser"
          : listening
            ? "Stop voice search"
            : "Start voice search"
      }
      onClick={toggleVoice}
      className={cn(
        "absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-2xl transition-all",
        listening ? "bg-accent animate-pulse-glow" : "gradient-primary",
        !supported && "opacity-60",
      )}
    >
      {supported ? (
        <Mic data-testid="voice-icon-on" className="h-4 w-4" />
      ) : (
        <MicOff data-testid="voice-icon-off" className="h-4 w-4" />
      )}
    </button>
  );
}

/** Static, non-interactive placeholder rendered on the server and before hydration. */
export function VoiceSearchButtonFallback() {
  return (
    <span
      aria-hidden
      data-testid="voice-search-placeholder"
      className="gradient-primary absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-2xl opacity-60"
    >
      <MicOff className="h-4 w-4" />
    </span>
  );
}
