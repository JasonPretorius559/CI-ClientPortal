import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { archiveNotification, getUnreadCount, listNotifications, markAllRead, markRead, markUnread } from "./notifications.api";
import { NotificationItem } from "./NotificationItem";
import type { PortalNotification } from "./notifications.types";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const unread = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
  });
  const recent = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => listNotifications({ limit: 8 }),
    enabled: open,
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const readMutation = useMutation({ mutationFn: (item: PortalNotification) => markRead(item._id), onSuccess: refresh });
  const unreadMutation = useMutation({ mutationFn: (item: PortalNotification) => markUnread(item._id), onSuccess: refresh });
  const archiveMutation = useMutation({ mutationFn: (item: PortalNotification) => archiveNotification(item._id), onSuccess: refresh });
  const allReadMutation = useMutation({ mutationFn: markAllRead, onSuccess: refresh });

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const count = unread.data?.count || 0;
  const displayCount = count > 99 ? "99+" : String(count);

  return (
    <div className="relative" ref={panelRef}>
      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-ink-600 transition hover:border-surface-line hover:bg-white hover:text-ink-950"
        aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {count ? (
          <span className={`absolute -right-1 -top-1 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold text-white ${unread.data?.criticalCount ? "bg-danger-500" : "bg-ink-950"}`}>
            {displayCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section className="fixed inset-x-3 top-3 z-50 flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[1.5rem] border border-surface-line bg-surface-canvas shadow-float sm:absolute sm:inset-auto sm:right-0 sm:top-14 sm:h-auto sm:max-h-[min(720px,calc(100vh-6rem))] sm:w-[420px]">
          <header className="flex items-start justify-between gap-4 border-b border-surface-line bg-white px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Activity inbox</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink-950">Notifications</h2>
            </div>
            <div className="flex items-center gap-1">
              {count ? (
                <Button variant="ghost" className="min-h-9 px-2 text-xs" onClick={() => allReadMutation.mutate()}>
                  <CheckCheck className="h-4 w-4" /> Mark all read
                </Button>
              ) : null}
              <button className="rounded-lg p-2 text-ink-500 hover:bg-surface-muted sm:hidden" aria-label="Close notifications" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="notification-activity-spine flex-1 space-y-2 overflow-y-auto p-3 sm:max-h-[520px]">
            {recent.isLoading ? (
              <div className="space-y-2">{[0, 1, 2].map((key) => <div key={key} className="h-28 animate-pulse rounded-2xl bg-white" />)}</div>
            ) : recent.data?.items.length ? (
              recent.data.items.map((item) => (
                <NotificationItem
                  key={item._id}
                  notification={item}
                  compact
                  onRead={(value) => readMutation.mutate(value)}
                  onUnread={(value) => unreadMutation.mutate(value)}
                  onArchive={(value) => archiveMutation.mutate(value)}
                />
              ))
            ) : (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-ink-400"><Bell className="h-5 w-5" /></div>
                <p className="mt-4 text-sm font-semibold text-ink-900">You’re all caught up</p>
                <p className="mt-1 text-sm text-ink-500">New case activity will appear here.</p>
              </div>
            )}
          </div>

          <footer className="border-t border-surface-line bg-white p-3">
            <Link to="/notifications" onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold text-ink-900 hover:bg-surface-muted">
              View all notifications
            </Link>
          </footer>
        </section>
      ) : null}
    </div>
  );
}
