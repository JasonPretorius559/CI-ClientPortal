import { Archive, BellRing, Check, CircleAlert, FileText, MessageSquareText, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/cn";
import type { PortalNotification } from "./notifications.types";

const categoryIcons = {
  analysis: FileText,
  report: FileText,
  comment: MessageSquareText,
  security: ShieldAlert,
  system: CircleAlert,
};

function relativeTime(value: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export function NotificationItem({
  notification,
  onRead,
  onUnread,
  onArchive,
  compact = false,
}: {
  notification: PortalNotification;
  onRead: (notification: PortalNotification) => void;
  onUnread: (notification: PortalNotification) => void;
  onArchive: (notification: PortalNotification) => void;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const Icon = categoryIcons[notification.category as keyof typeof categoryIcons] || BellRing;
  const unread = !notification.readAt;

  const open = () => {
    if (unread) onRead(notification);
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  return (
    <article className={cn("group relative grid grid-cols-[4px_40px_1fr] gap-3 overflow-hidden rounded-2xl border border-surface-line bg-white transition hover:border-ink-300", compact ? "p-3 pl-0" : "p-4 pl-0")}>
      <span className={cn(
        "h-full w-1 rounded-r-full",
        notification.priority === "critical" ? "bg-danger-500" :
          notification.priority === "important" ? "bg-warning-500" :
            unread ? "bg-ink-900" : "bg-surface-line",
      )} />
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", unread ? "bg-ink-950 text-white" : "bg-surface-sunken text-ink-500")}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 pr-1">
        <button className="block w-full text-left" onClick={open}>
          <span className="flex items-start justify-between gap-3">
            <span className={cn("text-sm text-ink-950", unread ? "font-semibold" : "font-medium")}>{notification.title}</span>
            <span className="shrink-0 text-[11px] font-medium text-ink-400">{relativeTime(notification.createdAt)}</span>
          </span>
          <span className={cn("mt-1 block text-sm leading-5 text-ink-600", compact && "line-clamp-2")}>{notification.message}</span>
        </button>
        <div className="mt-3 flex items-center gap-1 text-xs">
          {notification.actionLabel && notification.actionUrl ? (
            <button className="font-semibold text-ink-900 hover:underline" onClick={open}>{notification.actionLabel}</button>
          ) : null}
          <span className="ml-auto flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
            <button className="rounded-lg p-2 text-ink-500 hover:bg-surface-muted hover:text-ink-950" aria-label={unread ? "Mark as read" : "Mark as unread"} onClick={() => unread ? onRead(notification) : onUnread(notification)}>
              <Check className="h-3.5 w-3.5" />
            </button>
            <button className="rounded-lg p-2 text-ink-500 hover:bg-surface-muted hover:text-ink-950" aria-label="Archive notification" onClick={() => onArchive(notification)}>
              <Archive className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}
