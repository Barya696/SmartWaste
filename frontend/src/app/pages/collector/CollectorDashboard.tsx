import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  CheckCircle,
  Package,
  TrendingUp,
  Navigation2,
  DollarSign,
} from "lucide-react";
import { useRecycling, calcCollectorShare } from "../../context/RecyclingContext";
import { useAuth } from "../../context/AuthContext";

// Backend interfaces
interface BackendAssignment {
  id: number;
  reportId: number;
  collectorId: number;
  supervisorId: number;
  assignmentStatus: string;
  assignmentDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendReport {
  id: number;
  userId: number;
  category: string;
  district: string;
  location: string;
  description: string;
  quantity: string;
  photoUrl: string;
  trackingNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Stat gradient tokens mapped to CSS variables
const STAT_GRADIENTS: Record<
  string,
  { from: string; to: string }
> = {
  blue: {
    from: "var(--blue-light, #60a5fa)",
    to: "var(--blue,  #3b82f6)",
  },
  green: {
    from: "var(--green-light, #34d9a0)",
    to: "var(--green, #1cb97a)",
  },
  amber: {
    from: "var(--amber-light, #fb923c)",
    to: "var(--amber, #f97316)",
  },
  violet: {
    from: "var(--violet-light, #c084fc)",
    to: "var(--violet,#a855f7)",
  },
};


const urgentTasks = [
  {
    id: "SW-2026-0015",
    type: "Hazardous",
    location: "Poto-Poto, Avenue de la Paix",
    district: "Poto-Poto",
    priority: "high" as const,
    distance: "1.2 km",
    reportedBy: "Jean Mbemba",
  },
  {
    id: "SW-2026-0014",
    type: "Electronic",
    location: "Bacongo, Avenue Foch",
    district: "Bacongo",
    priority: "medium" as const,
    distance: "2.5 km",
    reportedBy: "Marie Kouka",
  },
  {
    id: "SW-2026-0013",
    type: "Plastic",
    location: "Moungali, Rue Mbochi",
    district: "Moungali",
    priority: "normal" as const,
    distance: "0.8 km",
    reportedBy: "Paul Makaya",
  },
];

// Fix #5: CSS variables instead of hardcoded hex
const priorityConfig = {
  high: { label: "High", color: "var(--red,  #dc2626)" },
  medium: { label: "Medium", color: "var(--amber, #b45309)" },
  normal: { label: "Normal", color: "var(--blue,  #1a5fa8)" },
};

// Fix #17: progressbar helper
function PerfBar({
  label,
  pct,
}: {
  label: string;
  pct: number;
}) {
  return (
    <div className="cd-perf-row">
      <span className="cd-perf-label">{label}</span>
      <div
        className="cd-perf-bar-wrap"
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="cd-perf-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="cd-perf-value">{pct}%</span>
    </div>
  );
}

export function CollectorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assignments } = useRecycling();
  const [urgentTasks, setUrgentTasks] = useState<
    Array<{
      id: string;
      type: string;
      location: string;
      distance: string;
      priority: keyof typeof priorityConfig;
    }>
  >([]);
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch assignments for this collector
  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;
      try {
        const assignResponse = await fetch(
          `http://localhost:8080/api/assignments/collector/${user.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
        if (!assignResponse.ok) return;
        const assigns: BackendAssignment[] = await assignResponse.json();

        const reportsResponse = await fetch("http://localhost:8080/api/reports", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!reportsResponse.ok) return;
        const reports: BackendReport[] = await reportsResponse.json();

        // Build urgent tasks list
        const tasks = assigns
          .map((a) => {
            const report = reports.find((r) => r.id === a.reportId);
            if (!report) return null;
            return {
              id: report.trackingNumber,
              type: report.category,
              location: report.location,
              district: report.district,
              priority: determinePriority(report.category),
              distance: "—",
              reportedBy: `User ${report.userId}`,
            };
          })
          .filter((t) => t !== null)
          .slice(0, 3);

        // Build route stops from urgent tasks
        const stops = tasks.map((t: any) => ({
          label: t.id,
          district: t.district,
          done: false,
        }));

        setUrgentTasks(tasks);
        setRouteStops(stops);
        setTotalAssigned(assigns.length);
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    }

    loadData();
  }, [user?.id]);

  function determinePriority(
    category: string
  ): "high" | "medium" | "normal" {
    const lower = category.toLowerCase();
    if (
      lower.includes("danger") ||
      lower.includes("hazard") ||
      lower.includes("medical")
    ) {
      return "high";
    }
    if (lower.includes("organic") || lower.includes("market")) {
      return "medium";
    }
    return "normal";
  }

  const myName = user?.name ?? "Pierre Ngouabi";

  const compensatedForMe = assignments.filter(
    (a) => a.status === "compensated" && a.collector === myName,
  );
  const totalEarned = compensatedForMe.reduce(
    (sum, a) => sum + calcCollectorShare(a),
    0,
  );

  const stats: Array<{
    label: string;
    value: string;
    trend: string;
    trendDir: "up" | "down" | "neutral";
    icon: typeof Package;
    color: keyof typeof STAT_GRADIENTS;
  }> = [
    {
      label: "Assigned Tasks",
      value: totalAssigned.toString(),
      trend: "+2",
      trendDir: "up" as const,
      icon: Package,
      color: "blue",
    },
    {
      label: "Completed Today",
      value: "5",
      trend: "+1",
      trendDir: "up" as const,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "Recycling Credits",
      value: totalEarned > 0 ? totalEarned.toLocaleString("fr-CG") + " XAF" : "0 XAF",
      trend: `+${compensatedForMe.length} paid`,
      trendDir: compensatedForMe.length > 0 ? ("up" as const) : ("neutral" as const),
      icon: DollarSign,
      color: "amber",
    },
    {
      label: "Total Collected",
      value: "47kg",
      trend: "+5kg",
      trendDir: "up" as const,
      icon: Truck,
      color: "violet",
    },
  ];

  return (
    <div
      style={{
        fontFamily:
          "'Nunito Sans', 'DM Sans', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        .cd-body {
          background: #f7f8fa;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* ── Stats ── */
        .cd-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        /* Fix #2: responsive stat grid */
        @media (max-width: 700px) {
          .cd-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 400px) {
          .cd-stats-grid { grid-template-columns: 1fr; }
        }

        .cd-stat-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 10px 16px;
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
          box-shadow: 0 6px 16px rgba(0,0,0,0.13);
        }
        .cd-stat-label {
          font-size: 12px;
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
        /* Fix #4 & #18: trend color is conditional, not always green */
        .cd-stat-trend {
          font-size: 11.5px;
          font-weight: 700;
          margin-top: 8px;
        }
        .cd-stat-trend--up      { color: var(--green, #1cb97a); }
        .cd-stat-trend--down    { color: var(--red,   #dc2626); }
        .cd-stat-trend--neutral { color: #9aa0ac; }

        /* ── Two-col layout ── */
        .cd-two-col {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 10px;
        }
        /* Fix #3: responsive two-col */
        @media (max-width: 680px) {
          .cd-two-col { grid-template-columns: 1fr; }
        }

        /* ── Card shell ── */
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

        /* Fix #11 & #13: view-all button focus ring + min-height */
        .cd-view-all {
          font-size: 11px;
          font-weight: 700;
          color: #1a5fa8;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 4px 0;
          letter-spacing: 0.02em;
          min-height: 32px;
          border-radius: 3px;
        }
        .cd-view-all:hover { text-decoration: underline; }
        .cd-view-all:focus-visible {
          outline: 2px solid var(--blue, #1a5fa8);
          outline-offset: 2px;
          text-decoration: underline;
        }

        /* ── Task rows ── Fix #10: <button> instead of <div onClick> ── */
        .cd-task-row {
          display: grid;
          grid-template-columns: 30px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border-bottom: 1px solid #eef0f3;
          cursor: pointer;
          transition: background 0.1s;
          width: 100%;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
          text-align: left;
          font-family: inherit;
        }
        .cd-task-row:last-child { border-bottom: none; }
        .cd-task-row:hover { background: #f7f9fc; }
        .cd-task-row:focus-visible {
          outline: 2px solid var(--blue, #1a5fa8);
          outline-offset: -2px;
          background: #f0f6ff;
        }

        .cd-task-icon {
          width: 30px;
          height: 30px;
          background: #f0f2f5;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7a8f;
          flex-shrink: 0;
        }
        .cd-task-id {
          font-size: 12.5px;
          font-weight: 800;
          color: #1a1e25;
          margin-bottom: 1px;
        }
        .cd-task-type { font-size: 11px; color: #8a9099; margin-bottom: 1px; }
        .cd-task-location {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          color: #aab0bb;
        }
        .cd-priority-label {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.03em;
          margin-top: 2px;
          display: block;
        }
        /* Fix #12: CTA button min-height */
        .cd-cta-btn {
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
        .cd-cta-btn:hover { opacity: 0.9; }
        .cd-cta-btn:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: 2px;
        }

        /* ── Route stops ── Fix #16: ol/li semantics applied via CSS ── */
        .cd-stop-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 16px;
          border-bottom: 1px solid #eef0f3;
          list-style: none;
        }
        .cd-stop-row:last-child { border-bottom: none; }
        .cd-stop-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .cd-stop-label { font-size: 12.5px; font-weight: 700; color: #1a1e25; }
        .cd-stop-district { font-size: 11px; color: #9aa0ac; margin-top: 1px; }

        /* ── Performance card ── Fix #8: use CSS var for dark surface ── */
        .cd-perf-card {
          background: var(--surface-dark, #2c3340);
          border: 1px solid var(--surface-darker, #1e242e);
          border-radius: 8px;
          padding: 14px 16px;
        }
        .cd-perf-heading {
          font-size: 10.5px;
          font-weight: 800;
          color: #6b7a8f;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 10px;
        }
        .cd-perf-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 0;
          border-bottom: 1px solid #3e4a5c;
        }
        .cd-perf-row:last-child { border-bottom: none; padding-bottom: 0; }
        .cd-perf-label { font-size: 11.5px; color: #6b7a8f; font-weight: 600; }
        .cd-perf-value { font-size: 12.5px; font-weight: 800; color: #fff; }
        .cd-perf-bar-wrap {
          height: 4px;
          background: #3e4a5c;
          border-radius: 999px;
          flex: 1;
          margin: 0 10px;
          overflow: hidden;
        }
        /* Fix #9: CSS variable for bar fill */
        .cd-perf-bar-fill {
          height: 100%;
          background: var(--green, #1cb97a);
          border-radius: 999px;
        }

        /* ── Route meta ── */
        .cd-route-meta {
          background: #f0f2f5;
          border-top: 1px solid #dde1e7;
          padding: 10px 16px;
          display: flex;
          justify-content: space-between;
        }
        .cd-meta-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #9aa0ac;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .cd-meta-value { font-size: 13px; font-weight: 800; color: #1a1e25; margin-top: 2px; }
      `}</style>

      {/* Fix #1: <h1> not <p> */}
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
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#1a1e25",
              letterSpacing: "-0.02em",
            }}
          >
            Collector Dashboard
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Manage your collection tasks
          </p>
        </div>
        {/* Fix #12: min-height + focus ring via .cd-cta-btn */}
        <button
          className="cd-cta-btn"
          onClick={() => navigate("/dashboard/collector/tasks")}
        >
          <Truck size={13} aria-hidden="true" />
          View All Tasks
        </button>
      </div>

      {/* Body */}
      <div className="cd-body">
        {/* Stats row */}
        <div
          className="cd-stats-grid"
          role="list"
          aria-label="Summary statistics"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            const grad = STAT_GRADIENTS[stat.color];
            // Fix #4/#18: trend arrow + colour based on direction
            const trendSymbol =
              stat.trendDir === "up"
                ? "↑"
                : stat.trendDir === "down"
                  ? "↓"
                  : "→";
            const trendClass =
              stat.trendDir === "up"
                ? "cd-stat-trend cd-stat-trend--up"
                : stat.trendDir === "down"
                  ? "cd-stat-trend cd-stat-trend--down"
                  : "cd-stat-trend cd-stat-trend--neutral";

            const isCredits = stat.label === "Recycling Credits";
            return (
              <div
                className="cd-stat-card"
                key={stat.label}
                role="listitem"
                onClick={
                  isCredits
                    ? () => navigate("/dashboard/collector/credits")
                    : undefined
                }
                style={
                  isCredits
                    ? { cursor: "pointer", outline: "none" }
                    : undefined
                }
                title={isCredits ? "View credits history" : undefined}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  {/* Fix #6/#7: gradient uses CSS-var-derived tokens */}
                  <div
                    className="cd-stat-icon"
                    style={{
                      background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                    }}
                    aria-hidden="true"
                  >
                    <Icon
                      size={20}
                      color="#fff"
                      strokeWidth={2}
                      aria-hidden="true"
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
                <div className={trendClass}>
                  {trendSymbol} {stat.trend}{isCredits ? "" : " today"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Two-col: tasks + sidebar */}
        <div className="cd-two-col">
          {/* Priority tasks */}
          <div className="cd-card">
            <div className="cd-card-header">
              <span className="cd-card-title">
                Priority Collection Tasks
              </span>
              {/* Fix #11: focus-visible on view-all */}
              <button
                className="cd-view-all"
                onClick={() =>
                  navigate("/dashboard/collector/tasks")
                }
              >
                View All →
              </button>
            </div>

            {/* Fix #10: <button> rows for keyboard accessibility */}
            {urgentTasks.map((task) => {
              const p = priorityConfig[task.priority];
              return (
                <button
                  key={task.id}
                  className="cd-task-row"
                  onClick={() =>
                    navigate("/dashboard/collector/tasks")
                  }
                  aria-label={`${task.id} — ${task.type} waste at ${task.location}, ${p.label} priority, ${task.distance} away`}
                >
                  <div
                    className="cd-task-icon"
                    aria-hidden="true"
                  >
                    <Package size={16} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="cd-task-id">{task.id}</div>
                    <div className="cd-task-type">
                      {task.type} waste
                    </div>
                    <div className="cd-task-location">
                      {/* Fix #14: aria-hidden on decorative icon */}
                      <MapPin size={10} aria-hidden="true" />
                      {task.location}
                    </div>
                    <span
                      className="cd-priority-label"
                      style={{ color: p.color }}
                    >
                      {p.label} priority
                    </span>
                  </div>
                  {/* Fix #20: single element instead of two <p> tags */}
                  <div
                    style={{
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: "#1a1e25",
                      }}
                    >
                      {task.distance}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 11,
                        color: "#aab0bb",
                        marginTop: 4,
                        fontWeight: 600,
                      }}
                    >
                      away
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sidebar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* Today's Route card */}
            <div className="cd-card">
              <div className="cd-card-header">
                <span className="cd-card-title">
                  Today's Route
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: "#dbeafe",
                    color: "#1e40af",
                    padding: "2px 8px",
                    borderRadius: 4,
                    letterSpacing: "0.03em",
                  }}
                  aria-label={`${routeStops.length} stops total`}
                >
                  {routeStops.length} stops
                </span>
              </div>

              {/* Fix #16: ordered list for route stops */}
              <ol
                aria-label="Route stops"
                style={{ margin: 0, padding: 0 }}
              >
                {routeStops.map((stop) => (
                  <li key={stop.label} className="cd-stop-row">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        className="cd-stop-dot"
                        aria-hidden="true"
                        style={{
                          background: stop.done
                            ? "var(--green, #1cb97a)"
                            : "#dde1e7",
                          border: stop.done
                            ? "none"
                            : "2px solid #aab0bb",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="cd-stop-label">
                        {stop.label}
                      </div>
                      <div className="cd-stop-district">
                        {stop.district}
                      </div>
                    </div>
                    {/* Fix #15: aria-hidden on decorative icon */}
                    <Navigation2
                      size={12}
                      color="#aab0bb"
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ol>

              <div className="cd-route-meta">
                <div>
                  <div className="cd-meta-label">Distance</div>
                  <div className="cd-meta-value">12.5 km</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="cd-meta-label">Est. Time</div>
                  <div className="cd-meta-value">3.5 hrs</div>
                </div>
              </div>
            </div>

            {/* Performance card */}
            <div className="cd-perf-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div className="cd-perf-heading">
                    Performance
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#fff",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Excellent
                  </p>
                </div>
                {/* Fix #14: aria-hidden on decorative icon */}
                <TrendingUp
                  size={20}
                  color="var(--green, #1cb97a)"
                  aria-hidden="true"
                />
              </div>

              {/* Fix #17: PerfBar component with ARIA progressbar role */}
              <PerfBar label="Completion Rate" pct={98} />
              <PerfBar label="On-Time" pct={95} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}