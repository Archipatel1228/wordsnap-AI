import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mockAuthService } from "./mock-auth";
import { mockDataService } from "./mock-data-service";
import type { AppUser, AuthService, DataService } from "./types";

export type Services = { auth: AuthService; data: DataService };

const defaultServices: Services = { auth: mockAuthService, data: mockDataService };

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

export type { AppUser, AuthService, DataService };
