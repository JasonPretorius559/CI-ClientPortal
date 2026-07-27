import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationEventUrl } from "./notifications.api";
import type { NotificationListResponse } from "./notifications.api";
import type { PortalNotification } from "./notifications.types";

export function NotificationStreamBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let source: EventSource | null = null;
    let pollTimer: number | undefined;

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    };
    const startPolling = () => {
      if (!pollTimer) pollTimer = window.setInterval(refresh, 30_000);
    };

    try {
      source = new EventSource(notificationEventUrl(), { withCredentials: true });
      source.addEventListener("notification.created", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { notification?: PortalNotification };
          if (payload.notification) {
            queryClient.setQueryData<NotificationListResponse>(["notifications", "recent"], (current) => {
              const items = Array.isArray(current?.items) ? current.items : [];
              return current
                ? { ...current, items: [payload.notification!, ...items.filter((item: PortalNotification) => item._id !== payload.notification?._id)].slice(0, 8) }
                : current;
            });
          }
        } catch {
          // A normal refresh below repairs malformed or missed event payloads.
        }
        refresh();
      });
      ["notification.updated", "notification.read", "notification.unread-count"].forEach((name) => {
        source?.addEventListener(name, refresh);
      });
      source.onerror = startPolling;
      source.onopen = () => {
        if (pollTimer) window.clearInterval(pollTimer);
        pollTimer = undefined;
      };
    } catch {
      startPolling();
    }

    return () => {
      source?.close();
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, [queryClient]);

  return null;
}
