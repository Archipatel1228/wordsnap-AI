import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — WordSnap AI" },
      { name: "description", content: "Choose a new password for your WordSnap AI account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery link and emits PASSWORD_RECOVERY on load.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    void supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    nav({ to: "/home" });
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <div className="mt-16">
        <h1 className="text-3xl font-black tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-ink/60">
          {ready
            ? "Choose a password of at least 6 characters."
            : "Open this page from the reset link in your email."}
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-2xl border-ink/10 bg-ink/5 pl-11 text-base placeholder:text-ink/40"
          />
        </div>
        <Button
          type="submit"
          disabled={busy || !ready}
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-[var(--shadow-glow)]"
        >
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
