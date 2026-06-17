import { useState, useMemo, useEffect } from "react";
import {
  Outlet,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router";
import { useAuth } from "../context/AuthContext";
import { usePendingApproval } from "../hooks/usePendingApproval";
import { CitizenApprovalToast } from "../components/CitizenApprovalToast";
import {
  fetchUnreadCount,
  getRoleHomePath,
} from "../../services/notificationService";
import {
  Recycle,
  Bell,
  Settings,
  User,
  LogOut,
  Home,
  FileText,
  Package,
  Truck,
  MapPin as MapPinIcon,
  BarChart3,
  Users,
  ChevronDown,
  Leaf,
  ClipboardList,
  UserCheck,
  Settings as SettingsIcon,
} from "lucide-react";

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: typeof Home;
  badge?: number;
}

const navigationConfig = {
  citizen: [
    { id: "dashboard", path: "/dashboard/citizen", label: "Dashboard", icon: Home },
    { id: "report", path: "/dashboard/citizen/report", label: "Report Waste", icon: FileText },
    { id: "my-reports", path: "/dashboard/citizen/my-reports", label: "My Reports", icon: Package },
  ] as NavItem[],
  collector: [
    { id: "dashboard", path: "/dashboard/collector", label: "Dashboard", icon: Home },
    { id: "tasks", path: "/dashboard/collector/tasks", label: "Collection Tasks", icon: Truck, badge: 3 },
    { id: "credits", path: "/dashboard/collector/credits", label: "Recycling Credits", icon: Recycle },
  ] as NavItem[],
  "supervisor-waste": [
    { id: "dashboard", path: "/dashboard/supervisor/waste", label: "Dashboard", icon: Home },
    { id: "task-assignment", path: "/dashboard/supervisor/waste/task-assignment", label: "Task Assignment", icon: ClipboardList, badge: 5 },
    { id: "collectors", path: "/dashboard/supervisor/waste/collectors", label: "Collectors", icon: UserCheck },
  ] as NavItem[],
  "supervisor-recycling": [
    { id: "dashboard", path: "/dashboard/supervisor/recycling", label: "Dashboard", icon: Home },
    { id: "management", path: "/dashboard/supervisor/recycling/management", label: "Management", icon: Recycle },
  ] as NavItem[],
  administrator: [
    { id: "dashboard", path: "/dashboard/admin", label: "Dashboard", icon: Home },
    { id: "users", path: "/dashboard/admin/users", label: "User Management", icon: Users },
    { id: "reports", path: "/dashboard/admin/reports", label: "Reports", icon: FileText },
    { id: "districts", path: "/dashboard/admin/districts", label: "Districts & Zones", icon: MapPinIcon },
    { id: "analytics", path: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", path: "/dashboard/admin/settings", label: "System Settings", icon: SettingsIcon },
  ] as NavItem[],
};

const roleConfig = {
  citizen: { name: "Citizen", badgeStyle: "badge-user" },
  collector: { name: "Collector", badgeStyle: "badge-analyst" },
  supervisor: { name: "Supervisor", badgeStyle: "badge-cs" },
  administrator: { name: "Administrator", badgeStyle: "badge-admin" },
};

export function MainLayout() {
  // ── All hooks first — no early returns before this block ──
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const isNotificationsPage = location.pathname === "/dashboard/notifications";

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const refresh = () => {
      fetchUnreadCount()
        .then((count) => {
          if (!cancelled) setUnreadNotifications(count);
        })
        .catch(() => {
          if (!cancelled) setUnreadNotifications(0);
        });
    };

    refresh();
    window.addEventListener("notifications-updated", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("notifications-updated", refresh);
    };
  }, [user?.id, user?.role, location.pathname]);

  const openNotifications = () => navigate("/dashboard/notifications");

  // Derive citizen ID stably — null for non-citizens so polling is disabled
  const citizenId = useMemo(
    () => (user?.role === "citizen" ? user.id : null),
    [user?.role, user?.id]
  );

  const { pendingApprovals, approveCollection, dismissApproval } =
    usePendingApproval(citizenId);

  // ── Early return (after ALL hooks) ──
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const currentRoleConfig = roleConfig[user.role];

  let navKey = user.role as string;
  if (user.role === "supervisor") {
    navKey =
      user.department === "RECYCLING_OPERATIONS"
        ? "supervisor-recycling"
        : "supervisor-waste";
  }
  const navItems =
    navigationConfig[navKey as keyof typeof navigationConfig] || [];
  const activeRoute =
    navItems.find((item) => location.pathname === item.path)?.id || "";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        :root {
          --green:          #1cb97a;
          --green-hover:    #17a06a;
          --green-light:    #e6f7f1;
          --green-deep:     #0f6e56;
          --slate-900:      #1a1e25;
          --slate-800:      #2c3340;
          --slate-700:      #3a4150;
          --slate-600:      #4a5568;
          --slate-400:      #8a9099;
          --slate-200:      #c8cdd5;
          --slate-100:      #e4e7eb;
          --slate-50:       #f5f6f8;
          --white:          #ffffff;
          --surface:        #f5f6f8;
          --border:         #e4e7eb;
          --border-soft:    #eef0f2;
          --blue:           #1a5fa8;
          --blue-hover:     #14508f;
          --blue-light:     #e8f2fb;
          --violet:         #5b21b6;
          --violet-light:   #ede9fe;
          --amber:          #92400e;
          --amber-light:    #fef3c7;
          --red:            #b91c1c;
          --font:           'DM Sans', -apple-system, system-ui, sans-serif;
          --shadow-menu:    0 8px 28px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06);
        }

        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: var(--font); }

        .ml-appbar {
          background: var(--slate-800);
          border-bottom: 1px solid var(--slate-700);
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .ml-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 64px;
          padding: 0 24px;
        }

        .ml-logo-mark {
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          position: relative; flex-shrink: 0;
        }

        .ml-logo-dot {
          position: absolute; bottom: -3px; right: -3px;
          width: 13px; height: 13px;
          background: var(--green);
          border-radius: 50%;
          border: 2px solid var(--slate-800);
          display: flex; align-items: center; justify-content: center;
        }

        .ml-wordmark {
          font-family: var(--font); font-weight: 700; font-size: 17px;
          color: #ffffff; letter-spacing: -0.02em; line-height: 1;
        }
        .ml-wordmark em { color: var(--green); font-style: normal; }

        .ml-wordmark-sub {
          font-size: 10px; color: rgba(255,255,255,0.35);
          letter-spacing: 0.08em; text-transform: uppercase;
          font-weight: 600; margin-top: 3px; font-family: var(--font);
        }

        .ml-vdiv { width: 1px; height: 22px; background: rgba(255,255,255,0.12); flex-shrink: 0; }

        .role-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 4px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
          font-family: var(--font);
        }
        .role-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .badge-admin { background: rgba(26,95,168,0.25); color: #93c5fd; border: 1px solid rgba(147,197,253,0.2); }
        .badge-admin .role-dot { background: #60a5fa; }
        .badge-user { background: rgba(28,185,122,0.2); color: #6ee7b7; border: 1px solid rgba(110,231,183,0.2); }
        .badge-user .role-dot { background: var(--green); }
        .badge-analyst { background: rgba(91,33,182,0.25); color: #c4b5fd; border: 1px solid rgba(196,181,253,0.2); }
        .badge-analyst .role-dot { background: #a78bfa; }
        .badge-cs { background: rgba(146,64,14,0.25); color: #fcd34d; border: 1px solid rgba(252,211,77,0.2); }
        .badge-cs .role-dot { background: #fbbf24; }

        .ml-icon-btn {
          color: rgba(255,255,255,0.45); border-radius: 6px;
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: none; background: transparent;
          transition: all 0.15s ease; position: relative;
        }
        .ml-icon-btn:hover { color: #ffffff; background: rgba(255,255,255,0.08); }
        .ml-icon-btn .notif-dot {
          position: absolute; top: 5px; right: 5px;
          width: 7px; height: 7px; background: #f87171;
          border-radius: 50%; border: 1.5px solid var(--slate-800);
        }

        .ml-user-btn {
          background: transparent; border: 1px solid transparent; border-radius: 6px;
          padding: 5px 8px 5px 6px;
          display: flex; align-items: center; gap: 6px;
          cursor: pointer; transition: all 0.15s ease; font-family: var(--font);
        }
        .ml-user-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }

        .ml-avatar {
          width: 29px; height: 29px; border-radius: 50%;
          background: rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 12px; flex-shrink: 0;
        }

        .ml-dropdown {
          position: fixed; top: 67px; right: 16px;
          background: var(--white); border: 1px solid var(--border);
          border-radius: 12px; min-width: 240px;
          box-shadow: var(--shadow-menu); overflow: hidden; z-index: 200;
        }

        .ml-menu-header { padding: 18px; border-bottom: 1px solid var(--border-soft); background: var(--slate-50); }

        .ml-menu-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 18px; cursor: pointer; font-size: 14px;
          color: var(--slate-600); font-family: var(--font);
          transition: background 0.1s; border: none; width: 100%;
          background: transparent; text-align: left;
        }
        .ml-menu-item:hover { background: var(--slate-50); color: var(--slate-900); }
        .ml-menu-item.is-active-nav { background: var(--green-light); color: var(--green-deep); font-weight: 600; }

        .ml-menu-nav-label {
          font-size: 9.5px; font-weight: 700; color: var(--slate-400);
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 10px 18px 4px; font-family: var(--font);
        }

        .ml-menu-nav-badge {
          font-size: 10px; font-weight: 700; padding: 2px 7px;
          border-radius: 10px; line-height: 1.4;
          background: rgba(185,28,28,0.1); color: #b91c1c; margin-left: auto;
        }

        .ml-sidebar {
          width: 220px; background: var(--slate-800);
          display: flex; flex-direction: column; flex-shrink: 0;
          align-self: stretch; border-right: 1px solid rgba(0,0,0,0.18);
        }

        .sb-section-label {
          font-size: 9.5px; font-weight: 700; color: rgba(255,255,255,0.18);
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 14px 18px 6px; font-family: var(--font);
        }

        .sb-nav { padding: 6px 8px; flex: 1; }

        .sb-btn {
          width: 100%; display: flex; align-items: center; gap: 9px;
          padding: 9px 11px; margin-bottom: 2px; border: none; border-radius: 6px;
          font-size: 13px; cursor: pointer; transition: background 0.12s, color 0.12s;
          text-align: left; font-family: var(--font); position: relative;
          background: transparent; min-height: 40px;
        }
        .sb-btn.is-active {
          background: rgba(28,185,122,0.12); color: #6ee7b7; font-weight: 600;
          box-shadow: inset 0 0 0 1px rgba(28,185,122,0.15);
        }
        .sb-btn.is-inactive { background: transparent; color: rgba(255,255,255,0.38); font-weight: 400; }
        .sb-btn.is-inactive:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.78); }

        .sb-btn-active-bar {
          position: absolute; left: 0; top: 18%; bottom: 18%;
          width: 3px; border-radius: 0 2px 2px 0; background: var(--green);
        }

        .sb-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; line-height: 1.4; }
        .sb-badge-default { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
        .sb-badge-danger { background: rgba(185,28,28,0.3); color: #fca5a5; }

        .sb-footer {
          padding: 14px 18px 16px; border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; gap: 8px;
        }
        .sb-footer-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex-shrink: 0; }

        .ml-main { flex: 1; padding: 28px; overflow-y: auto; }

        .ml-footer { background: var(--surface); border-top: 1px solid var(--border-soft); padding: 20px 28px; }
        .ml-footer-brand { font-weight: 700; color: var(--slate-900); font-size: 14px; letter-spacing: -0.01em; }
        .ml-footer-brand em { color: var(--green); font-style: normal; }
        .ml-footer-link { color: var(--slate-400); font-size: 12px; text-decoration: none; font-family: var(--font); transition: color 0.15s; }
        .ml-footer-link:hover { color: var(--slate-900); }

        .ml-mobile-bell {
          display: none; width: 34px; height: 34px;
          background: transparent; border: none; color: rgba(255,255,255,0.55);
          cursor: pointer; align-items: center; justify-content: center;
          border-radius: 6px; position: relative; flex-shrink: 0; transition: color 0.15s;
        }
        .ml-mobile-bell:hover { color: #fff; }
        .ml-mobile-bell .notif-dot {
          position: absolute; top: 5px; right: 5px;
          width: 7px; height: 7px; background: #f87171;
          border-radius: 50%; border: 1.5px solid var(--slate-800);
        }

        @media (max-width: 768px) {
          .ml-mobile-bell { display: flex; }
          .ml-sidebar { display: none; }
          .ml-toolbar { padding: 0 14px; min-height: 58px; }
          .ml-wordmark { font-size: 15px; }
          .ml-wordmark-sub { font-size: 9px; }
          .role-badge { display: none; }
          .ml-vdiv { display: none; }
          .ml-icon-btn { display: none; }
          .ml-user-btn { padding: 3px 6px; }
          .ml-user-name-block { display: none; }
          .ml-main { padding: 16px 14px; }
          .ml-footer { padding: 16px 14px; }
          .ml-dropdown { top: 62px; right: 10px; min-width: 260px; }
        }

        @media (max-width: 480px) {
          .ml-toolbar { gap: 6px; padding: 0 10px; }
          .ml-logo-mark { width: 32px; height: 32px; }
          .ml-wordmark { font-size: 13px; }
          .ml-main { padding: 12px 10px; }
          .ml-footer { padding: 12px 10px; }
          .ml-dropdown { right: 6px; left: 6px; min-width: 0; }
        }
      `}</style>

      {/* ── AppBar ── */}
      <header className="ml-appbar">
        <div className="ml-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <div className="ml-logo-mark">
              <Recycle size={18} color="white" />
              <div className="ml-logo-dot">
                <Leaf size={7} color="white" />
              </div>
            </div>
            <div>
              <div className="ml-wordmark">Smart<em>Waste</em></div>
              <div className="ml-wordmark-sub">ParkCactive · Congo</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button
              className="ml-icon-btn"
              title="Notifications"
              aria-label="Notifications"
              onClick={openNotifications}
              aria-current={isNotificationsPage ? "page" : undefined}
            >
              <Bell size={16} />
              {unreadNotifications > 0 && !isNotificationsPage && (
                <span className="notif-dot" aria-hidden="true" />
              )}
            </button>
          </div>

          <button
            className="ml-mobile-bell"
            aria-label="Notifications"
            onClick={openNotifications}
          >
            <Bell size={17} />
            {unreadNotifications > 0 && !isNotificationsPage && (
              <span className="notif-dot" aria-hidden="true" />
            )}
          </button>

          <button
            className="ml-user-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
          >
            <div className="ml-avatar">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                user.name.split(" ").map((n) => n[0]).join("")
              )}
            </div>
            <div className="ml-user-name-block" style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", lineHeight: 1.3 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{currentRoleConfig.name}</div>
            </div>
            <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.35)", marginLeft: 2 }} />
          </button>

          {userMenuOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 199 }}
                onClick={() => setUserMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="ml-dropdown" role="menu">
                <div className="ml-menu-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--slate-800)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, overflow: "hidden" }}>
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        user.name.split(" ").map((n) => n[0]).join("")
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--slate-900)", fontFamily: "var(--font)" }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: "var(--slate-400)", fontFamily: "var(--font)" }}>{user.email}</div>
                    </div>
                  </div>
                  <span className={`role-badge ${currentRoleConfig.badgeStyle}`} style={{ background: "var(--slate-100)", color: "var(--slate-600)", border: "1px solid var(--border)", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 3 }}>
                    <span className="role-dot" style={{ background: "var(--slate-400)" }} />
                    {currentRoleConfig.name}
                  </span>
                </div>

                <div className="ml-dropdown-nav-section">
                  <style>{`.ml-dropdown-nav-section { display: none; } @media (max-width: 768px) { .ml-dropdown-nav-section { display: block; } }`}</style>
                  <div className="ml-menu-nav-label">Navigation</div>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeRoute === item.id;
                    return (
                      <button
                        key={item.id}
                        className={`ml-menu-item${isActive ? " is-active-nav" : ""}`}
                        role="menuitem"
                        onClick={() => { navigate(item.path); setUserMenuOpen(false); }}
                        style={{ fontSize: "13.5px", padding: "10px 18px" }}
                      >
                        <Icon size={14} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.badge !== undefined && <span className="ml-menu-nav-badge">{item.badge}</span>}
                      </button>
                    );
                  })}
                  <div style={{ height: 1, background: "var(--border-soft)", margin: "4px 0" }} />
                </div>

                <button
                  className="ml-menu-item"
                  role="menuitem"
                  onClick={() => {
                    let profilePath = `/dashboard/${user.role}/profile`;
                    if (user.role === "supervisor") {
                      profilePath = user.department === "Recycling Operations"
                        ? "/dashboard/supervisor/recycling/profile"
                        : "/dashboard/supervisor/waste/profile";
                    }
                    navigate(profilePath);
                    setUserMenuOpen(false);
                  }}
                  style={{ color: "var(--slate-600)", fontSize: "13.5px", padding: "10px 18px" }}
                >
                  <User size={14} /> Profile
                </button>
                <button className="ml-menu-item" role="menuitem" style={{ color: "var(--slate-600)", fontSize: "13.5px", padding: "10px 18px" }}>
                  <Settings size={14} /> Settings
                </button>
                <div style={{ height: 1, background: "var(--border-soft)", margin: "4px 0" }} />
                <button
                  className="ml-menu-item"
                  role="menuitem"
                  onClick={handleLogout}
                  style={{ color: "var(--red)", fontSize: "13.5px", padding: "10px 18px" }}
                >
                  <LogOut size={14} color="var(--red)" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <aside className="ml-sidebar" aria-label="Main navigation">
          <nav className="sb-nav">
            <div className="sb-section-label">Navigation</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`sb-btn ${isActive ? "is-active" : "is-inactive"}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && <span className="sb-btn-active-bar" aria-hidden="true" />}
                  <Icon size={15} strokeWidth={isActive ? 2.2 : 1.6} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.5 }} aria-hidden="true" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={item.badge > 5 ? "sb-badge sb-badge-danger" : "sb-badge sb-badge-default"}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="sb-footer">
            <div className="sb-footer-status-dot" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em", fontFamily: "var(--font)" }}>SMARTWASTE v1.0</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.12)", fontFamily: "var(--font)" }}>All systems operational</div>
            </div>
          </div>
        </aside>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <main className="ml-main">
            <Outlet />
          </main>

          <footer className="ml-footer">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 20, height: 20, background: "var(--slate-900)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Recycle size={11} color="white" />
                </div>
                <span className="ml-footer-brand">Smart<em>Waste</em> ParkCactive</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--slate-400)", margin: 0, fontFamily: "var(--font)" }}>
                Waste Management Platform — Republic of Congo
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 2, flexWrap: "wrap", justifyContent: "center" }}>
                {["Privacy policy", "Terms of service", "Contact", "Support"].map((link, i, arr) => (
                  <span key={link} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <a href="#" className="ml-footer-link">{link}</a>
                    {i < arr.length - 1 && <span style={{ color: "var(--border)" }} aria-hidden="true">·</span>}
                  </span>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Citizen approval toasts — rendered outside the scroll container so they're always visible */}
      <CitizenApprovalToast
        items={pendingApprovals}
        onApprove={approveCollection}
        onDismiss={dismissApproval}
      />
    </div>
  );
}