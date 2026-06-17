import { useState, useEffect } from "react";
import {
  Settings,
  Trash2,
  Package,
  Award,
  Bell,
  Shield,
  Plus,
  Edit,
  Save,
} from "lucide-react";
import { AdminMobileBlock } from "../../components/AdminMobileBlock";
import { AdminService } from "../../../services/adminService";
import {
  EcoPointsService,
  type BadgeDefinition,
  type BadgeCriteriaType,
} from "../../../services/ecoPointsService";

type Tab =
  | "categories"
  | "badges"
  | "notifications"
  | "permissions";

interface WasteCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  pricePerKg: number;
  active: boolean;
}

const CATEGORY_META: Record<
  string,
  { icon: string; color: string }
> = {
  Plastic: { icon: "♻️", color: "#3b82f6" },
  Organic: { icon: "🌿", color: "#10b981" },
  Paper: { icon: "📄", color: "#f59e0b" },
  Cardboard: { icon: "📦", color: "#f59e0b" },
  Glass: { icon: "🍾", color: "#8b5cf6" },
  Metal: { icon: "🔩", color: "#ef4444" },
  Electronics: { icon: "⚡", color: "#06b6d4" },
  Electronic: { icon: "⚡", color: "#06b6d4" },
  Batteries: { icon: "🔋", color: "#06b6d4" },
  Textile: { icon: "👕", color: "#ec4899" },
  Hazardous: { icon: "⚠️", color: "#dc2626" },
};

export function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [wasteCategories, setWasteCategories] = useState<WasteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [badgeSettings, setBadgeSettings] = useState<{
    pointsPerCompensation: number;
    badges: BadgeDefinition[];
  }>({ pointsPerCompensation: 50, badges: [] });
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [badgesSaving, setBadgesSaving] = useState(false);

  const CRITERIA_OPTIONS: { value: BadgeCriteriaType; label: string }[] = [
    { value: "REPORTS_SUBMITTED", label: "Reports submitted" },
    { value: "REPORTS_COMPENSATED", label: "Reports compensated" },
    { value: "WEIGHT_RECYCLED_KG", label: "Weight recycled (kg)" },
    { value: "DISTRICTS_HELPED", label: "Districts helped" },
    { value: "ACTIVE_STREAK_DAYS", label: "Active day streak" },
    { value: "ECO_POINTS", label: "Total eco points" },
  ];

  useEffect(() => {
    EcoPointsService.getBadgeSettings()
      .then(setBadgeSettings)
      .catch(console.error)
      .finally(() => setBadgesLoading(false));
  }, []);

  useEffect(() => {
    AdminService.getMaterialPrices()
      .then((prices) => {
        const cats = Object.entries(prices).map(([name, pricePerKg], i) => {
          const meta = CATEGORY_META[name] ?? { icon: "🗑️", color: "#6b7280" };
          return {
            id: i + 1,
            name,
            icon: meta.icon,
            color: meta.color,
            pricePerKg,
            active: true,
          };
        });
        setWasteCategories(cats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveCategories = async () => {
    try {
      setSaving(true);
      setSaveMessage(null);
      const prices = Object.fromEntries(
        wasteCategories.map((c) => [c.name, c.pricePerKg]),
      );
      await AdminService.saveMaterialPrices(prices);
      setSaveMessage("Material prices saved successfully.");
    } catch (err) {
      setSaveMessage("Failed to save settings.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePriceEdit = (name: string, price: number) => {
    setEditingCategory(name);
    setEditPrice(String(price));
  };

  const commitPriceEdit = () => {
    if (!editingCategory) return;
    const price = parseFloat(editPrice);
    if (Number.isNaN(price) || price < 0) return;
    setWasteCategories((prev) =>
      prev.map((c) =>
        c.name === editingCategory ? { ...c, pricePerKg: price } : c,
      ),
    );
    setEditingCategory(null);
    setEditPrice("");
  };

  const handleSaveBadges = async () => {
    try {
      setBadgesSaving(true);
      setSaveMessage(null);
      await EcoPointsService.saveBadgeSettings(badgeSettings);
      setSaveMessage("Badge and eco point settings saved successfully.");
    } catch (err) {
      setSaveMessage("Failed to save badge settings.");
      console.error(err);
    } finally {
      setBadgesSaving(false);
    }
  };

  const updateBadge = (
    badgeKey: string,
    patch: Partial<BadgeDefinition>,
  ) => {
    setBadgeSettings((prev) => ({
      ...prev,
      badges: prev.badges.map((b) =>
        b.badgeKey === badgeKey ? { ...b, ...patch } : b,
      ),
    }));
  };

  const notificationSettings = [
    {
      id: 1,
      category: "Reports",
      settings: [
        {
          id: "new-report",
          name: "New waste report submitted",
          enabled: true,
        },
        {
          id: "report-assigned",
          name: "Report assigned to collector",
          enabled: true,
        },
        {
          id: "report-completed",
          name: "Report marked as completed",
          enabled: true,
        },
      ],
    },
    {
      id: 2,
      category: "Collections",
      settings: [
        {
          id: "collection-scheduled",
          name: "Collection scheduled",
          enabled: true,
        },
        {
          id: "collection-started",
          name: "Collection started",
          enabled: false,
        },
        {
          id: "collection-completed",
          name: "Collection completed",
          enabled: true,
        },
      ],
    },
    {
      id: 3,
      category: "System",
      settings: [
        {
          id: "user-registered",
          name: "New user registration",
          enabled: true,
        },
        {
          id: "system-alert",
          name: "System alerts and warnings",
          enabled: true,
        },
        {
          id: "maintenance",
          name: "Scheduled maintenance",
          enabled: true,
        },
      ],
    },
  ];

  const rolePermissions = [
    {
      role: "Citizen",
      permissions: [
        {
          id: "submit-report",
          name: "Submit waste reports",
          enabled: true,
        },
        {
          id: "view-reports",
          name: "View own reports",
          enabled: true,
        },
        {
          id: "request-ecopoints",
          name: "Request eco points",
          enabled: true,
        },
        {
          id: "view-leaderboard",
          name: "View leaderboard",
          enabled: true,
        },
      ],
    },
    {
      role: "Collector",
      permissions: [
        {
          id: "view-tasks",
          name: "View assigned tasks",
          enabled: true,
        },
        {
          id: "update-status",
          name: "Update collection status",
          enabled: true,
        },
        {
          id: "mark-complete",
          name: "Mark tasks as completed",
          enabled: true,
        },
        {
          id: "view-routes",
          name: "View collection routes",
          enabled: true,
        },
      ],
    },
    {
      role: "Supervisor",
      permissions: [
        {
          id: "assign-tasks",
          name: "Assign tasks to collectors",
          enabled: true,
        },
        {
          id: "view-district-reports",
          name: "View district reports",
          enabled: true,
        },
        {
          id: "manage-collectors",
          name: "Manage collector accounts",
          enabled: true,
        },
        {
          id: "override-assignments",
          name: "Override task assignments",
          enabled: true,
        },
      ],
    },
    {
      role: "Administrator",
      permissions: [
        {
          id: "full-access",
          name: "Full system access",
          enabled: true,
        },
        {
          id: "user-management",
          name: "User management",
          enabled: true,
        },
        {
          id: "system-settings",
          name: "System settings",
          enabled: true,
        },
        {
          id: "analytics",
          name: "View analytics",
          enabled: true,
        },
      ],
    },
  ];

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "categories",
      label: "Waste Categories",
      icon: <Package size={13} />,
    },
    {
      id: "badges",
      label: "Badges",
      icon: <Award size={13} />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell size={13} />,
    },
    {
      id: "permissions",
      label: "Role Permissions",
      icon: <Shield size={13} />,
    },
  ];

  return (
    <AdminMobileBlock>
      <div
        style={{
          fontFamily:
            "'Nunito Sans','DM Sans',-apple-system,sans-serif",
        }}
      >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        .ss-body {
          background: #f7f8fa;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Tabs */
        .ss-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #dde1e7;
          margin-bottom: 2px;
        }
        .ss-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 14px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          background: none;
          border: none;
          font-family: inherit;
          color: #9aa0ac;
          position: relative;
          letter-spacing: 0.02em;
          transition: color 0.15s;
          white-space: nowrap;
        }
        .ss-tab:hover { color: #1a1e25; }
        .ss-tab.active { color: #1a1e25; }
        .ss-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #1cb97a;
          border-radius: 2px 2px 0 0;
        }

        /* Card */
        .ss-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .ss-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ss-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .ss-card-subtitle {
          font-size: 11px;
          color: #9aa0ac;
          margin-top: 1px;
        }

        /* Category grid */
        .ss-cat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 14px;
        }
        .ss-cat-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .ss-cat-top {
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          justify-content: space-between;
        }
        .ss-cat-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .ss-cat-footer {
          padding: 8px 14px;
          background: #f7f8fa;
          border-top: 1px solid #eef0f3;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Badge grid */
        .ss-badge-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 14px;
        }
        .ss-badge-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .ss-badge-top {
          padding: 14px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .ss-badge-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .ss-badge-footer {
          padding: 8px 14px;
          background: #f7f8fa;
          border-top: 1px solid #eef0f3;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Notification rows */
        .ss-notif-group {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .ss-notif-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .ss-notif-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px;
          border-bottom: 1px solid #eef0f3;
          transition: background 0.1s;
        }
        .ss-notif-row:last-child { border-bottom: none; }
        .ss-notif-row:hover { background: #f7f8fa; }

        /* Toggle */
        .ss-toggle {
          position: relative;
          width: 36px;
          height: 20px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .ss-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .ss-toggle-track {
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: #dde1e7;
          transition: background 0.2s;
        }
        .ss-toggle input:checked ~ .ss-toggle-track { background: #1cb97a; }
        .ss-toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .ss-toggle input:checked ~ .ss-toggle-thumb { transform: translateX(16px); }

        /* Permissions */
        .ss-perm-group {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .ss-perm-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .ss-perm-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 10px 12px;
          gap: 6px;
        }
        .ss-perm-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border: 1px solid #eef0f3;
          border-radius: 6px;
          background: #f7f8fa;
          transition: background 0.1s;
        }
        .ss-perm-row:hover { background: #f0f2f5; }

        /* Shared action buttons */
        .ss-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          padding: 6px 13px;
          font-size: 12px;
          font-weight: 700;
          color: #4a5568;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.02em;
          transition: background 0.1s;
        }
        .ss-btn-secondary:hover { background: #f0f2f5; }
        .ss-icon-btn {
          width: 26px;
          height: 26px;
          border-radius: 5px;
          border: 1px solid #dde1e7;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.1s;
          flex-shrink: 0;
        }
        .ss-icon-btn:hover { background: #f0f2f5; }
        .ss-icon-btn-danger:hover { background: #fee2e2; border-color: #fca5a5; }
        .ss-criteria-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10.5px;
          font-weight: 800;
          background: #f0f2f5;
          color: #6b7a8f;
          letter-spacing: 0.03em;
        }
      `}</style>

      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#1a1e25",
              letterSpacing: "-0.02em",
            }}
          >
            System Settings
          </p>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Configure waste categories, badges, notifications,
            and permissions
          </p>
        </div>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#1cb97a",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 12.5,
            fontWeight: 700,
            color: "#fff",
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.02em",
            opacity: saving ? 0.7 : 1,
          }}
          onClick={handleSaveCategories}
          disabled={saving || activeTab !== "categories"}
        >
          <Save size={13} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {saveMessage && (
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "#1cb97a", fontWeight: 700 }}>
          {saveMessage}
        </p>
      )}

      {/* Tabs */}
      <div className="ss-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`ss-tab${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="ss-body">
        {/* ── Waste Categories ── */}
        {activeTab === "categories" && (
          <div className="ss-card">
            <div className="ss-card-header">
              <div>
                <div className="ss-card-title">
                  Waste Categories
                </div>
                <div className="ss-card-subtitle">
                  Manage categories and quantity thresholds
                </div>
              </div>
              <button className="ss-btn-secondary">
                <Plus size={12} /> Add Category
              </button>
            </div>
            <div className="ss-cat-grid">
              {loading ? (
                <div style={{ gridColumn: "1 / -1", padding: 24, textAlign: "center", color: "#aab0bb" }}>
                  Loading categories...
                </div>
              ) : (
              wasteCategories.map((cat) => (
                <div className="ss-cat-card" key={cat.id}>
                  <div className="ss-cat-top">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                      }}
                    >
                      <div
                        className="ss-cat-icon"
                        style={{ background: `${cat.color}18` }}
                      >
                        {cat.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#1a1e25",
                            marginBottom: 2,
                          }}
                        >
                          {cat.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: "#aab0bb",
                            fontWeight: 600,
                          }}
                        >
                          {editingCategory === cat.name ? (
                            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                style={{ width: 80, padding: "2px 6px", fontSize: 11 }}
                              />
                              <button
                                type="button"
                                onClick={commitPriceEdit}
                                style={{ fontSize: 10, cursor: "pointer" }}
                              >
                                OK
                              </button>
                            </span>
                          ) : (
                            <>Price: {cat.pricePerKg} CFA/kg</>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      className="ss-icon-btn"
                      onClick={() => handlePriceEdit(cat.name, cat.pricePerKg)}
                    >
                      <Edit size={11} color="#9aa0ac" />
                    </button>
                  </div>
                  <div className="ss-cat-footer">
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                      }}
                    >
                      <label className="ss-toggle">
                        <input
                          type="checkbox"
                          defaultChecked={cat.active}
                        />
                        <div className="ss-toggle-track" />
                        <div className="ss-toggle-thumb" />
                      </label>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#6b7a8f",
                        }}
                      >
                        Active
                      </span>
                    </label>
                    <button
                      className={`ss-icon-btn ss-icon-btn-danger`}
                    >
                      <Trash2 size={11} color="#b91c1c" />
                    </button>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        )}

        {/* ── Badges ── */}
        {activeTab === "badges" && (
          <div className="ss-card">
            <div className="ss-card-header">
              <div>
                <div className="ss-card-title">Badges &amp; Eco Points</div>
                <div className="ss-card-subtitle">
                  Configure badges, unlock criteria, and compensation points
                </div>
              </div>
              <button
                className="ss-btn-secondary"
                onClick={handleSaveBadges}
                disabled={badgesSaving || badgesLoading}
              >
                <Save size={12} />{" "}
                {badgesSaving ? "Saving…" : "Save Settings"}
              </button>
            </div>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #eef0f3" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#4a5568",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                }}
              >
                Eco points per compensated report
              </label>
              <input
                type="number"
                min={0}
                value={badgeSettings.pointsPerCompensation}
                onChange={(e) =>
                  setBadgeSettings((prev) => ({
                    ...prev,
                    pointsPerCompensation: Math.max(
                      0,
                      parseInt(e.target.value, 10) || 0,
                    ),
                  }))
                }
                style={{
                  width: 120,
                  padding: "8px 10px",
                  border: "1px solid #dde1e7",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              />
            </div>
            {badgesLoading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#9aa0ac" }}>
                Loading badges…
              </div>
            ) : (
            <div className="ss-badge-grid">
              {badgeSettings.badges.map((badge) => (
                <div className="ss-badge-card" key={badge.badgeKey}>
                  <div className="ss-badge-top">
                    <div
                      className="ss-badge-avatar"
                      style={{ background: `${badge.color}18` }}
                    >
                      {badge.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#1a1e25",
                          marginBottom: 3,
                        }}
                      >
                        {badge.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#8a9099",
                          marginBottom: 8,
                          lineHeight: 1.5,
                        }}
                      >
                        {badge.description}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <select
                          value={badge.criteriaType}
                          onChange={(e) =>
                            updateBadge(badge.badgeKey, {
                              criteriaType: e.target.value as BadgeCriteriaType,
                            })
                          }
                          style={{
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid #dde1e7",
                          }}
                        >
                          {CRITERIA_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={badge.criteriaThreshold}
                          onChange={(e) =>
                            updateBadge(badge.badgeKey, {
                              criteriaThreshold: Math.max(
                                1,
                                parseInt(e.target.value, 10) || 1,
                              ),
                              criteriaLabel: `${e.target.value} threshold`,
                            })
                          }
                          title="Unlock threshold"
                          style={{
                            width: 64,
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid #dde1e7",
                          }}
                        />
                        <input
                          type="number"
                          min={0}
                          value={badge.pointsReward}
                          onChange={(e) =>
                            updateBadge(badge.badgeKey, {
                              pointsReward: Math.max(
                                0,
                                parseInt(e.target.value, 10) || 0,
                              ),
                            })
                          }
                          title="Bonus eco points when earned"
                          style={{
                            width: 64,
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid #dde1e7",
                          }}
                        />
                      </div>
                      <span className="ss-criteria-pill" style={{ marginTop: 8, display: "inline-block" }}>
                        {badge.criteriaLabel || `${badge.criteriaThreshold} required`}
                        {badge.pointsReward > 0
                          ? ` · +${badge.pointsReward} pts`
                          : ""}
                      </span>
                    </div>
                  </div>
                  <div className="ss-badge-footer">
                    <label className="ss-toggle">
                      <input
                        type="checkbox"
                        checked={badge.active}
                        onChange={(e) =>
                          updateBadge(badge.badgeKey, {
                            active: e.target.checked,
                          })
                        }
                      />
                      <div className="ss-toggle-track" />
                      <div className="ss-toggle-thumb" />
                    </label>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: "#6b7a8f",
                      }}
                    >
                      {badge.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ── Notifications ── */}
        {activeTab === "notifications" && (
          <>
            {notificationSettings.map((group) => (
              <div className="ss-notif-group" key={group.id}>
                <div className="ss-notif-header">
                  {group.category}
                </div>
                {group.settings.map((setting) => (
                  <div
                    className="ss-notif-row"
                    key={setting.id}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#1a1e25",
                      }}
                    >
                      {setting.name}
                    </span>
                    <label className="ss-toggle">
                      <input
                        type="checkbox"
                        defaultChecked={setting.enabled}
                      />
                      <div className="ss-toggle-track" />
                      <div className="ss-toggle-thumb" />
                    </label>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* ── Role Permissions ── */}
        {activeTab === "permissions" && (
          <>
            {rolePermissions.map((group) => (
              <div className="ss-perm-group" key={group.role}>
                <div className="ss-perm-header">
                  <Shield size={12} color="#6b7a8f" />
                  {group.role}
                </div>
                <div className="ss-perm-grid">
                  {group.permissions.map((perm) => (
                    <div className="ss-perm-row" key={perm.id}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#1a1e25",
                        }}
                      >
                        {perm.name}
                      </span>
                      <label className="ss-toggle">
                        <input
                          type="checkbox"
                          defaultChecked={perm.enabled}
                        />
                        <div className="ss-toggle-track" />
                        <div className="ss-toggle-thumb" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
    </AdminMobileBlock>
  );
}