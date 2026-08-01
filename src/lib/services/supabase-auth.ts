import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { logEvent } from "@/lib/diagnostics";
import type { AppUser, AuthService } from "./types";

/** Real account service backed by Lovable Cloud auth. Sessions persist across refreshes. */

function toAppUser(user: User | null | undefined): AppUser | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta['name'] === "string" && meta['name']) ||
    (typeof meta['full_name'] === "string" && meta['full_name']) ||
    (user.email ? user.email.split("@")[0] : "Learner");
  const avatarUrl = typeof meta['avatar_url'] === "string" ? meta['avatar_url'] : undefined;
  return {
    id: user.id,
    name: String(name),
    email: user.email ?? "",
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}

async function hydrateName(user: AppUser | null): Promise<AppUser | null> {
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return user;
  return {
    ...user,
    name: data.name || user.name,
    ...(data.avatar_url ? { avatarUrl: data.avatar_url } : {}),
  };
}

export const supabaseAuthService: AuthService = {
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return hydrateName(toAppUser(data.user));
  },

  async signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      logEvent("auth.signIn.failed", { message: error.message });
      throw new Error(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message,
      );
    }
    const user = toAppUser(data.user);
    if (!user) throw new Error("Sign in failed. Please try again.");
    return user;
  },

  async signUp(name, email, password) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { name: name.trim() },
      },
    });
    if (error) {
      logEvent("auth.signUp.failed", { message: error.message });
      throw new Error(error.message);
    }
    const user = toAppUser(data.user);
    if (!user) throw new Error("Sign up failed. Please try again.");
    if (!data.session) {
      const pending = new Error(
        "Account created. Check your email to confirm it, then sign in.",
      ) as Error & { code?: string };
      pending.code = "email_confirmation_required";
      throw pending;
    }
    return user;
  },

  async signInWithGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    if ("error" in result && result.error) {
      logEvent("auth.google.failed", { message: String(result.error) });
      throw result.error instanceof Error ? result.error : new Error(String(result.error));
    }
    if ("redirected" in result && result.redirected) return null;
    const { data } = await supabase.auth.getUser();
    return toAppUser(data.user);
  },

  async signInAsGuest() {
    // Guests browse without an account; nothing is stored until they sign in.
    return null;
  },

  async sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });
    if (error) throw new Error(error.message);
  },

  async updateProfile(patch) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("You are not signed in.");
    const { error } = await supabase.auth.updateUser({ data: patch });
    if (error) throw new Error(error.message);
    await supabase
      .from("profiles")
      .update({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.avatarUrl !== undefined ? { avatar_url: patch.avatarUrl } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.user.id);
    const next = await hydrateName(toAppUser(auth.user));
    if (!next) throw new Error("You are not signed in.");
    return { ...next, ...patch };
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  onAuthStateChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      const base = toAppUser(session?.user);
      cb(base);
      if (base) void hydrateName(base).then((full) => full && cb(full));
    });
    return () => data.subscription.unsubscribe();
  },
};
