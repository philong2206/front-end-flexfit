import { apiFetch } from "@/lib/apiFetch";

export const NOTIFICATIONS_API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/notifications`;

const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  content?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface AdminCreateNotificationRequest {
  userId?: string | null;
  title: string;
  content: string;
  type: string;
}

type RawNotification = Partial<AppNotification> & {
  notificationId?: string;
  NotificationId?: string;
  UserId?: string;
  Title?: string;
  Content?: string;
  Message?: string;
  Type?: string;
  IsRead?: boolean;
  CreatedAt?: string;
  ReadAt?: string;
};

export class NotificationApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "NotificationApiError";
    this.status = status;
  }
}

const getErrorMessage = async (response: Response, fallback: string) => {
  const errorData = await response.json().catch(() => ({}));
  return errorData.message || errorData.Message || errorData.title || fallback;
};

const normalizeNotification = (notification: RawNotification): AppNotification => {
  const id = notification.id || notification.notificationId || notification.NotificationId || "";
  const content = notification.content || notification.Content || notification.message || notification.Message || "";

  return {
    id,
    userId: notification.userId || notification.UserId || "",
    title: notification.title || notification.Title || "",
    message: content,
    content,
    type: notification.type || notification.Type || "",
    isRead: Boolean(notification.isRead ?? notification.IsRead),
    createdAt: notification.createdAt || notification.CreatedAt || "",
    readAt: notification.readAt || notification.ReadAt,
  };
};

export const getMyNotificationsApi = async (): Promise<AppNotification[]> => {
  const response = await apiFetch(`${NOTIFICATIONS_API_URL}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new NotificationApiError(
      await getErrorMessage(response, "Failed to fetch notifications"),
      response.status
    );
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizeNotification) : [];
};

export const markAsReadApi = async (id: string): Promise<{ message: string }> => {
  const response = await apiFetch(`${NOTIFICATIONS_API_URL}/${id}/read`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new NotificationApiError(
      await getErrorMessage(response, "Failed to mark notification as read"),
      response.status
    );
  }
  return response.json();
};

export const markAllAsReadApi = async (): Promise<{ message: string }> => {
  const response = await apiFetch(`${NOTIFICATIONS_API_URL}/read-all`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new NotificationApiError(
      await getErrorMessage(response, "Failed to mark all notifications as read"),
      response.status
    );
  }
  return response.json();
};

export const createAdminNotificationApi = async (
  data: AdminCreateNotificationRequest
): Promise<{ message: string }> => {
  const response = await apiFetch(`${NOTIFICATIONS_API_URL}/admin/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new NotificationApiError(
      await getErrorMessage(response, "Failed to create admin notification"),
      response.status
    );
  }
  return response.json();
};
