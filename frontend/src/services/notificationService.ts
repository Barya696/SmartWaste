import type { UserRole } from "../app/context/AuthContext";

const API_BASE = "http://localhost:8080/api/notifications";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "info" | "success" | "warning" | "action";
  category?: string;
  createdAt: string;
  read?: boolean;
}

const ROLE_CATEGORY_ORDER: Record<UserRole, string[]> = {
  citizen: ["Assigned", "Recycled", "Compensated"],
  collector: ["Assigned task", "Compensated"],
  supervisor: ["Submitted waste report", "Resubmission", "Collected waste waiting for recycling"],
  administrator: ["Security alert"],
};

export function getCategoryOrder(role: UserRole, department?: string): string[] {
  if (role === "supervisor" && department === "RECYCLING_OPERATIONS") {
    return ["Collected waste waiting for recycling"];
  }
  if (role === "supervisor") {
    return ["Submitted waste report", "Resubmission"];
  }
  return ROLE_CATEGORY_ORDER[role] ?? [];
}

export function groupNotificationsByCategory(
  notifications: AppNotification[],
  role: UserRole,
  department?: string,
): Array<{ category: string; items: AppNotification[] }> {
  const order = getCategoryOrder(role, department);
  const grouped = new Map<string, AppNotification[]>();

  for (const notification of notifications) {
    const category = notification.category ?? "General";
    const bucket = grouped.get(category) ?? [];
    bucket.push(notification);
    grouped.set(category, bucket);
  }

  const sections: Array<{ category: string; items: AppNotification[] }> = [];
  for (const category of order) {
    const items = grouped.get(category);
    if (items?.length) {
      sections.push({ category, items });
      grouped.delete(category);
    }
  }

  for (const [category, items] of grouped.entries()) {
    if (items.length > 0) {
      sections.push({ category, items });
    }
  }

  return sections;
}

function notifyUnreadChanged() {
  window.dispatchEvent(new Event("notifications-updated"));
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}/read`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error("Failed to mark notification as read");
  }
  notifyUnreadChanged();
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${API_BASE}/read-all`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
  notifyUnreadChanged();
}

export function getUnreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export function isNotificationRead(notification: AppNotification): boolean {
  return notification.read === true;
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/unread-count`, {
      credentials: "include",
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data.count === "number" ? data.count : 0;
  } catch {
    return 0;
  }
}

export async function fetchNotifications(
  _role: UserRole,
  _userId: string | number,
): Promise<AppNotification[]> {
  try {
    const res = await fetch(API_BASE, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      console.error("[notificationService] fetch failed:", res.status);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data as AppNotification[];
  } catch (err) {
    console.error("[notificationService] fetch failed:", err);
    return [];
  }
}

export function getRoleHomePath(
  role: UserRole,
  department?: string,
): string {
  switch (role) {
    case "citizen":
      return "/dashboard/citizen";
    case "collector":
      return "/dashboard/collector";
    case "supervisor":
      return department === "RECYCLING_OPERATIONS"
        ? "/dashboard/supervisor/recycling"
        : "/dashboard/supervisor/waste";
    case "administrator":
      return "/dashboard/admin";
    default:
      return "/dashboard/citizen";
  }
}
