import { ReactNode } from "react";
import {
  AppBar,
  Toolbar,
  Avatar,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Shield,
  AlertTriangle,
  User,
  LogOut,
  Settings,
  Bell,
  HelpCircle,
  BarChart3,
  Users,
  TrendingUp,
  Inbox,
  Flag,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  AlertCircle as AlertCircleIcon,
  Archive,
  ChevronDown,
  Puzzle,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import type { UserRole } from "../types";

interface Props {
  children: ReactNode;
  currentRole: UserRole | null;
  onRoleChange: (role: UserRole | null) => void;
  activeRoute: string;
  onNavigate: (route: string) => void;
}

const navigationConfig = {
  admin: [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "users", label: "Users", icon: Users },
    { id: "integrations", label: "Integrations", icon: Puzzle },
    { id: "plans", label: "Plans", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings },
  ],
  analyst: [
    {
      id: "pending",
      label: "Pending Review",
      icon: Inbox,
      badge: 12,
    },
    { id: "flagged", label: "Flagged Cases", icon: Flag },
    { id: "history", label: "History", icon: CheckCircle2 },
    { id: "resources", label: "Resources", icon: BookOpen },
  ],
  "customer-service": [
    {
      id: "active",
      label: "Active Tickets",
      icon: MessageSquare,
      badge: 8,
    },
    {
      id: "escalated",
      label: "Escalated",
      icon: AlertCircleIcon,
      badge: 3,
    },
    { id: "resolved", label: "Resolved", icon: Archive },
    { id: "kb", label: "Knowledge Base", icon: HelpCircle },
  ],
};

const roleConfig = {
  admin: { name: "Admin", badgeStyle: "badge-admin" },
  "end-user": { name: "End User", badgeStyle: "badge-user" },
  analyst: {
    name: "Red Flag Analyst",
    badgeStyle: "badge-analyst",
  },
  "customer-service": {
    name: "Customer Service",
    badgeStyle: "badge-cs",
  },
};

export function MainLayout({
  children,
  currentRole,
  onRoleChange,
  activeRoute,
  onNavigate,
}: Props) {
  const [userMenuAnchor, setUserMenuAnchor] =
    useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (
    e: React.MouseEvent<HTMLElement>,
  ) => setUserMenuAnchor(e.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);
  const handleSwitchRole = () => {
    handleUserMenuClose();
    onRoleChange(null);
  };

  const currentRoleConfig = currentRole
    ? roleConfig[currentRole]
    : null;
  const navItems =
    currentRole && currentRole !== "end-user"
      ? navigationConfig[
          currentRole as keyof typeof navigationConfig
        ] || []
      : [];
  const hasSidebar =
    currentRole &&
    currentRole !== "end-user" &&
    navItems.length > 0;

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

        /* ── Top accent bar ── */
        .ml-top-accent {
          height: 3px;
          background: var(--green);
          flex-shrink: 0;
        }

        /* ── System notice ── */
        .ml-notice {
          background: #f0f5fb;
          border-bottom: 1px solid #d9e6f2;
          padding: 7px 28px;
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: var(--blue);
          font-family: var(--font); font-weight: 400;
        }
        .ml-notice-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--green);
          animation: blink 2.2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        /* ── AppBar ── */
        .ml-appbar {
          background: var(--slate-800) !important;
          border-bottom: 1px solid var(--slate-700) !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2) !important;
        }

        /* ── Logo ── */
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
          font-family: var(--font);
          font-weight: 700; font-size: 17px;
          color: #ffffff; letter-spacing: -0.02em; line-height: 1;
        }
        .ml-wordmark em { color: var(--green); font-style: normal; }
        .ml-wordmark-sub {
          font-size: 10px; color: rgba(255,255,255,0.35);
          letter-spacing: 0.08em; text-transform: uppercase;
          font-weight: 600; margin-top: 3px;
          font-family: var(--font);
        }

        /* ── Divider ── */
        .ml-vdiv { width: 1px; height: 22px; background: rgba(255,255,255,0.12); flex-shrink: 0; }

        /* ── Role badges ── */
        .role-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 4px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.02em; font-family: var(--font);
        }
        .role-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .badge-admin    { background: rgba(26,95,168,0.25); color: #93c5fd; border: 1px solid rgba(147,197,253,0.2); }
        .badge-admin    .role-dot { background: #60a5fa; }
        .badge-user     { background: rgba(28,185,122,0.2); color: #6ee7b7; border: 1px solid rgba(110,231,183,0.2); }
        .badge-user     .role-dot { background: var(--green); }
        .badge-analyst  { background: rgba(91,33,182,0.25); color: #c4b5fd; border: 1px solid rgba(196,181,253,0.2); }
        .badge-analyst  .role-dot { background: #a78bfa; }
        .badge-cs       { background: rgba(146,64,14,0.25); color: #fcd34d; border: 1px solid rgba(252,211,77,0.2); }
        .badge-cs       .role-dot { background: #fbbf24; }

        /* ── Topbar icon buttons ── */
        .ml-icon-btn {
          color: rgba(255,255,255,0.45) !important;
          border-radius: 6px !important;
          width: 34px !important; height: 34px !important;
          transition: all 0.15s ease !important;
        }
        .ml-icon-btn:hover {
          color: #ffffff !important;
          background: rgba(255,255,255,0.08) !important;
        }

        /* ── User button ── */
        .ml-user-btn {
          background: transparent !important;
          border: 1px solid transparent !important;
          border-radius: 6px !important;
          padding: 5px 8px 5px 6px !important;
          text-transform: none !important;
          transition: all 0.15s ease !important;
          min-width: 0 !important;
          gap: 6px !important;
        }
        .ml-user-btn:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.15) !important;
        }

        /* ── Dropdown ── */
        .ml-menu .MuiPaper-root {
          background: var(--white) !important;
          border: 1px solid var(--border) !important;
          border-radius: 10px !important;
          min-width: 230px !important;
          box-shadow: var(--shadow-menu) !important;
          overflow: hidden !important;
          margin-top: 6px !important;
        }
        .ml-menu .MuiMenuItem-root {
          color: var(--slate-600) !important;
          font-size: 13.5px !important;
          padding: 10px 18px !important;
          gap: 10px !important;
          font-family: var(--font) !important;
          font-weight: 400 !important;
          transition: background 0.1s !important;
        }
        .ml-menu .MuiMenuItem-root:hover {
          background: var(--slate-50) !important;
          color: var(--slate-900) !important;
        }
        .ml-menu-header {
          padding: 16px 18px 14px;
          border-bottom: 1px solid var(--border-soft);
          background: var(--slate-50);
        }
        .ml-menu-header-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 9px; border-radius: 3px;
          font-size: 11px; font-weight: 600;
          font-family: var(--font);
        }

        /* ── Sign in btn ── */
        .ml-signin-btn {
          background: var(--green) !important;
          color: white !important;
          border-radius: 6px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          padding: 7px 18px !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
          box-shadow: none !important;
          transition: background 0.15s ease !important;
          font-family: var(--font) !important;
        }
        .ml-signin-btn:hover { background: var(--green-hover) !important; }

        /* ── Sidebar ── */
        .ml-sidebar {
          width: 220px;
          background: var(--slate-800);
          display: flex; flex-direction: column;
          flex-shrink: 0; align-self: stretch;
          border-right: 1px solid rgba(0,0,0,0.18);
        }

        .sb-role-strip {
          padding: 14px 18px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; gap: 8px;
        }
        .sb-role-pip {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
        .sb-role-name {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.22);
          font-family: var(--font);
        }

        .sb-section-label {
          font-size: 9.5px; font-weight: 700;
          color: rgba(255,255,255,0.18);
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 14px 18px 6px;
          font-family: var(--font);
        }

        .sb-nav { padding: 6px 8px; flex: 1; }

        .sb-btn {
          width: 100%;
          display: flex; align-items: center; gap: 9px;
          padding: 8px 11px; margin-bottom: 1px;
          border: none; border-radius: 6px;
          font-size: 13px; cursor: pointer;
          transition: background 0.12s, color 0.12s;
          text-align: left; font-family: var(--font);
          position: relative;
        }
        .sb-btn.is-active {
          background: rgba(28,185,122,0.12);
          color: #6ee7b7;
          font-weight: 600;
          box-shadow: inset 0 0 0 1px rgba(28,185,122,0.15);
        }
        .sb-btn.is-inactive {
          background: transparent;
          color: rgba(255,255,255,0.38);
          font-weight: 400;
        }
        .sb-btn.is-inactive:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.78);
        }
        .sb-btn-active-bar {
          position: absolute; left: 0; top: 18%; bottom: 18%;
          width: 3px; border-radius: 0 2px 2px 0;
          background: var(--green);
        }

        .sb-badge {
          font-size: 10px; font-weight: 700;
          padding: 2px 7px; border-radius: 10px;
          line-height: 1.4;
        }
        .sb-badge-default { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
        .sb-badge-danger  { background: rgba(185,28,28,0.3); color: #fca5a5; }

        .sb-footer {
          padding: 14px 18px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; gap: 8px;
        }
        .sb-footer-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--green); flex-shrink: 0;
        }

        /* ── Page content ── */
        .ml-main { flex: 1; padding: 28px 28px; }

        /* ── Footer ── */
        .ml-footer {
          background: var(--surface);
          border-top: 1px solid var(--border-soft);
          padding: 20px 28px;
        }
        .ml-footer-brand { font-weight: 700; color: var(--slate-900); font-size: 14px; letter-spacing: -0.01em; }
        .ml-footer-brand em { color: var(--green); font-style: normal; }
        .ml-footer-link {
          color: var(--slate-400); font-size: 12px;
          text-decoration: none; font-family: var(--font);
          transition: color 0.15s;
        }
        .ml-footer-link:hover { color: var(--slate-900); }
      `}</style>

      {/* AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        className="ml-appbar"
      >
        <Toolbar
          style={{ gap: 10, minHeight: 58, padding: "0 22px" }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: 1,
            }}
          >
            <div className="ml-logo-mark">
              <Shield size={18} color="white" />
              <div className="ml-logo-dot">
                <AlertTriangle size={7} color="white" />
              </div>
            </div>
            <div>
              <div className="ml-wordmark">
                Job<em>Shield</em>
              </div>
              <div className="ml-wordmark-sub">
                Fraud Detection
              </div>
            </div>
          </div>

          {currentRole && <div className="ml-vdiv" />}

          {currentRole && currentRoleConfig && (
            <div
              className={`role-badge ${currentRoleConfig.badgeStyle}`}
            >
              <span className="role-dot" />
              {currentRoleConfig.name}
            </div>
          )}

          {currentRole && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <IconButton
                size="small"
                className="ml-icon-btn"
                title="Notifications"
              >
                <Bell size={16} />
              </IconButton>
              <IconButton
                size="small"
                className="ml-icon-btn"
                title="Help"
              >
                <HelpCircle size={16} />
              </IconButton>
              <IconButton
                size="small"
                className="ml-icon-btn"
                title="Settings"
              >
                <Settings size={16} />
              </IconButton>
            </div>
          )}

          {currentRole && currentRoleConfig && (
            <>
              <Button
                onClick={handleUserMenuOpen}
                className="ml-user-btn"
                disableRipple
              >
                <Avatar
                  sx={{
                    width: 29,
                    height: 29,
                    bgcolor: "rgba(255,255,255,0.12)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  DU
                </Avatar>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#ffffff",
                      lineHeight: 1.3,
                      fontFamily: "var(--font)",
                    }}
                  >
                    Demo User
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      fontFamily: "var(--font)",
                    }}
                  >
                    {currentRoleConfig.name}
                  </div>
                </div>
                <ChevronDown
                  size={12}
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    marginLeft: 2,
                  }}
                />
              </Button>

              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                className="ml-menu"
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <div className="ml-menu-header">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: "var(--slate-800)",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      DU
                    </Avatar>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--slate-900)",
                          fontFamily: "var(--font)",
                        }}
                      >
                        Demo User
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--slate-400)",
                          fontFamily: "var(--font)",
                        }}
                      >
                        demo.user@jobshield.ai
                      </div>
                    </div>
                  </div>
                  <span
                    className={`ml-menu-header-badge role-badge ${currentRoleConfig.badgeStyle}`}
                    style={{
                      background: "var(--slate-100)",
                      color: "var(--slate-600)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span
                      className="role-dot"
                      style={{ background: "var(--slate-400)" }}
                    />
                    {currentRoleConfig.name}
                  </span>
                </div>

                <MenuItem onClick={handleUserMenuClose}>
                  <User size={14} /> Profile
                </MenuItem>
                <MenuItem onClick={handleUserMenuClose}>
                  <Settings size={14} /> Settings
                </MenuItem>
                <Divider
                  sx={{
                    borderColor:
                      "var(--border-soft) !important",
                    my: "4px !important",
                  }}
                />
                <MenuItem onClick={handleSwitchRole}>
                  <LogOut size={14} color="var(--red)" />
                  <span style={{ color: "var(--red)" }}>
                    Switch role
                  </span>
                </MenuItem>
              </Menu>
            </>
          )}

          {!currentRole && (
            <Button
              className="ml-signin-btn"
              startIcon={<User size={14} />}
            >
              Sign in
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Body row */}
      <div style={{ display: "flex", flex: 1, gap: 0 }}>
        {/* Sidebar */}
        {hasSidebar && (
          <aside className="ml-sidebar">
            <nav className="sb-nav">
              <div className="sb-section-label">Navigation</div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`sb-btn ${isActive ? "is-active" : "is-inactive"}`}
                  >
                    {isActive && (
                      <span className="sb-btn-active-bar" />
                    )}
                    <Icon
                      size={15}
                      strokeWidth={isActive ? 2.2 : 1.6}
                      style={{
                        flexShrink: 0,
                        opacity: isActive ? 1 : 0.5,
                      }}
                    />
                    <span style={{ flex: 1 }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`sb-badge ${item.id === "escalated" ? "sb-badge-danger" : "sb-badge-default"}`}
                      >
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
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.2)",
                    letterSpacing: "0.05em",
                    fontFamily: "var(--font)",
                  }}
                >
                  JOBSHIELD v1.0
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.12)",
                    fontFamily: "var(--font)",
                  }}
                >
                  All systems operational
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Content column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <main className="ml-main">{children}</main>

          <footer className="ml-footer">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    background: "var(--slate-900)",
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={11} color="white" />
                </div>
                <span className="ml-footer-brand">
                  Job<em>Shield</em> AI
                </span>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--slate-400)",
                  margin: 0,
                  fontFamily: "var(--font)",
                }}
              >
                Protecting job seekers from fraudulent postings
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginTop: 2,
                }}
              >
                {[
                  "Privacy policy",
                  "Terms of service",
                  "Contact",
                  "Report abuse",
                ].map((link, i, arr) => (
                  <span
                    key={link}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <a href="#" className="ml-footer-link">
                      {link}
                    </a>
                    {i < arr.length - 1 && (
                      <span style={{ color: "var(--border)" }}>
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}