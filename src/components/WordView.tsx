import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Copy, RefreshCw, SearchX, Share2, WifiOff } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { AiExplanationPanel } from "@/components/AiExplanationPanel";
import { DictionaryResult, DictionarySkeleton } from "@/components/DictionaryResult";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { lookupWord } from "@/lib/dictionary.functions";
import { primaryAudio, primaryDefinition, primaryPhonetic } from "@/lib/dictionary/types";
import { useData } from "@/lib/services";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/** Shared word experience: live dictionary entry + AI layer + save/share actions. */
export function WordView({ word }: { word: string }) {
  const data = useData();
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const lookup = useServerFn(lookupWord);

  const query = useQuery({
    queryKey: ["dictionary", word.toLowerCase()],
    queryFn: () => lookup({ data: { word } }),
    enabled: word.trim().length > 0,
    retry: 1,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const saved = useQuery({
    queryKey: ["saved-words"],
    queryFn: () => data.listSavedWords(),
  });

  const entry = query.data;
  const isSaved = Boolean(
    saved.data?.some((w) => w.word.toLowerCase() === (entry?.word ?? word).toLowerCase()),
  );

  useEffect(() => {
    if (!entry) return;
    void data.addHistory(entry.word);
    void data.recordActivity();
    void queryClient.invalidateQueries({ queryKey: ["history"] });
    void queryClient.invalidateQueries({ queryKey: ["stats"] });
  }, [entry, data, queryClient]);

  const toggleSave = async () => {
    if (!entry) return;
    try {
      if (isSaved) {
        await data.removeSavedWord(entry.word);
        toast.success(`Removed “${entry.word}”`);
      } else {
        await data.saveWord({
          word: entry.word,
          definition: primaryDefinition(entry),
          partOfSpeech: entry.meanings[0]?.partOfSpeech,
          phonetic: primaryPhonetic(entry),
          audio: primaryAudio(entry),
        });
        toast.success(`Saved “${entry.word}” to your vocabulary`);
      }
    } catch (error) {
      toast.error((error as Error).message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["saved-words"] });
    await queryClient.invalidateQueries({ queryKey: ["stats"] });
  };


  const copy = async () => {
    if (!entry) return;
    await navigator.clipboard?.writeText(`${entry.word} — ${primaryDefinition(entry)}`);
    toast.success("Copied to clipboard");
  };

  const share = async () => {
    if (!entry) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: entry.word, text: primaryDefinition(entry) });
      } else {
        await navigator.clipboard?.writeText(window.location.href);
        toast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  if (query.isPending) return <DictionarySkeleton />;

  if (query.isError) {
    return (
      <EmptyState
        icon={online ? <RefreshCw className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
        title={online ? "Couldn't load that word" : "You're offline"}
        description={
          online
            ? ((query.error as Error)?.message ?? "The dictionary service didn't respond.")
            : "Reconnect to look up new words. Saved words stay available."
        }
        action={
          <Button
            onClick={() => query.refetch()}
            className="h-11 rounded-2xl gradient-primary px-6 text-sm font-semibold"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </Button>
        }
      />
    );
  }

  if (!entry) {
    return (
      <EmptyState
        icon={<SearchX className="h-6 w-6" />}
        title={`No dictionary entry for “${word}”`}
        description="Check the spelling, or try a different form of the word."
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={toggleSave}
          aria-pressed={isSaved}
          className={`flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-all ${
            isSaved ? "border-transparent gradient-primary" : "border-ink/10 bg-ink/5"
          }`}
        >
          <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          {isSaved ? "Saved" : "Save word"}
        </button>
      </div>

      <DictionaryResult entry={entry} />
      <AiExplanationPanel word={entry.word} context={primaryDefinition(entry)} />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={copy}
          className="glass flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold hover:bg-ink/10"
        >
          <Copy className="h-4 w-4" /> Copy
        </button>
        <button
          onClick={share}
          className="glass flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold hover:bg-ink/10"
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}
