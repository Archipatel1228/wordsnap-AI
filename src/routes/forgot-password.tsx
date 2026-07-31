import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wordmark } from "@/components/Logo";
import { useAuth } from "@/lib/services";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — WordSnap AI" },
      { name: "description", content: "Reset the password for your WordSnap AI account." },
      { property: "og:title", content: "Reset password — WordSnap AI" },
      { property: "og:description", content: "Get a reset link for your WordSnap AI account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const { auth } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await auth.sendPasswordReset(email);
      setSent(true);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-6 py-10">
      <Link to="/login" aria-label="Back to sign in" className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <Wordmark className="mt-8" />
      <h1 className="mt-8 text-3xl font-black tracking-tight">Reset your password</h1>
      <p className="mt-2 text-sm text-white/60">
        Enter your email and we'll send a reset link once account services are connected.
      </p>

      {sent ? (
        <div className="card-premium mt-8 rounded-3xl p-6 text-sm text-white/80">
          If an account exists for <span className="font-semibold">{email}</span>, a reset link is on
          its way.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-2xl border-white/10 bg-white/5 pl-11 text-base placeholder:text-white/40"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold"
          >
            Send reset link
          </Button>
        </form>
      )}
    </main>
  );
}
