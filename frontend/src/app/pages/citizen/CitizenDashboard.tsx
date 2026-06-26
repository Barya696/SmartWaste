import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import {
  CompensationService,
  type EnrichedCitizenReport,
  type CitizenReportStatus,
} from "../../../services/compensationService";
import {
  EcoPointsService,
  type CitizenEcoRewards,
} from "../../../services/ecoPointsService";
import {
  MapPin,
  Package,
  Users,
  Recycle,
  Percent,
  Coins,
  FileText,
  Leaf,
  Wind,
  TrendingUp,
} from "lucide-react";

export function CitizenDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<EnrichedCitizenReport[]>([]);
  const [rewards, setRewards] = useState<CitizenEcoRewards | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [data, eco] = await Promise.all([
          CompensationService.getCitizenReports(user.id),
          EcoPointsService.getCitizenRewards(user.id),
        ]);
        setReports(data);
        setRewards(eco);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports([]);
        setRewards(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const totalReports = reports.length;
  const collectedReports = reports.filter((r) =>
    ["collected", "recycled", "compensated"].includes(r.status),
  ).length;
  const pendingReports = reports.filter((r) =>
    ["pending", "in_progress"].includes(r.status),
  ).length;
  const compensatedReports = reports.filter((r) => r.status === "compensated");
  const totalCompensation = compensatedReports.reduce(
    (sum, r) => sum + (r.citizenAmount ?? 0),
    0,
  );
  const ecoPoints = rewards?.totalEcoPoints ?? 0;
  const balance = totalCompensation;
  const badges = rewards?.badges ?? [];

  const stats = [
    {
      label: "Reports Submitted",
      value: totalReports.toString(),
      trend: totalReports > 0 ? `+${totalReports}` : "0",
      trendUp: true,
      icon: Users,
      gradFrom: "#f472b6",
      gradTo: "#e879a0",
    },
    {
      label: "Waste Collected",
      value: collectedReports.toString(),
      trend: collectedReports > 0 ? `+${collectedReports}` : "0",
      trendUp: true,
      icon: Recycle,
      gradFrom: "#34d9e0",
      gradTo: "#06b6d4",
    },
    {
      label: "Pending Reports",
      value: pendingReports.toString(),
      trend: pendingReports > 0 ? `${pendingReports} open` : "All clear",
      trendUp: pendingReports === 0,
      icon: Percent,
      gradFrom: "#fb923c",
      gradTo: "#f97316",
    },
    {
      label: "Balance",
      value: balance.toLocaleString("fr-CG"),
      trend:
        compensatedReports.length > 0
          ? `${compensatedReports.length} payout${compensatedReports.length !== 1 ? "s" : ""}`
          : "No payouts yet",
      trendUp: compensatedReports.length > 0,
      icon: Coins,
      gradFrom: "#60a5fa",
      gradTo: "#3b82f6",
    },
  ];

  const recentReports = reports.slice(0, 3).map((report) => ({
    id: report.id,
    type: report.type,
    location: `${report.district}, ${report.location}`,
    status: report.status,
    date: new Date(report.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    citizenAmount: report.citizenAmount,
  }));

  const displayReports =
    recentReports.length > 0
      ? recentReports
      : loading
        ? []
        : [
            {
              id: "—",
              type: "No reports yet",
              location: "Submit your first waste report",
              status: "pending" as CitizenReportStatus,
              date: "Not submitted",
              citizenAmount: undefined,
            },
          ];

  const impact = [
    { value: `${totalReports * 2}kg`, label: "Waste Reported", icon: Package },
    { value: `${Math.max(1, collectedReports)}kg`, label: "CO₂ Reduced", icon: Wind },
    {
      value: `${rewards?.weightRecycledKg.toFixed(1) ?? 0}kg`,
      label: "Recycled",
      icon: Leaf,
    },
  ];

  const statusConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    pending: {
      label: "Pending",
      color: "var(--amber)",
      bg: "rgba(146,64,14,0.10)",
    },
    in_progress: {
      label: "In Progress",
      color: "var(--blue)",
      bg: "rgba(26,99,168,0.10)",
    },
    collected: {
      label: "Collected",
      color: "var(--green)",
      bg: "rgba(28,185,122,0.1)",
    },
    recycled: {
      label: "Recycled",
      color: "var(--violet)",
      bg: "rgba(124,58,237,0.09)",
    },
    compensated: {
      label: "Compensated",
      color: "#1d4ed8",
      bg: "rgba(29,78,216,0.10)",
    },
    empty: {
      label: "Empty",
      color: "#aab0bb",
      bg: "rgba(170,176,187,0.10)",
    },
  };

  return (
    <div
      style={{
        fontFamily:
          "'Nunito Sans', 'DM Sans', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        /* ── Stats grid ── */
        .cd-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .cd-stat-card {
          background: #fff;
          border: 1px solid #e8eaee;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
        }
        .cd-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cd-stat-label {
          font-size: 11.5px;
          font-weight: 600;
          color: #9aa0ac;
          margin-bottom: 2px;
        }
        .cd-stat-value {
          font-size: 28px;
          font-weight: 800;
          color: #1a1e25;
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .cd-stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 11.5px;
          font-weight: 700;
          margin-top: 8px;
        }
        .cd-stat-trend.up   { color: var(--green); }
        .cd-stat-trend.down { color: var(--red);   }

        /* ── Two-col layout ── */
        .cd-two-col {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 10px;
        }

        /* ── Card base ── */
        .cd-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .cd-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cd-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .cd-view-all {
          font-size: 11px;
          font-weight: 700;
          color: var(--blue);
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 0;
          letter-spacing: 0.02em;
        }
        .cd-view-all:hover { text-decoration: underline; }

        /* ── Report rows — button for proper a11y ── */
        .cd-report-row {
          display: grid;
          grid-template-columns: 32px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          border-bottom: 1px solid #eef0f3;
          transition: background 0.1s;
          cursor: pointer;
          width: 100%;
          background: transparent;
          border-left: none;
          border-right: none;
          border-top: none;
          font-family: inherit;
          text-align: left;
        }
        .cd-report-row:last-child { border-bottom: none; }
        .cd-report-row:hover      { background: #f0faf6; }
        .cd-report-row:focus-visible {
          outline: 2px solid var(--green);
          outline-offset: -2px;
        }

        .cd-report-icon {
          width: 32px;
          height: 32px;
          background: #f0f2f5;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7a8f;
          flex-shrink: 0;
        }
        .cd-report-id       { font-size: 12.5px; font-weight: 700; color: #1a1e25; margin-bottom: 2px; }
        .cd-report-type     { font-size: 11px;   color: #8a9099; }
        .cd-report-location {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          color: #aab0bb;
          margin-top: 3px;
        }
        .cd-status-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
        .cd-report-date {
          font-size: 10.5px;
          color: #aab0bb;
          margin-top: 4px;
          text-align: right;
        }

        /* ── Badges ── */
        .cd-badge-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 16px;
          border-bottom: 1px solid #eef0f3;
        }
        .cd-badge-row:last-child { border-bottom: none; }
        .cd-badge-emoji { font-size: 22px; width: 36px; text-align: center; flex-shrink: 0; }
        .cd-badge-name  { font-size: 12.5px; font-weight: 700; color: #1a1e25; margin-bottom: 2px; }
        .cd-badge-desc  { font-size: 11px; color: #8a9099; }
        .cd-badge-tag {
          margin-left: auto;
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ── Points banner ── */
        .cd-points-banner {
          background: #f0f2f5;
          border-top: 1px solid #dde1e7;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cd-points-value {
          font-size: 20px;
          font-weight: 800;
          color: var(--violet);
          letter-spacing: -0.02em;
        }
        .cd-points-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #7a8494;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-top: 1px;
        }
        .cd-points-hint { font-size: 11px; color: #8a9099; text-align: right; }

        /* ── Impact bar ── */
        .cd-impact-bar {
          background: var(--slate-800);
          border: 1px solid rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 0;
        }
        .cd-impact-left {
          flex: 1;
          padding-right: 24px;
          border-right: 1px solid rgba(255,255,255,0.08);
        }
        .cd-impact-heading { font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 2px; }
        .cd-impact-sub     { font-size: 11px; color: rgba(255,255,255,0.3); }
        .cd-impact-stats   { display: flex; flex: 2; }
        .cd-impact-stat {
          flex: 1;
          text-align: center;
          padding: 0 20px;
          border-right: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .cd-impact-stat:last-child { border-right: none; }
        .cd-impact-value { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1; }
        .cd-impact-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.07em; }

        /* ════════════════════════════════
           RESPONSIVE
        ════════════════════════════════ */
        @media (max-width: 900px) {
          .cd-two-col {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .cd-stats-grid {
            /* 2 columns on medium-small screens */
            grid-template-columns: repeat(2, 1fr);
          }

          /* Impact bar: stack vertically */
          .cd-impact-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
            padding: 14px 16px;
          }
          .cd-impact-left {
            padding-right: 0;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            padding-bottom: 12px;
          }
          .cd-impact-stats { gap: 0; }
          .cd-impact-stat  { padding: 0 12px; }
        }

        @media (max-width: 480px) {
          .cd-stats-grid {
            /* Single column on very small phones */
            grid-template-columns: 1fr;
          }
          .cd-stat-card {
            flex-direction: row;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
          }
          /* Stat icon + text side by side, trend pushed right */
          .cd-stat-inner-row {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
          }
          .cd-stat-value { font-size: 24px; }
          .cd-stat-trend { margin-top: 0; margin-left: auto; }

          .cd-report-row { padding: 10px 12px; gap: 8px; }
          .cd-badge-row  { padding: 10px 12px; }

          .cd-impact-stats { flex-wrap: wrap; }
          .cd-impact-stat  {
            flex: 0 0 33.33%;
            border-right: none;
            padding: 6px 8px;
          }
        }
      `}</style>

      {/* ── Page header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#1a1e25",
              letterSpacing: "-0.02em",
            }}
          >
            Citizen Dashboard
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Help keep Brazzaville clean
          </p>
        </div>
        <button
          style={{
            background: "var(--green)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "inherit",
            letterSpacing: "0.02em",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
          onClick={() => navigate("/dashboard/citizen/report")}
        >
          <FileText size={13} />
          Report Waste
        </button>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          background: "#f7f8fa",
          border: "1px solid #dde1e7",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Stats row */}
        <div className="cd-stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div className="cd-stat-card" key={stat.label}>
                <div
                  className="cd-stat-inner-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <div
                    className="cd-stat-icon"
                    style={{
                      background: `linear-gradient(135deg, ${stat.gradFrom}, ${stat.gradTo})`,
                    }}
                  >
                    <Icon
                      size={20}
                      color="#fff"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <div className="cd-stat-label">
                      {stat.label}
                    </div>
                    <div className="cd-stat-value">
                      {stat.value}
                    </div>
                  </div>
                </div>
                <div
                  className={`cd-stat-trend ${stat.trendUp ? "up" : "down"}`}
                >
                  <TrendingUp size={12} />
                  {stat.trend} this month
                </div>
              </div>
            );
          })}
        </div>

        {/* Two-col: reports + badges */}
        <div className="cd-two-col">
          {/* Recent Reports */}
          <div className="cd-card">
            <div className="cd-card-header">
              <span className="cd-card-title">
                Recent Reports
              </span>
              <button
                className="cd-view-all"
                onClick={() =>
                  navigate("/dashboard/citizen/my-reports")
                }
              >
                View All →
              </button>
            </div>
            {displayReports.map((report) => {
              const s =
                statusConfig[report.status] ?? statusConfig.pending;
              return (
                <button
                  className="cd-report-row"
                  key={report.id}
                  onClick={() => {
                    if (report.id !== "—") {
                      navigate(
                        `/dashboard/citizen/my-reports?expand=${report.id}`,
                      );
                    }
                  }}
                  disabled={report.id === "—"}
                  aria-label={`Open report ${report.id} — ${report.type} waste at ${report.location}`}
                >
                  <div
                    className="cd-report-icon"
                    aria-hidden="true"
                  >
                    <Package size={14} />
                  </div>
                  <div>
                    <div className="cd-report-id">
                      {report.id}
                    </div>
                    <div className="cd-report-type">
                      {report.type} waste
                    </div>
                    <div className="cd-report-location">
                      <MapPin size={10} aria-hidden="true" />
                      {report.location}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      className="cd-status-pill"
                      style={{
                        color: s.color,
                        background: s.bg,
                      }}
                    >
                      {s.label}
                    </span>
                    <div className="cd-report-date">
                      {report.date}
                      {report.citizenAmount != null && (
                        <>
                          <br />
                          <span style={{ color: "var(--green)", fontWeight: 700 }}>
                            +{report.citizenAmount.toLocaleString("fr-CG")} XAF
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Badges */}
          <div
            className="cd-card"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div className="cd-card-header">
              <span className="cd-card-title">
                Environmental Badges
              </span>
            </div>
            <div style={{ flex: 1 }}>
              {badges.map((badge) => (
                <div
                  className="cd-badge-row"
                  key={badge.badgeKey}
                  style={{ opacity: badge.earned ? 1 : 0.45 }}
                >
                  <div
                    className="cd-badge-emoji"
                    aria-hidden="true"
                  >
                    {badge.icon}
                  </div>
                  <div>
                    <div className="cd-badge-name">
                      {badge.name}
                    </div>
                    <div className="cd-badge-desc">
                      {badge.description}
                      {badge.pointsReward > 0 && !badge.earned
                        ? ` (+${badge.pointsReward} pts)`
                        : ""}
                    </div>
                  </div>
                  <span
                    className="cd-badge-tag"
                    style={{
                      color: badge.earned
                        ? "var(--green)"
                        : "#9ca3af",
                    }}
                  >
                    {badge.earned ? "Earned" : `${badge.progress}%`}
                  </span>
                </div>
              ))}
            </div>
            <div className="cd-points-banner">
              <div>
                <div className="cd-points-value">
                  {balance.toLocaleString("fr-CG")} XAF
                </div>
                <div className="cd-points-label">
                  Balance
                </div>
              </div>
              <div className="cd-points-hint">
                {rewards?.nextBadge
                  ? `${rewards.nextBadge.remaining} more for ${rewards.nextBadge.name}`
                  : badges.every((b) => b.earned)
                    ? "All badges unlocked"
                    : "Earn badges by reporting waste"}
                {ecoPoints > 0 && (
                  <>
                    <br />
                    {ecoPoints} eco pts earned
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Impact bar */}
        <div className="cd-impact-bar">
          <div className="cd-impact-left">
            <div className="cd-impact-heading">
              Your Environmental Impact
            </div>
            <div className="cd-impact-sub">
              Thank you for keeping Brazzaville clean
            </div>
          </div>
          <div className="cd-impact-stats">
            {impact.map(({ value, label, icon: Icon }) => (
              <div className="cd-impact-stat" key={label}>
                <Icon
                  size={14}
                  color="var(--green)"
                  aria-hidden="true"
                />
                <div className="cd-impact-value">{value}</div>
                <div className="cd-impact-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}