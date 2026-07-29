import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, User } from "lucide-react";
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
  return (
    <div className="flex min-h-screen flex-col px-6 py-10">
      <Link to="/login" className="text-sm text-white/60">
        ← Back
      </Link>
      <div className="mt-10">
        <h1 className="text-3xl font-black tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-white/60">Start your smart vocabulary journey.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          nav({ to: "/home" });
        }}
        className="mt-8 space-y-4"
      >
        {[
          { icon: User, type: "text", placeholder: "Full name" },
          { icon: Mail, type: "email", placeholder: "Email address" },
          { icon: Lock, type: "password", placeholder: "Password" },
        ].map((f, i) => (
          <div key={i} className="relative">
            <f.icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              type={f.type}
              placeholder={f.placeholder}
              className="h-14 rounded-2xl border-white/10 bg-white/5 pl-11 text-base placeholder:text-white/40"
            />
          </div>
        ))}
        <Button
          type="submit"
          className="h-14 w-full rounded-2xl gradient-primary text-base font-semibold shadow-[var(--shadow-glow)]"
        >
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-white/60">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold gradient-text">
          Sign in
        </Link>
      </p>
    </div>
  );
}
