import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — WordSnap AI" },
      { name: "description", content: "Create your WordSnap AI account." },
    ],
  }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const { auth } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await auth.signUp(name, email, password);
      toast.success("Account created!");
      nav({ to: "/home" });
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === "email_confirmation_required") {
        toast.success(err.message);
        nav({ to: "/login" });
      } else {
        toast.error(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <Link to="/login" className="text-sm text-ink/60">
        ← Back
      </Link>
      <div className="mt-10">
        <h1 className="text-3xl font-black tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-ink/60">Start your smart vocabulary journey.</p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            type="text"
            required
            autoComplete="name"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 rounded-2xl border-ink/10 bg-ink/5 pl-11 text-base placeholder:text-ink/40"
          />
        </div>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded-2xl border-ink/10 bg-ink/5 pl-11 text-base placeholder:text-ink/40"
          />
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-2xl border-ink/10 bg-ink/5 pl-11 text-base placeholder:text-ink/40"
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-[var(--shadow-glow)]"
        >
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold gradient-text">
          Sign in
        </Link>
      </p>
    </div>
  );
}
