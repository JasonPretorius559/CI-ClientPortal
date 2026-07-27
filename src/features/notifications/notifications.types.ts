export type NotificationPriority = "informational" | "normal" | "important" | "critical";

export type PortalNotification = {
  _id: string;
  id?: string;
  eventType: string;
  category: string;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  caseId?: string;
  readAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
};

export type NotificationPreference = {
  eventType: string;
  category: string;
  emailEnabled: boolean;
  deliveryFrequency: "immediate" | "hourly_digest" | "daily_digest" | "weekly_digest" | "in_app_only";
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
};
