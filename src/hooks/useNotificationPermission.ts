import { useCallback, useEffect, useState } from "react";

export type PushPermission = "unsupported" | "default" | "granted" | "denied";

export function useNotificationPermission() {
  const [permission, setPermission] = useState<PushPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);
  }, []);

  const request = useCallback(async (): Promise<PushPermission> => {
    if (!("Notification" in window)) return "unsupported";
    const result = (await Notification.requestPermission()) as PushPermission;
    setPermission(result);
    return result;
  }, []);

  return { permission, request, supported: permission !== "unsupported" };
}
