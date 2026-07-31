import { useCallback, useEffect, useState } from "react";

export type PushPermission = "unsupported" | "default" | "granted" | "denied";

/** Notification permission plus a local test alert to verify delivery. */
export function useNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);
  }, []);

  const request = useCallback(async (): Promise<PushPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    const result = (await Notification.requestPermission()) as PushPermission;
    setPermission(result);
    return result;
  }, []);

  const sendTest = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
    const granted =
      Notification.permission === "granted"
        ? "granted"
        : ((await Notification.requestPermission()) as PushPermission);
    setPermission(granted as PushPermission);
    if (granted !== "granted") return "denied" as const;

    const options: NotificationOptions = {
      body: "Your Daily Word alert is working. Tap to learn today's word.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "wordsnap-daily-test",
    };

    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration) await registration.showNotification("WordSnap AI", options);
      else new Notification("WordSnap AI", options);
    } catch {
      new Notification("WordSnap AI", options);
    }
    return "sent" as const;
  }, []);

  return { permission, request, sendTest, supported: permission !== "unsupported" };
}
