import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Moon,
  Bell,
  Languages,
  Type,
  Shield,
  Info,
  ChevronRight,
  ArrowLeft,
  Download,
  BellRing,
  Flame,
  Clock,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useData } from "@/lib/services";
import type { NotificationPrefs } from "@/lib/services/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — WordSnap AI" },
      { name: "description", content: "Customize your WordSnap AI experience." },
      { property: "og:title", content: "Settings — WordSnap AI" },
      {
        property: "og:description",
        content: "Notifications, appearance and install options for WordSnap AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [dark, setDark] = useState(true);
  const [fontSize, setFontSize] = useState<"S" | "M" | "L">("M");

  const data = useData();
  const { permission, request, supported } = useNotificationPermission();
  const { canInstall, installed, platform, promptInstall } = usePwaInstall();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    dailyWord: true,
    streakReminder: false,
    hour: 9,
  });

  useEffect(() => {
    data.getNotificationPrefs().then(setPrefs);
  }, [data]);

  const update = async (patch: Partial<NotificationPrefs>) => {
    const next = { ...prefs, ...patch };
    if ((patch.dailyWord || patch.streakReminder) && permission !== "granted") {
      const result = await request();
      if (result !== "granted") {
        toast.error(
          result === "denied"
            ? "Notifications are blocked in your browser settings."
            : "Notifications aren't supported on this device.",
        );
        return;
      }
      toast.success("Notifications enabled — Daily Word alerts are ready.");
    }
    setPrefs(next);
    await data.setNotificationPrefs(next);
  };

  const install = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") toast.success("Adding WordSnap to your home screen");
    else if (outcome === "unsupported")
      toast.info(
        platform === "ios"
          ? "In Safari: Share → Add to Home Screen"
          : "Open the browser menu → Install app",
      );
  };

  return (
    <AppShell>
      <div className="px-5 pt-8 pb-4">
        <Link
          to="/profile"
          className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-black tracking-tight">Settings</h1>
      </div>

      <div className="space-y-6 px-5">
        <Group title="Notifications">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-white/70">
                <BellRing className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">Permission</p>
                <p className="text-xs text-white/50">
                  {!supported
                    ? "Not supported on this device"
                    : permission === "granted"
                      ? "Allowed"
                      : permission === "denied"
                        ? "Blocked in browser settings"
                        : "Not requested yet"}
                </p>
              </div>
            </div>
            {supported && permission !== "granted" && (
              <Button
                size="sm"
                onClick={async () => {
                  const r = await request();
                  if (r === "granted") toast.success("Notifications enabled");
                  else if (r === "denied") toast.error("Permission blocked");
                }}
                className="h-9 shrink-0 rounded-xl gradient-primary text-xs font-semibold"
              >
                Enable
              </Button>
            )}
          </div>

          <Row icon={<Bell className="h-5 w-5" />} label="Daily Word alert">
            <Switch
              checked={prefs.dailyWord && permission === "granted"}
              onCheckedChange={(v) => update({ dailyWord: v })}
            />
          </Row>
          <Row icon={<Flame className="h-5 w-5" />} label="Streak reminder">
            <Switch
              checked={prefs.streakReminder && permission === "granted"}
              onCheckedChange={(v) => update({ streakReminder: v })}
            />
          </Row>
          <Row icon={<Clock className="h-5 w-5" />} label="Delivery time">
            <select
              value={prefs.hour}
              onChange={(e) => update({ hour: Number(e.target.value) })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none"
            >
              {[7, 8, 9, 12, 18, 20, 21].map((h) => (
                <option key={h} value={h} className="bg-[#0F172A]">
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </Row>
          <p className="px-5 pb-4 pt-1 text-[11px] leading-relaxed text-white/40">
            Preferences are stored now and will drive push delivery as soon as a push service is
            connected.
          </p>
        </Group>

        <Group title="App">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-white/70">
                <Download className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium">Add to Home Screen</p>
                <p className="text-xs text-white/50">
                  {installed ? "Installed" : canInstall ? "Ready to install" : "Manual steps"}
                </p>
              </div>
            </div>
            {!installed && (
              <Button
                size="sm"
                onClick={install}
                className="h-9 rounded-xl gradient-primary text-xs font-semibold"
              >
                Install
              </Button>
            )}
          </div>
        </Group>

        <Group title="Appearance">
          <Row icon={<Moon className="h-5 w-5" />} label="Dark mode">
            <Switch checked={dark} onCheckedChange={setDark} />
          </Row>
          <Row icon={<Type className="h-5 w-5" />} label="Font size">
            <div className="flex gap-1 rounded-full bg-white/10 p-1">
              {(["S", "M", "L"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`h-7 w-8 rounded-full text-xs font-bold ${
                    fontSize === s ? "gradient-primary text-white" : "text-white/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Row>
        </Group>

        <Group title="Preferences">
          <Row icon={<Languages className="h-5 w-5" />} label="Language">
            <span className="text-sm text-white/60">English</span>
          </Row>
        </Group>

        <Group title="Account">
          <LinkRow icon={<Shield className="h-5 w-5" />} label="Privacy & Security" />
          <LinkRow icon={<Info className="h-5 w-5" />} label="About WordSnap AI" />
        </Group>

        <p className="pt-2 text-center text-xs text-white/40">WordSnap AI · v1.0.0</p>
      </div>
    </AppShell>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-white/50">
        {title}
      </h3>
      <div className="card-premium divide-y divide-white/5 rounded-3xl">{children}</div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="text-white/70">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}

function LinkRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-white/5">
      <div className="flex items-center gap-3">
        <span className="text-white/70">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-white/40" />
    </button>
  );
}
