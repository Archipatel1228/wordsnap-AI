import { Download, Share, X, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function InstallPrompt() {
  const { canInstall, installed, dismissed, platform, promptInstall, dismiss } = usePwaInstall();
  const [showHelp, setShowHelp] = useState(false);

  if (installed || dismissed) return null;

  const onInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") toast.success("WordSnap is being added to your home screen");
    else if (outcome === "unsupported") setShowHelp(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
      <div className="card-premium w-full max-w-[500px] rounded-3xl p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl gradient-primary">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Add WordSnap to your home screen</p>
            <p className="mt-1 text-xs text-ink/60">
              Launch instantly, full screen, and works offline.
            </p>
          </div>
          <button
            aria-label="Dismiss install prompt"
            onClick={dismiss}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/10 text-ink/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            onClick={onInstall}
            className="h-11 flex-1 rounded-2xl gradient-primary text-sm font-semibold"
          >
            {canInstall ? "Add to Home Screen" : "Show me how"}
          </Button>
        </div>

        {(showHelp || !canInstall) && (
          <div className="mt-3 rounded-2xl bg-ink/5 p-3 text-xs leading-relaxed text-ink/70">
            {platform === "ios" ? (
              <span className="inline-flex flex-wrap items-center gap-1">
                Tap <Share className="inline h-3.5 w-3.5" /> Share in Safari, then
                <Plus className="inline h-3.5 w-3.5" /> “Add to Home Screen”.
              </span>
            ) : platform === "android" ? (
              <>Open the browser menu (⋮) and tap “Install app” or “Add to Home screen”.</>
            ) : (
              <>Use the install icon in your browser’s address bar, or the browser menu → Install.</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
