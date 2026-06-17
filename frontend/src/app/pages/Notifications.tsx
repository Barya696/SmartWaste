import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  AlertCircle,
  CheckCircle2,
  Info,
  Zap,
  Package,
} from "lucide-react";
import {
  fetchNotifications,
  getRoleHomePath,
  getUnreadCount,
  groupNotificationsByCategory,
  isNotificationRead,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../../services/notificationService";

const typeIcon = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  action: Zap,
};

const typeColor: Record<string, { bg: string; color: string; border: string }> = {
  info:    { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  success: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  warning: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  action:  { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
};

export function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchNotifications(user.role, user.id)
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (user) {
      navigate(getRoleHomePath(user.role, user.department));
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const unread = getUnreadCount(notifications);
  const grouped = user
    ? groupNotificationsByCategory(notifications, user.role, user.department)
    : [];

  const emptyHint =
    user?.role === "administrator"
      ? "Security alerts for failed logins, signups, and server errors will appear here."
      : user?.role === "collector"
        ? "Assigned tasks and compensation updates will appear here."
        : user?.role === "supervisor" && user.department === "RECYCLING_OPERATIONS"
          ? "Collected waste waiting for recycling will appear here."
          : user?.role === "supervisor"
            ? "New waste reports and resubmissions will appear here."
            : "Assigned, recycled, and compensation updates will appear here.";

  return (
    <div
      style={{
        fontFamily: "'Nunito Sans', 'DM Sans', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        /* Back button */
        .nf-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff; border: 1px solid #dde1e7; border-radius: 6px;
          padding: 7px 14px; font-size: 12.5px; font-weight: 700;
          color: #4a5568; cursor: pointer; font-family: inherit;
          transition: background 0.12s, border-color 0.12s;
          margin-bottom: 14px;
        }
        .nf-back-btn:hover { background: #f0f2f5; border-color: #c8cdd5; }

        /* Card */
        .nf-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }

        /* Card header — matches ap-card-header / rm-card-header */
        .nf-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex; align-items: center; gap: 8px;
        }
        .nf-card-title {
          font-size: 11px; font-weight: 800; color: #4a5568;
          text-transform: uppercase; letter-spacing: 0.07em;
          flex: 1;
        }

        /* Unread badge */
        .nf-unread-badge {
          font-size: 10.5px; font-weight: 800;
          background: #1cb97a18; color: #1cb97a;
          padding: 3px 9px; border-radius: 4px;
          letter-spacing: 0.03em;
        }

        /* Mark-all button */
        .nf-mark-all {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; font-weight: 700; color: #1cb97a;
          background: none; border: 1px solid #dde1e7; border-radius: 6px;
          padding: 5px 12px; cursor: pointer; font-family: inherit;
          transition: background 0.12s, border-color 0.12s;
        }
        .nf-mark-all:hover { background: #f0fdf4; border-color: #6ee7b7; }

        /* Notification row */
        .nf-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #eef0f3;
          cursor: pointer; transition: background 0.1s;
        }
        .nf-item:last-child { border-bottom: none; }
        .nf-item:hover { background: #f7f9fc; }
        .nf-item.is-unread { background: #f7f9fc; }

        /* Type icon */
        .nf-icon-wrap {
          width: 34px; height: 34px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border: 1px solid;
        }

        /* Meta row inside item */
        .nf-meta {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 8px;
        }
        .nf-title {
          font-size: 12.5px; color: #1a1e25;
        }
        .nf-time {
          font-size: 10.5px; color: #aab0bb; font-weight: 600; flex-shrink: 0;
        }
        .nf-message {
          margin: 3px 0 0; font-size: 12px; color: #6b7a8f;
          line-height: 1.45; font-weight: 500;
        }

        /* Unread dot */
        .nf-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #1cb97a; flex-shrink: 0; margin-top: 5px;
        }

        .nf-section-title {
          padding: 8px 16px 6px;
          font-size: 10px;
          font-weight: 800;
          color: #9aa0ac;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          background: #fafbfc;
          border-bottom: 1px solid #eef0f3;
        }

        /* Empty / loading state */
        .nf-empty {
          text-align: center; padding: 52px 20px; color: #aab0bb;
        }
        .nf-empty-title {
          margin: 8px 0 4px; font-size: 13px; font-weight: 800; color: #6b7a8f;
        }
        .nf-empty-sub {
          margin: 0; font-size: 12px; font-weight: 500; color: #aab0bb;
        }
      `}</style>

      {/* Back */}
      <button type="button" className="nf-back-btn" onClick={handleBack}>
        <ArrowLeft size={14} />
        Return
      </button>

      <div className="nf-card">
        {/* Header */}
        <div className="nf-card-header">
          <Bell size={12} color="#6b7a8f" strokeWidth={2.5} />
          <span className="nf-card-title">Notifications</span>

          {unread > 0 && (
            <span className="nf-unread-badge">{unread} unread</span>
          )}

          {unread > 0 && (
            <button
              type="button"
              className="nf-mark-all"
              onClick={handleMarkAllRead}
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="nf-empty">
            <p style={{ margin: 0, fontSize: 13, color: "#aab0bb" }}>
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="nf-empty">
            <Package
              size={38}
              color="#aab0bb"
              style={{ opacity: 0.35, margin: "0 auto", display: "block" }}
            />
            <p className="nf-empty-title">No notifications yet</p>
            <p className="nf-empty-sub">{emptyHint}</p>
          </div>
        ) : (
          grouped.map((section) => (
            <div key={section.category}>
              <div className="nf-section-title">{section.category}</div>
              {section.items.map((n) => {
            const Icon = typeIcon[n.type];
            const colors = typeColor[n.type];
            const unreadItem = !isNotificationRead(n);

            return (
              <div
                key={n.id}
                className={`nf-item${unreadItem ? " is-unread" : ""}`}
                onClick={() => handleMarkRead(n.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleMarkRead(n.id);
                }}
              >
                {/* Icon */}
                <div
                  className="nf-icon-wrap"
                  style={{
                    background: colors.bg,
                    color: colors.color,
                    borderColor: colors.border,
                  }}
                >
                  <Icon size={16} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="nf-meta">
                    <span
                      className="nf-title"
                      style={{ fontWeight: unreadItem ? 800 : 600 }}
                    >
                      {n.title}
                    </span>
                    <span className="nf-time">{n.time}</span>
                  </div>
                  <p className="nf-message">{n.message}</p>
                </div>

                {/* Unread indicator */}
                {unreadItem && (
                  <span className="nf-dot" aria-label="Unread" />
                )}
              </div>
            );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}