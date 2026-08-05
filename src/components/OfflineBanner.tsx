import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
      <div
        role="status"
        className="glass flex w-full max-w-[500px] items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/15 px-4 py-3 text-sm"
      >
        <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
        <span className="text-ink/85">
          You're offline — saved words and cached screens still work.
        </span>
      </div>
    </div>
  );
}
