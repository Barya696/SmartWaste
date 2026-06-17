import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ClipboardList,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  MapPin,
  ArrowRight,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import {
  loadSupervisorDashboardData,
  type DashboardStat,
  type RecentActivityRow,
  type CollectorWorkload,
} from "../../../../services/supervisorWasteService";

// Fix #4/#5: CSS-variable-derived gradient tokens (with hex fallbacks)
const STAT_GRADIENTS: Record<
  string,
  { from: string; to: string }
> = {
  amber: {
    from: "var(--amber-light, #fb923c)",
    to: "var(--amber,  #f97316)",
  },
  green: {
    from: "var(--green-light, #34d9a0)",
    to: "var(--green,  #1cb97a)",
  },
  blue: {
    from: "var(--blue-light,  #60a5fa)",
    to: "var(--blue,   #3b82f6)",
  },
  lime: {
    from: "var(--lime-light,  #4ade80)",
    to: "var(--lime,   #16a34a)",
  },
};

const STAT_ICONS: Record<
  DashboardStat["color"],
  typeof Clock
> = {
  amber: Clock,
  green: ClipboardList,
  blue: TrendingUp,
  lime: CheckCircle2,
};

// Fix #6: CSS variables instead of hardcoded hex
const priorityStyle: Record<
  string,
  { label: string; color: string }
> = {
  critical: {
    label: "Critical",
    color: "var(--red,    #dc2626)",
  },
  high: { label: "High", color: "var(--orange, #b45309)" },
  medium: { label: "Medium", color: "var(--amber,  #d97706)" },
  low: { label: "Low", color: "var(--green,  #16a34a)" },
};

// Fix #7: CSS variables instead of hardcoded hex
const statusStyle: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "var(--amber, #d97706)" },
  assigned: {
    label: "Assigned",
    color: "var(--blue,  #2563eb)",
  },
  in_progress: {
    label: "In Progress",
    color: "var(--green, #1cb97a)",
  },
  completed: {
    label: "Completed",
    color: "var(--lime,  #16a34a)",
  },
};

export function WasteSupervisorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityRow[]>([]);
  const [collectorLoad, setCollectorLoad] = useState<CollectorWorkload[]>([]);
  const [criticalUnassigned, setCriticalUnassigned] = useState(0);
  const [criticalMessage, setCriticalMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await loadSupervisorDashboardData();
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
        setCollectorLoad(data.collectorLoad);
        setCriticalUnassigned(data.criticalUnassigned);
        setCriticalMessage(data.criticalMessage);
        setError(null);
      } catch (err) {
        console.error("Failed to load supervisor dashboard:", err);
        setError("Failed to load dashboard data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: 48,
          color: "#6b7a8f",
          fontFamily: "'Nunito Sans', sans-serif",
        }}
      >
        <Loader2 size={20} className="animate-spin" aria-hidden="true" />
        Loading dashboard…
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily:
          "'Nunito Sans', 'DM Sans', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        /* ── Body shell ── */
        .sd-body {
          background: #f7f8fa;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* ── Stats grid ── */
        .sd-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        /* Fix #2: responsive stat grid */
        @media (max-width: 700px) {
          .sd-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 400px) {
          .sd-stats-grid { grid-template-columns: 1fr; }
        }

        .sd-stat-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 10px 16px;
          display: flex;
          flex-direction: column;
        }
        .sd-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 6px 16px rgba(0,0,0,0.13);
        }
        .sd-stat-label { font-size: 12px; font-weight: 600; color: #9aa0ac; margin-bottom: 2px; }
        .sd-stat-value { font-size: 28px; font-weight: 800; color: #1a1e25; letter-spacing: -0.04em; line-height: 1; }
        .sd-stat-trend { font-size: 11px; font-weight: 700; color: #aab0bb; margin-top: 8px; }

        /* ── Two-col layout ── */
        .sd-two-col {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 10px;
        }
        /* Fix #3: responsive two-col */
        @media (max-width: 720px) {
          .sd-two-col { grid-template-columns: 1fr; }
        }

        /* ── Card base ── */
        .sd-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .sd-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sd-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .sd-card-subtitle {
          font-size: 11px;
          color: #9aa0ac;
          margin-top: 1px;
        }

        /* Fix #12/#17: link button focus ring + min-height */
        .sd-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: var(--green, #1cb97a);
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 4px 2px;
          letter-spacing: 0.02em;
          transition: opacity 0.1s;
          min-height: 32px;
          border-radius: 3px;
        }
        .sd-link-btn:hover { opacity: 0.75; }
        .sd-link-btn:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: 2px;
        }

        /* ── Table ── */
        .sd-table { width: 100%; border-collapse: collapse; }
        .sd-th {
          padding: 8px 14px;
          text-align: left;
          font-size: 10.5px;
          font-weight: 800;
          color: #9aa0ac;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: #f7f8fa;
          border-bottom: 1px solid #eef0f3;
        }
        /* Fix #24: bump table header font on mobile */
        @media (max-width: 640px) {
          .sd-th { font-size: 12px; }
          .sd-td { font-size: 13px !important; }
        }

        /* Fix #10: <tr> rows are not interactive — use a focusable inner wrapper approach;
           row itself gets no onClick; instead each row's first cell holds an
           accessible "open" button, OR we use tabIndex + onKeyDown on the tr.
           We use the tabIndex + role="row" approach for minimal DOM change. */
        .sd-tr {
          border-bottom: 1px solid #eef0f3;
          transition: background 0.1s;
          cursor: pointer;
        }
        .sd-tr:last-child { border-bottom: none; }
        .sd-tr:hover { background: #f0fdf9; }
        .sd-tr:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: -2px;
          background: #f0fdf9;
        }
        .sd-td { padding: 10px 14px; font-size: 12.5px; color: #1a1e25; }

        /* ── Labels ── */
        .sd-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }

        /* ── Collector workload ── */
        .sd-collector-row {
          padding: 11px 16px;
          border-bottom: 1px solid #eef0f3;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .sd-collector-row:last-child { border-bottom: none; }
        .sd-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10.5px;
          font-weight: 800;
          color: #6b7a8f;
          flex-shrink: 0;
        }
        .sd-bar-track {
          height: 4px;
          background: #f0f2f5;
          border-radius: 2px;
          overflow: hidden;
        }
        .sd-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s;
        }
        /* Fix #8: class-based bar colour instead of inline hardcoded hex */
        .sd-bar-fill--available { background: var(--green, #1cb97a); }
        .sd-bar-fill--busy      { background: var(--amber, #f59e0b); }

        /* Fix #10: collector status label colour via class */
        .sd-status-available { color: var(--green, #1cb97a); }
        .sd-status-busy      { color: var(--amber, #d97706); }

        /* Fix #13/#16: view-all button focus ring + min-height */
        .sd-view-all-btn {
          width: 100%;
          padding: 9px;
          border-radius: 7px;
          border: 1px dashed #dde1e7;
          background: transparent;
          font-size: 12.5px;
          font-weight: 700;
          color: #aab0bb;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.15s;
          min-height: 40px;
        }
        .sd-view-all-btn:hover { border-color: var(--green, #1cb97a); color: var(--green, #1cb97a); }
        .sd-view-all-btn:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: 2px;
          border-color: var(--green, #1cb97a);
          color: var(--green, #1cb97a);
        }

        /* ── CTA button ── Fix #14: min-height + focus ring */
        .sd-cta-btn {
          background: var(--green, #1cb97a);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          letter-spacing: 0.02em;
          min-height: 40px;
        }
        .sd-cta-btn:hover { opacity: 0.9; }
        .sd-cta-btn:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: 2px;
        }

        /* ── Alert banner ── */
        .sd-alert {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Fix #15: alert button min-height + focus ring */
        .sd-alert-btn {
          padding: 6px 14px;
          border-radius: 6px;
          background: var(--red, #dc2626);
          color: #fff;
          border: none;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          flex-shrink: 0;
          transition: opacity 0.1s;
          display: flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
        }
        .sd-alert-btn:hover { opacity: 0.88; }
        .sd-alert-btn:focus-visible {
          outline: 2px solid var(--red, #dc2626);
          outline-offset: 2px;
        }
      `}</style>

      {/* ── Page header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          {/* Fix #1: <h1> not <p> */}
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#1a1e25",
              letterSpacing: "-0.02em",
            }}
          >
            Supervisor Dashboard
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Brazzaville Operations ·{" "}
            {new Date().toLocaleDateString("fr-CG", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {/* Fix #14: min-height via .sd-cta-btn */}
        <button
          className="sd-cta-btn"
          onClick={() =>
            navigate("/dashboard/supervisor/waste/task-assignment")
          }
        >
          <ClipboardCheck size={13} aria-hidden="true" />
          Assign Tasks
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 10,
            fontSize: 12.5,
            fontWeight: 700,
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Body shell ── */}
      <div className="sd-body">
        {/* Stats row — Fix #23: role="list" semantics */}
        <div
          className="sd-stats-grid"
          role="list"
          aria-label="Summary statistics"
        >
          {stats.map((s) => {
            const Icon = STAT_ICONS[s.color];
            const grad = STAT_GRADIENTS[s.color];
            return (
              <div
                className="sd-stat-card"
                key={s.label}
                role="listitem"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  {/* Fix #5: gradient uses token map */}
                  <div
                    className="sd-stat-icon"
                    style={{
                      background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                    }}
                    aria-hidden="true"
                  >
                    {/* Fix #19: aria-hidden on decorative icon */}
                    <Icon
                      size={20}
                      color="#fff"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <div className="sd-stat-label">
                      {s.label}
                    </div>
                    <div className="sd-stat-value">
                      {s.value}
                    </div>
                  </div>
                </div>
                <div className="sd-stat-trend">{s.trend}</div>
              </div>
            );
          })}
        </div>

        {/* Two-col: reports table + collector workload */}
        <div className="sd-two-col">
          {/* Recent Reports table */}
          <div className="sd-card">
            <div className="sd-card-header">
              <div>
                <div className="sd-card-title">
                  Recent Reports
                </div>
                <div className="sd-card-subtitle">
                  Latest citizen submissions · click any row to
                  view details
                </div>
              </div>
              {/* Fix #12: focus ring on link btn */}
              <button
                className="sd-link-btn"
                onClick={() =>
                  navigate(
                    "/dashboard/supervisor/waste/task-assignment",
                  )
                }
              >
                Assign Tasks{" "}
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            </div>

            {/* Fix #21: aria-label on table */}
            <table
              className="sd-table"
              aria-label="Recent citizen reports"
            >
              <thead>
                <tr>
                  {[
                    "Report ID",
                    "Type",
                    "Location",
                    "Priority",
                    "Assigned To",
                    "Status",
                    "Time",
                  ].map((h) => (
                    <th key={h} className="sd-th" scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 && (
                  <tr>
                    <td
                      className="sd-td"
                      colSpan={7}
                      style={{ textAlign: "center", color: "#aab0bb" }}
                    >
                      No reports yet.
                    </td>
                  </tr>
                )}
                {recentActivity.map((row) => {
                  const p = priorityStyle[row.priority];
                  const s = statusStyle[row.status];
                  return (
                    // Fix #10: tabIndex + role + onKeyDown for keyboard accessibility
                    <tr
                      key={row.id}
                      className="sd-tr"
                      tabIndex={0}
                      role="row"
                      aria-label={`Report ${row.id}, ${row.type}, ${row.location}, ${p.label} priority, ${row.assignedTo ?? "unassigned"}, ${s.label}, ${row.time}`}
                      onClick={() =>
                        navigate(
                          "/dashboard/supervisor/waste/task-assignment",
                          {
                            state: { openReportId: row.id },
                          },
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" ||
                          e.key === " "
                        ) {
                          e.preventDefault();
                          navigate(
                            "/dashboard/supervisor/waste/task-assignment",
                            {
                              state: { openReportId: row.id },
                            },
                          );
                        }
                      }}
                    >
                      <td
                        className="sd-td"
                        style={{ fontWeight: 800 }}
                      >
                        {row.id}
                      </td>
                      <td
                        className="sd-td"
                        style={{ fontWeight: 600 }}
                      >
                        {row.type}
                      </td>
                      <td
                        className="sd-td"
                        style={{
                          fontSize: 11.5,
                          color: "#8a9099",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {/* Fix #18: aria-hidden on decorative MapPin */}
                          <MapPin
                            size={10}
                            color="#aab0bb"
                            aria-hidden="true"
                          />
                          {row.location}
                        </div>
                      </td>
                      <td className="sd-td">
                        {/* Fix #6: CSS variable colour */}
                        <span
                          className="sd-label"
                          style={{ color: p.color }}
                        >
                          {p.label}
                        </span>
                      </td>
                      <td className="sd-td">
                        {row.assignedTo ?? (
                          <span
                            style={{
                              color: "#aab0bb",
                              fontStyle: "italic",
                              fontSize: 11.5,
                            }}
                          >
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="sd-td">
                        {/* Fix #7: CSS variable colour */}
                        <span
                          className="sd-label"
                          style={{ color: s.color }}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td
                        className="sd-td"
                        style={{
                          fontSize: 11,
                          color: "#aab0bb",
                          fontWeight: 600,
                        }}
                      >
                        {row.time}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Collector Workload — Fix #22: <ul>/<li> semantics */}
          <div
            className="sd-card"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div className="sd-card-header">
              <div>
                <div className="sd-card-title">
                  Collector Workload
                </div>
                <div className="sd-card-subtitle">
                  Active assignments per agent
                </div>
              </div>
            </div>

            <ul
              aria-label="Collector workload"
              style={{
                flex: 1,
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {collectorLoad.length === 0 && (
                <li
                  className="sd-collector-row"
                  style={{ color: "#aab0bb", fontSize: 12.5 }}
                >
                  No collectors registered.
                </li>
              )}
              {collectorLoad.map((c) => {
                const total = c.active + c.completed || 1;
                const pct = Math.round(
                  (c.active / total) * 100,
                );
                const isAvailable = c.status === "available";
                return (
                  <li key={c.id} className="sd-collector-row">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
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
                          className="sd-avatar"
                          aria-hidden="true"
                        >
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "#1a1e25",
                            }}
                          >
                            {c.name}
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              color: "#aab0bb",
                              marginTop: 1,
                            }}
                          >
                            {c.active} active · {c.completed}{" "}
                            done
                          </div>
                        </div>
                      </div>
                      {/* Fix #10: class-based colour */}
                      <span
                        className={`sd-label ${isAvailable ? "sd-status-available" : "sd-status-busy"}`}
                      >
                        {isAvailable ? "Available" : "Busy"}
                      </span>
                    </div>

                    {/* Fix #8/#9: class-based colour + progressbar ARIA */}
                    <div
                      className="sd-bar-track"
                      role="progressbar"
                      aria-label={`${c.name} active workload`}
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`sd-bar-fill ${isAvailable ? "sd-bar-fill--available" : "sd-bar-fill--busy"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <div
              style={{
                padding: "10px 16px",
                borderTop: "1px solid #eef0f3",
              }}
            >
              {/* Fix #13/#16: focus ring + min-height */}
              <button
                className="sd-view-all-btn"
                onClick={() =>
                  navigate("/dashboard/supervisor/waste/collectors")
                }
              >
                {/* Fix #19: aria-hidden */}
                <Users size={13} aria-hidden="true" /> View All
                Collectors
              </button>
            </div>
          </div>
        </div>

        {criticalUnassigned > 0 && (
          <div className="sd-alert" role="alert">
            <AlertTriangle
              size={16}
              color="#dc2626"
              style={{ flexShrink: 0 }}
              aria-hidden="true"
            />
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: "#991b1b",
                }}
              >
                {criticalUnassigned} critical report
                {criticalUnassigned !== 1 ? "s are" : " is"} unassigned
              </span>
              {criticalMessage && (
                <span
                  style={{
                    fontSize: 12.5,
                    color: "#9f1239",
                    marginLeft: 6,
                  }}
                >
                  {criticalMessage}
                </span>
              )}
            </div>
            <button
              className="sd-alert-btn"
              onClick={() =>
                navigate("/dashboard/supervisor/waste/task-assignment")
              }
            >
              Assign Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}