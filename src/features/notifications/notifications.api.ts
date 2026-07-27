import { API_BASE_URL, apiFetch } from "../../lib/api";
import type { NotificationPreference, PortalNotification } from "./notifications.types";

type Envelope<T> = { data: T };
const data = <T,>(value: Envelope<T>) => value.data;

export type NotificationFilters = {
  page?: number;
  limit?: number;
  read?: "all" | "read" | "unread";
  category?: string;
  priority?: string;
  search?: string;
  caseId?: string;
};

export type NotificationListResponse = {
  items: PortalNotification[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function listNotifications(filters: NotificationFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") params.set(key, String(value));
  });
  return data(await apiFetch<Envelope<NotificationListResponse>>(`/api/notifications?${params.toString()}`));
}

export async function getUnreadCount() {
  return data(await apiFetch<Envelope<{ count: number; criticalCount: number }>>("/api/notifications/unread-count"));
}

export async function markRead(notificationId: string) {
  return data(await apiFetch<Envelope<{ notification: PortalNotification }>>(`/api/notifications/${notificationId}/read`, { method: "PATCH" }));
}

export async function markUnread(notificationId: string) {
  return data(await apiFetch<Envelope<{ notification: PortalNotification }>>(`/api/notifications/${notificationId}/unread`, { method: "PATCH" }));
}

export async function archiveNotification(notificationId: string) {
  return data(await apiFetch<Envelope<{ notification: PortalNotification }>>(`/api/notifications/${notificationId}/archive`, { method: "PATCH" }));
}

export async function markAllRead() {
  return data(await apiFetch<Envelope<Record<string, never>>>("/api/notifications/read-all", { method: "PATCH" }));
}

export async function getPreferences() {
  return data(await apiFetch<Envelope<{ preferences: NotificationPreference[]; mandatoryEventTypes: string[] }>>("/api/notifications/preferences"));
}

export async function updatePreferences(preferences: NotificationPreference[]) {
  return data(await apiFetch<Envelope<{ preferences: NotificationPreference[]; mandatoryEventTypes: string[] }>>("/api/notifications/preferences", {
    method: "PUT",
    body: { preferences },
  }));
}

export async function resetPreferences() {
  return data(await apiFetch<Envelope<{ preferences: NotificationPreference[]; mandatoryEventTypes: string[] }>>("/api/notifications/preferences/reset", { method: "POST" }));
}

export function notificationEventUrl() {
  return `${API_BASE_URL}/api/notifications/events`;
}
