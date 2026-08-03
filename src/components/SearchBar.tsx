import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { suggestWords } from "@/lib/dictionary.functions";
import { startVoiceSearch, voiceSearchSupported } from "@/lib/speech";
import { cn } from "@/lib/utils";

/** Search field with debounced live autocomplete and voice dictation. */
export function SearchBar({
  initialValue = "",
  autoFocus = false,
  className,
}: {
  initialValue?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const suggest = useServerFn(suggestWords);
  const [value, setValue] = useState(initialValue);
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => setVoiceReady(voiceSearchSupported()), []);

  useEffect(() => setValue(initialValue), [initialValue]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value.trim()), 220);
    return () => clearTimeout(id);
  }, [value]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["suggestions", debounced],
    queryFn: () => suggest({ data: { query: debounced } }),
    enabled: debounced.length >= 2,
    staleTime: 1000 * 60 * 10,
  });

  const go = (term: string) => {
    const q = term.trim();
    if (!q) return;
    setOpen(false);
    setValue(q);
    navigate({ to: "/search", search: { q } });
  };

  const toggleVoice = () => {
    if (listening) {
      stopRef.current?.();
      setListening(false);
      return;
    }
    const stop = startVoiceSearch(
      (text) => {
        setValue(text);
        go(text);
      },
      () => setListening(false),
    );
    if (!stop) {
      toast.info("Voice search isn't supported in this browser yet.");
      return;
    }
    stopRef.current = stop;
    setListening(true);
  };

  return (
    <div className={cn("relative", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
        role="search"
      >
        <label htmlFor="wordsnap-search" className="sr-only">
          Search any English word
        </label>
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
        <input
          id="wordsnap-search"
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search any English word…"
          className="h-16 w-full rounded-3xl border border-white/10 bg-white/5 pl-14 pr-24 text-base outline-none transition-colors placeholder:text-white/40 focus:border-primary/60 focus:bg-white/10"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setValue("")}
            className="absolute right-16 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          aria-label={listening ? "Stop voice search" : "Start voice search"}
          onClick={toggleVoice}
          className={cn(
            "absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-2xl transition-all",
            listening ? "bg-accent animate-pulse-glow" : "gradient-primary",
          )}
        >
          {voiceSearchSupported() ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="glass absolute inset-x-0 top-[4.5rem] z-30 max-h-72 overflow-auto rounded-3xl p-2 shadow-2xl">
          {suggestions.map((s) => (
            <li key={s.word}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(s.word)}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm hover:bg-white/10"
              >
                <Search className="h-3.5 w-3.5 text-white/40" />
                <span className="truncate">{s.word}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
