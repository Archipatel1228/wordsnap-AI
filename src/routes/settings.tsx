import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  Download,
  Eye,
  HardDriveDownload,
  Languages,
  Moon,
  Sun,
  Type,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useNotifications } from "@/hooks/useNotifications";
import { usePreferences, useData } from "@/lib/services";
import { useTheme } from "@/lib/theme";
import type { VocabularyBackup } from "@/lib/services/types";


export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — WordSnap AI" },
      { name: "description", content: "Accessibility, notifications and install settings." },
      { property: "og:title", content: "Settings — WordSnap AI" },
      { property: "og:description", content: "Tune WordSnap AI to the way you learn." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function Row({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink/8">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="mt-0.5 text-xs text-ink/50">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { preferences, update } = usePreferences();
  const { permission, sendTest } = useNotifications();
  const { canInstall, installed, platform, promptInstall } = usePwaInstall();
  const data = useData();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const prefs = preferences;

  const exportBackup = async () => {
    try {
      const backup = await data.exportBackup();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `wordsnap-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${backup.savedWords.length} saved words`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as VocabularyBackup;
      const result = await data.importBackup(parsed);
      await queryClient.invalidateQueries();
      toast.success(`Restored ${result.words} words and ${result.history} history entries`);
    } catch (error) {
      toast.error((error as Error).message || "That file couldn't be read.");
    }
  };



  return (
    <div className="mx-auto min-h-dvh w-full max-w-[520px] px-5 pb-20 pt-8">
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          aria-label="Back to profile"
          className="grid h-11 w-11 place-items-center rounded-2xl border border-ink/10 bg-ink/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black">Settings</h1>
      </div>

      <h2 className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-ink/50">
        Appearance
      </h2>
      <div className="space-y-2">
        <Row
          icon={theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          title="Theme"
          description={theme === "dark" ? "Dark mode is on." : "Light mode is on."}
        >
          <div className="flex items-center gap-1 rounded-xl border border-ink/10 bg-ink/5 p-1">
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${theme === "light" ? "gradient-primary text-white" : "text-ink/60"}`}
            >
              Light
            </button>
            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${theme === "dark" ? "gradient-primary text-white" : "text-ink/60"}`}
            >
              Dark
            </button>
          </div>
        </Row>
      </div>

      <h2 className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-ink/50">
        Accessibility
      </h2>
      <div className="space-y-2">
        <Row icon={<Zap className="h-4 w-4" />} title="Reduce motion" description="Minimise animations and transitions.">
          <Switch
            checked={prefs?.reduceMotion ?? false}
            onCheckedChange={(value) => update({ reduceMotion: value })}
            aria-label="Reduce motion"
          />
        </Row>
        <Row
          icon={<Type className="h-4 w-4" />}
          title="Dyslexia-friendly text"
          description="Wider spacing and heavier letterforms."
        >
          <Switch
            checked={prefs?.dyslexiaFont ?? false}
            onCheckedChange={(value) => update({ dyslexiaFont: value })}
            aria-label="Dyslexia-friendly text"
          />
        </Row>
        <Row
          icon={<Languages className="h-4 w-4" />}
          title="Preferred translation"
          description="Highlighted first in AI explanations."
        >
          <select
            aria-label="Preferred translation language"
            value={prefs?.translationLanguage ?? "hindi"}
            onChange={(e) =>
              update({ translationLanguage: e.target.value as "hindi" | "gujarati" })
            }
            className="rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs"
          >
            <option value="hindi">Hindi</option>
            <option value="gujarati">Gujarati</option>
          </select>
        </Row>
      </div>

      <h2 className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-ink/50">
        Notifications
      </h2>
      <div className="space-y-2">
        <Row icon={<Bell className="h-4 w-4" />} title="Daily Word alert" description={`Permission: ${permission}`}>
          <Switch
            checked={prefs?.dailyWord ?? false}
            onCheckedChange={(value) => update({ dailyWord: value })}
            aria-label="Daily word alert"
          />
        </Row>
        <Row icon={<Bell className="h-4 w-4" />} title="Streak reminder" description="A nudge if you haven't learned today.">
          <Switch
            checked={prefs?.streakReminder ?? false}
            onCheckedChange={(value) => update({ streakReminder: value })}
            aria-label="Streak reminder"
          />
        </Row>
        <Button
          onClick={async () => {
            const result = await sendTest();
            if (result === "sent") toast.success("Test notification sent");
            else if (result === "denied") toast.error("Notifications are blocked in your browser");
            else toast.info("This browser doesn't support notifications");
          }}
          variant="outline"
          className="h-12 w-full rounded-2xl border-ink/15 bg-ink/5 text-sm font-semibold"
        >
          Send a test Daily Word alert
        </Button>
      </div>

      <h2 className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-ink/50">App</h2>
      <div className="space-y-2">
        <Row
          icon={<Download className="h-4 w-4" />}
          title={installed ? "Installed" : "Add to home screen"}
          description={
            installed
              ? "WordSnap AI is installed on this device."
              : canInstall
                ? "One tap to install the app."
                : platform === "ios"
                  ? "In Safari: Share → Add to Home Screen."
                  : "Use your browser menu → Install app."
          }
        >
          {!installed && canInstall && (
            <Button
              onClick={async () => {
                const outcome = await promptInstall();
                if (outcome === "accepted") toast.success("Installing WordSnap AI…");
              }}
              className="h-9 rounded-xl gradient-primary px-4 text-xs font-semibold"
            >
              Install
            </Button>
          )}
        </Row>
        <Row
          icon={<Eye className="h-4 w-4" />}
          title="Data storage"
          description="Saved words, history, streaks and preferences sync securely to your account."
        />
        <Row
          icon={<HardDriveDownload className="h-4 w-4" />}
          title="Backup"
          description="Export or restore your vocabulary, folders and flashcard progress as JSON."
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={exportBackup}
            variant="outline"
            className="h-12 rounded-2xl border-ink/15 bg-ink/5 text-sm font-semibold"
          >
            Export JSON
          </Button>
          <Button
            onClick={() => fileRef.current?.click()}
            variant="outline"
            className="h-12 rounded-2xl border-ink/15 bg-ink/5 text-sm font-semibold"
          >
            Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={importBackup}
          />
        </div>
      </div>
    </div>
  );
}

