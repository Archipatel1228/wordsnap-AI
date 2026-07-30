import type { AppUser, AuthService } from "./types";

const KEY = "wordsnap.user";
const listeners = new Set<(u: AppUser | null) => void>();

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

function fake(name: string, email: string): AppUser {
  return { id: `local-${email}`, name, email };
}

/** Mock auth. Replace with a Supabase-backed implementation of AuthService. */
export const mockAuthService: AuthService = {
  async getUser() {
    return read();
  },
  async signInWithPassword(email) {
    const user = fake(email.split("@")[0] ?? "Learner", email);
    write(user);
    return user;
  },
  async signUp(name, email) {
    const user = fake(name || "Learner", email);
    write(user);
    return user;
  },
  async signInWithGoogle() {
    const user = fake("Alex Morgan", "alex@wordsnap.ai");
    write(user);
    return user;
  },
  async signInAsGuest() {
    const user = fake("Guest", "guest@wordsnap.ai");
    write(user);
    return user;
  },
  async signOut() {
    write(null);
  },
  onAuthStateChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb) as unknown as void;
  },
};
