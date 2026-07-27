import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Search } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageShell } from "../../components/ui/PageShell";
import { archiveNotification, listNotifications, markAllRead, markRead, markUnread } from "./notifications.api";
import { NotificationItem } from "./NotificationItem";
import type { PortalNotification } from "./notifications.types";

const categories = ["all", "case", "document", "analysis", "comment", "review", "report", "security", "system"];
const priorities = ["all", "informational", "normal", "important", "critical"];

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [read, setRead] = useState<"all" | "read" | "unread">("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", "page", { page, read, category, priority, search }],
    queryFn: () => listNotifications({ page, limit: 20, read, category, priority, search }),
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const readMutation = useMutation({ mutationFn: (item: PortalNotification) => markRead(item._id), onSuccess: refresh });
  const unreadMutation = useMutation({ mutationFn: (item: PortalNotification) => markUnread(item._id), onSuccess: refresh });
  const archiveMutation = useMutation({ mutationFn: (item: PortalNotification) => archiveNotification(item._id), onSuccess: refresh });
  const allReadMutation = useMutation({ mutationFn: markAllRead, onSuccess: refresh });

  return (
    <PageShell className="space-y-6">
      <PageHeader
        title="Notifications"
        description="A complete, auditable view of case activity, decisions, and delivery alerts."
        action={<Button variant="secondary" onClick={() => allReadMutation.mutate()}><CheckCheck className="h-4 w-4" />Mark all read</Button>}
      />

      <section className="surface-card overflow-hidden">
        <div className="grid gap-4 border-b border-surface-line p-4 lg:grid-cols-[minmax(260px,1fr)_auto_auto_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-ink-400" />
            <span className="sr-only">Search notifications</span>
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search title or message" className="min-h-11 w-full rounded-xl border border-surface-line bg-white pl-10 pr-4 text-sm outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-100" />
          </label>
          <select aria-label="Read status" value={read} onChange={(event) => { setRead(event.target.value as "all" | "read" | "unread"); setPage(1); }} className="min-h-11 rounded-xl border border-surface-line bg-white px-3 text-sm font-medium text-ink-700">
            <option value="all">All status</option><option value="unread">Unread</option><option value="read">Read</option>
          </select>
          <select aria-label="Category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="min-h-11 rounded-xl border border-surface-line bg-white px-3 text-sm font-medium capitalize text-ink-700">
            {categories.map((value) => <option key={value} value={value}>{value === "all" ? "All categories" : value.replace("_", " ")}</option>)}
          </select>
          <select aria-label="Priority" value={priority} onChange={(event) => { setPriority(event.target.value); setPage(1); }} className="min-h-11 rounded-xl border border-surface-line bg-white px-3 text-sm font-medium capitalize text-ink-700">
            {priorities.map((value) => <option key={value} value={value}>{value === "all" ? "All priorities" : value}</option>)}
          </select>
        </div>

        <div className="notification-activity-spine space-y-3 bg-surface-canvas p-4 sm:p-5">
          {query.isLoading ? [0, 1, 2, 3].map((key) => <div key={key} className="h-32 animate-pulse rounded-2xl bg-white" />)
            : query.data?.items.length ? query.data.items.map((item) => (
              <NotificationItem key={item._id} notification={item} onRead={(value) => readMutation.mutate(value)} onUnread={(value) => unreadMutation.mutate(value)} onArchive={(value) => archiveMutation.mutate(value)} />
            )) : (
              <EmptyState title="No notifications found" description="Try changing the filters, or check back when new case activity occurs." />
            )}
        </div>

        {query.data && query.data.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-surface-line px-5 py-4 text-sm">
            <span className="text-ink-500">Page {query.data.page} of {query.data.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button variant="secondary" disabled={page >= query.data.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
