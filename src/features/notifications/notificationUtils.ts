export type NotificationKind = "reminder" | "progress" | "system";

export type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  kind: NotificationKind;
  reminderAt?: string;
  fired?: boolean;
};

export const NOTIFICATIONS_STORAGE_KEY =
  "personal-productivity-notifications-v1";