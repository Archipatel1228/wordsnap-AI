import type { AppUser, AuthService } from "./types";

/**
 * Device-local auth. Mirrors the Supabase Auth surface so swapping to
 * `supabase.auth.*` later requires no screen changes.
 */

const KEY = "wordsnap.user";
const listeners = new Set<(user: AppUser | null) => void>();

function read(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

function write(user: AppUser | null) {
  if (typeof window !== "undefined") {
    if (user) window.localStorage.setItem(KEY, JSON.stringify(user));
    else window.localStorage.removeItem(KEY);
  }
  listeners.forEach((cb) => cb(user));
}

function makeUser(name: string, email: string): AppUser {
  return { id: `local-${email.toLowerCase()}`, name: name || email.split("@")[0], email };
}

export const localAuthService: AuthService = {
  async getUser() {
    return read();
  },
  async signInWithPassword(email, password) {
    if (!email.includes("@")) throw new Error("Enter a valid email address.");
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    const user = makeUser(email.split("@")[0], email);
    write(user);
    return user;
  },
  async signUp(name, email, password) {
    if (!email.includes("@")) throw new Error("Enter a valid email address.");
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    const user = makeUser(name, email);
    write(user);
    return user;
  },
  async signInWithGoogle() {
    throw new Error("Google sign-in activates once the backend is connected.");
  },
  async signInAsGuest() {
    const user = makeUser("Guest", "guest@wordsnap.local");
    write(user);
    return user;
  },
  async sendPasswordReset(email) {
    if (!email.includes("@")) throw new Error("Enter a valid email address.");
  },
  async updateProfile(patch) {
    const current = read();
    if (!current) throw new Error("You are not signed in.");
    const next = { ...current, ...patch };
    write(next);
    return next;
  },
  async signOut() {
    write(null);
  },
  onAuthStateChange(cb) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
