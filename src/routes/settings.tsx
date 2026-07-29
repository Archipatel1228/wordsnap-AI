import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { Moon, Bell, Languages, Type, Shield, Info, ChevronRight, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — WordSnap AI" },
      { name: "description", content: "Customize your WordSnap AI experience." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [dark, setDark] = useState(true);
  const [notif, setNotif] = useState(true);
  const [fontSize, setFontSize] = useState<"S" | "M" | "L">("M");

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
          <Row icon={<Bell className="h-5 w-5" />} label="Notifications">
            <Switch checked={notif} onCheckedChange={setNotif} />
          </Row>
        </Group>

        <Group title="Account">
          <LinkRow icon={<Shield className="h-5 w-5" />} label="Privacy & Security" />
          <LinkRow icon={<Info className="h-5 w-5" />} label="About WordSnap AI" />
        </Group>

        <p className="pt-2 text-center text-xs text-white/40">
          WordSnap AI · v1.0.0
        </p>
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
