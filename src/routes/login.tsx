import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — WordSnap AI" },
      { name: "description", content: "Sign in to your WordSnap AI account." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { auth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await auth.signInWithPassword(email, password);
      toast.success("Welcome back!");
      nav({ to: "/home" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const social = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      const result = await fn();
      if (result === null) return; // redirecting to the provider
      nav({ to: "/home" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <div className="mt-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold">
          Word<span className="gradient-text">Snap</span>
        </span>
      </div>

      <div className="mt-10">
        <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-white/60">Sign in to keep learning new words daily.</p>
      </div>

      <form onSubmit={go} className="mt-8 space-y-4">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded-2xl border-white/10 bg-white/5 pl-11 text-base placeholder:text-white/40"
          />
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-2xl border-white/10 bg-white/5 pl-11 text-base placeholder:text-white/40"
          />
        </div>
        <div className="text-right">
          <Link to="/forgot-password" className="text-xs text-white/50 hover:text-white/80">Forgot password?</Link>
        </div>
        <Button
          type="submit"
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-[var(--shadow-glow)]"
        >
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-widest text-white/40">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => social(() => auth.signInWithGoogle())}
          variant="outline"
          className="h-14 w-full rounded-2xl border-white/10 bg-white/5 text-base hover:bg-white/10"
        >
          <GoogleIcon /> Continue with Google
        </Button>
        <Button
          onClick={() => social(() => auth.signInAsGuest())}
          variant="ghost"
          className="h-14 w-full rounded-2xl text-base text-white/70 hover:bg-white/5"
        >
          Continue as Guest
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-white/60">
        Don't have an account?{" "}
        <Link to="/register" className="font-semibold gradient-text">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.5-4.8 9.5-9.3 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
