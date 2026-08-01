import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabaseAuthService } from "./supabase-auth";
import { supabaseDataService } from "./supabase-data";
import type { AppUser, AuthService, DataService, UserPreferences } from "./types";

export type Services = { auth: AuthService; data: DataService };

const defaultServices: Services = { auth: supabaseAuthService, data: supabaseDataService };


const ServicesContext = createContext<Services>(defaultServices);

export function ServicesProvider({
  children,
  services = defaultServices,
}: {
  children: ReactNode;
  services?: Services;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices() {
  return useContext(ServicesContext);
}

export function useAuth() {
  const { auth } = useServices();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = auth.onAuthStateChange((u) => setUser(u));
    auth.getUser().then((u) => {
      if (!active) return;
      setUser(u);
      setLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth]);

  return useMemo(() => ({ user, loading, auth }), [user, loading, auth]);
}

export function useData() {
  return useServices().data;
}

/** Preferences shared across screens (accessibility, translation language, alerts). */
export function usePreferences() {
  const data = useData();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["preferences"],
    queryFn: () => data.getPreferences(),
    staleTime: Infinity,
  });

  const update = async (patch: Partial<UserPreferences>) => {
    const current = query.data ?? (await data.getPreferences());
    const next = { ...current, ...patch };
    await data.setPreferences(next);
    queryClient.setQueryData(["preferences"], next);
    return next;
  };

  return { preferences: query.data, update, loading: query.isPending };
}

export type { AppUser, AuthService, DataService, UserPreferences };
