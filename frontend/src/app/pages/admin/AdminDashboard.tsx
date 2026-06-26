import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from "recharts";
import { AdminMobileBlock } from "../../components/AdminMobileBlock";
import {
  AdminService,
  type DashboardStats,
} from "../../../services/adminService";

/* ── Types ── */
interface SparkProps {
  data: number[];
  color: string;
}

interface GaugeProps {
  value: number;
  color: string;
  size?: number;
}

interface Badge {
  t: string;
  c: string;
}

interface GaugeItem {
  label: string;
  sub: string;
  val: number;
  color: string;
  badges: Badge[];
  spark: number[];
  sc: string;
}

interface HealthItem {
  label: string;
  value: number;
  color: string;
}

interface ActivityItem {
  action: string;
  actor: string;
  time: string;
  status: string;
}

interface StatusMeta {
  color: string;
  label: string;
}

interface HeaderStat {
  label: string;
  value: string;
  color: string;
  bars: number[];
}

interface MiniBarChartProps {
  values: number[];
  color: string;
}

interface ProgItem {
  name: string;
  val: string;
  pct: number;
  color: string;
}

interface StatCell {
  label: string;
  val: string;
  color: string;
}

/* ── Data ── */
const reportsTrend: { t: number; v: number }[] = [
  { t: 0, v: 38 },
  { t: 1, v: 45 },
  { t: 2, v: 42 },
  { t: 3, v: 55 },
  { t: 4, v: 49 },
  { t: 5, v: 61 },
  { t: 6, v: 58 },
  { t: 7, v: 67 },
  { t: 8, v: 63 },
  { t: 9, v: 72 },
  { t: 10, v: 69 },
  { t: 11, v: 78 },
  { t: 12, v: 74 },
  { t: 13, v: 82 },
  { t: 14, v: 79 },
  { t: 15, v: 88 },
  { t: 16, v: 84 },
  { t: 17, v: 91 },
  { t: 18, v: 86 },
  { t: 19, v: 94 },
  { t: 20, v: 89 },
  { t: 21, v: 97 },
  { t: 22, v: 92 },
  { t: 23, v: 101 },
];

const sparkPending: number[] = [
  18, 22, 15, 28, 19, 11, 8, 24, 31, 26, 19, 28,
];
const sparkCollected: number[] = [
  27, 30, 23, 33, 30, 17, 14, 29, 38, 32, 24, 34,
];
const sparkResponse: number[] = [
  3.2, 3.0, 2.8, 2.9, 2.6, 2.5, 2.7, 2.5, 2.4, 2.3, 2.4, 2.4,
];

const toSparkData = (
  arr: number[],
): { i: number; v: number }[] => arr.map((v, i) => ({ i, v }));

const health: HealthItem[] = [
  {
    label: "Collection Efficiency",
    value: 94,
    color: "#1cb97a",
  },
  { label: "Collector Workload", value: 68, color: "#f59e0b" },
  { label: "Container Capacity", value: 85, color: "#1a5fa8" },
];

const activity: ActivityItem[] = [
  {
    action: "New waste reported",
    actor: "Jean Mbemba (Poto-Poto)",
    time: "2m ago",
    status: "pending",
  },
  {
    action: "Collection completed",
    actor: "Pierre Ngouabi",
    time: "15m ago",
    status: "collected",
  },
  {
    action: "Container overflow alert",
    actor: "System Alert",
    time: "1h ago",
    status: "alert",
  },
  {
    action: "Recycling batch processed",
    actor: "Marie Kouka",
    time: "2h ago",
    status: "recycled",
  },
  {
    action: "Monthly report generated",
    actor: "Admin",
    time: "3h ago",
    status: "completed",
  },
];

const statusMeta: Record<string, StatusMeta> = {
  pending: { color: "#f59e0b", label: "Pending" },
  collected: { color: "#1cb97a", label: "Collected" },
  alert: { color: "#ef4444", label: "Alert" },
  recycled: { color: "#8b5cf6", label: "Recycled" },
  completed: { color: "#1a5fa8", label: "Completed" },
};

const wasteCollectedBars: number[] = [
  40, 55, 35, 65, 50, 75, 45, 70, 60, 80, 55, 85, 45, 75, 65,
  90, 50,
];
const recyclingBars: number[] = [
  30, 45, 55, 35, 60, 40, 70, 50, 65, 45, 80, 55, 75, 40, 85,
  60, 70,
];

const gauges: GaugeItem[] = [
  {
    label: "Collection Rate",
    sub: "Daily average",
    val: 92,
    color: "#7c6be8",
    badges: [
      { t: "96%", c: "#1cb97a" },
      { t: "+8%", c: "#8a9099" },
    ],
    spark: sparkCollected,
    sc: "#7c6be8",
  },
  {
    label: "Recycling Rate",
    sub: "Month to date",
    val: 76,
    color: "#00c8a0",
    badges: [
      { t: "76%", c: "#00c8a0" },
      { t: "+5%", c: "#f59e0b" },
    ],
    spark: sparkCollected,
    sc: "#00c8a0",
  },
  {
    label: "Response Time",
    sub: "Avg hours",
    val: 23,
    color: "#378add",
    badges: [
      { t: "2.3h", c: "#555570" },
      { t: "-12%", c: "#8a9099" },
    ],
    spark: sparkResponse,
    sc: "#378add",
  },
];

const headerStats: HeaderStat[] = [
  {
    label: "Waste Collected",
    value: "8,450 kg",
    color: "#7c6be8",
    bars: wasteCollectedBars,
  },
  {
    label: "Reports Today",
    value: "247",
    color: "#ff6b9d",
    bars: recyclingBars,
  },
];

const liveStats: {
  label: string;
  val: string;
  color: string;
}[] = [
  { label: "Total This Month", val: "1,247", color: "#1a1e25" },
  { label: "Pending", val: "142", color: "#f59e0b" },
  { label: "Collected", val: "982", color: "#1cb97a" },
  { label: "Recycled", val: "746", color: "#8b5cf6" },
];

const progressItems: ProgItem[] = [
  {
    name: "Poto-Poto",
    val: "95%",
    pct: 95,
    color: "#1cb97a",
  },
  {
    name: "Moungali",
    val: "88%",
    pct: 88,
    color: "#378add",
  },
  {
    name: "Bacongo",
    val: "91%",
    pct: 91,
    color: "#7c6be8",
  },
  {
    name: "Makélékélé",
    val: "82%",
    pct: 82,
    color: "#f59e0b",
  },
];

const statCells: StatCell[] = [
  { label: "Uptime", val: "99.8%", color: "#1cb97a" },
  { label: "Alerts", val: "3", color: "#f59e0b" },
  { label: "Active", val: "247", color: "#1a5fa8" },
];

/* ── Sub-components ── */
function Gauge({ value, color, size = 72 }: GaugeProps) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#f0f1f3"
        strokeWidth={7}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="butt"
      />
    </svg>
  );
}

function Spark({ data, color }: SparkProps) {
  const d = toSparkData(data);
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart
        data={d}
        margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
      >
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MiniBarChart({ values, color }: MiniBarChartProps) {
  const max = Math.max(...values);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
        height: 28,
      }}
    >
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: Math.round((v / max) * 22),
            background: color,
            opacity: 0.4 + 0.6 * (v / max),
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

/* ── Main export ── */
export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveFeedTab, setLiveFeedTab] = useState<"reports" | "districts">(
    "reports",
  );

  useEffect(() => {
    AdminService.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const headerStatsLive: HeaderStat[] = stats
    ? [
        {
          label: "Reports Today",
          value: String(stats.reportsToday),
          color: "#ff6b9d",
          bars: wasteCollectedBars,
        },
        {
          label: "Completed",
          value: String(stats.completedReports),
          color: "#7c6be8",
          bars: recyclingBars,
        },
      ]
    : headerStats;

  const liveStatsLive = stats
    ? [
        {
          label: "Total Reports",
          val: String(stats.totalReports),
          color: "#1a1e25",
        },
        {
          label: "Pending",
          val: String(stats.pendingReports),
          color: "#f59e0b",
        },
        {
          label: "Completed",
          val: String(stats.completedReports),
          color: "#1cb97a",
        },
      ]
    : liveStats;

  const progressItemsLive: ProgItem[] = stats?.districtProgress.length
    ? stats.districtProgress.map((d, i) => ({
        name: d.name,
        val: `${d.pct}%`,
        pct: d.pct,
        color: progressItems[i]?.color ?? "#1cb97a",
      }))
    : progressItems;

  const activityLive: ActivityItem[] = stats?.recentActivity.length
    ? stats.recentActivity
    : activity;

  const reportsTrendLive = stats?.trendData.length
    ? stats.trendData
    : reportsTrend;

  const gaugesLive: GaugeItem[] = stats
    ? [
        {
          ...gauges[0],
          val: stats.collectionRate,
          badges: [
            { t: `${stats.collectionRate}%`, c: "#1cb97a" },
            { t: `${stats.completedReports} done`, c: "#8a9099" },
          ],
        },
        {
          ...gauges[1],
          val: Math.min(
            100,
            Math.round(
              (stats.completedReports / Math.max(stats.totalReports, 1)) * 76,
            ),
          ),
        },
        gauges[2],
      ]
    : gauges;

  const statCellsLive: StatCell[] = stats
    ? [
        {
          label: "Active Users",
          val: String(stats.totalUsers),
          color: "#1cb97a",
        },
        {
          label: "Pending",
          val: String(stats.pendingReports),
          color: "#f59e0b",
        },
        {
          label: "Collectors",
          val: String(stats.collectors),
          color: "#1a5fa8",
        },
      ]
    : statCells;

  const healthLive: HealthItem[] = stats
    ? [
        {
          label: "Collection Efficiency",
          value: stats.collectionRate,
          color: "#1cb97a",
        },
        {
          label: "Collector Workload",
          value: Math.min(
            100,
            Math.round((stats.compensatedReports / Math.max(stats.collectors, 1)) * 20),
          ),
          color: "#f59e0b",
        },
        {
          label: "Report Completion",
          value: stats.collectionRate,
          color: "#1a5fa8",
        },
      ]
    : health;

  const exportDashboardPdf = () => {
    const rows = progressItemsLive
      .map(
        (d) =>
          `<tr><td>${d.name}</td><td>${d.val}</td><td>${d.pct}%</td></tr>`,
      )
      .join("");
    const activityRows = activityLive
      .map(
        (a) =>
          `<tr><td>${a.action}</td><td>${a.actor}</td><td>${a.time}</td><td>${a.status}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><title>SmartWaste Dashboard Report</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#1a1e25}
      h1{font-size:20px;margin:0 0 4px}p{color:#666;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f0f2f5}
      </style></head><body>
      <h1>SmartWaste Admin Dashboard</h1>
      <p>Generated ${new Date().toLocaleString()}</p>
      <h2>Summary</h2>
      <ul>${liveStatsLive.map((s) => `<li><strong>${s.label}:</strong> ${s.val}</li>`).join("")}</ul>
      <h2>District Performance</h2>
      <table><thead><tr><th>District</th><th>Rate</th><th>Progress</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>Recent Activity</h2>
      <table><thead><tr><th>Action</th><th>Actor</th><th>Time</th><th>Status</th></tr></thead><tbody>${activityRows}</tbody></table>
      </body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const viewDistrictMap = () => {
    window.open(
      "https://www.openstreetmap.org/#map=12/-4.2634/15.2429",
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <AdminMobileBlock>
      <div
        style={{
          fontFamily:
            "'Nunito Sans', 'DM Sans', -apple-system, sans-serif",
          background: "#f5f6f8",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&display=swap');

        .so-card {
          background: #fff;
          border: 1px solid #e8eaed;
          border-radius: 12px;
          overflow: hidden;
        }
        .so-card-header {
          padding: 14px 20px 12px;
          border-bottom: 1px solid #f0f1f3;
          display: flex; align-items: center; gap: 10px;
        }
        .so-card-title {
          font-size: 14px; font-weight: 700;
          color: #1a1e25; letter-spacing: -0.01em;
          flex: 1;
        }
        .so-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

        .so-lf-meta { padding: 14px 20px 0; display: flex; gap: 32px; }
        .so-lf-stat-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #8a9099; margin-bottom: 3px;
        }
        .so-lf-stat-val {
          font-size: 26px; font-weight: 800;
          letter-spacing: -0.03em; line-height: 1;
        }

        .so-gauge-cell {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 12px;
          border-right: 1px solid #f0f1f3;
          min-width: 0; overflow: hidden;
        }
        .so-gauge-cell:last-child { border-right: none; }
        .so-gauge-wrap {
          position: relative; width: 60px; height: 60px;
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .so-gauge-num {
          position: absolute; font-size: 13px; font-weight: 800;
          color: #1a1e25; letter-spacing: -0.02em;
        }
        .so-gauge-info { flex: 1; min-width: 0; }
        .so-gauge-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase;
          color: #8a9099; margin-bottom: 3px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .so-gauge-sublabel {
          font-size: 10.5px; color: #8a9099;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .so-gauge-badges { display: flex; gap: 4px; margin-top: 5px; flex-wrap: wrap; }
        .so-badge {
          font-size: 9px; font-weight: 700; padding: 2px 5px;
          letter-spacing: 0.03em; white-space: nowrap; border-radius: 3px;
        }
        .so-gauge-spark { flex-shrink: 0; width: 68px; height: 36px; }

        .so-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .so-health-track { height: 6px; background: #f0f1f3; border-radius: 3px; margin-top: 6px; overflow: hidden; }
        .so-health-fill  { height: 6px; border-radius: 3px; }

        .so-stat-grid { display: flex; gap: 0; border-top: 1px solid #f0f1f3; }
        .so-stat-cell { flex: 1; padding: 14px 16px; border-right: 1px solid #f0f1f3; }
        .so-stat-cell:last-child { border-right: none; }
        .so-stat-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #8a9099; margin-bottom: 4px;
        }
        .so-stat-val { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }

        .so-act-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 20px; border-bottom: 1px solid #f8f9fa;
        }
        .so-act-row:last-child { border-bottom: none; }
        .so-act-dot   { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .so-act-action { font-size: 13px; font-weight: 600; color: #1a1e25; }
        .so-act-actor  { font-size: 11px; color: #8a9099; margin-top: 2px; }
        .so-act-right  { margin-left: auto; text-align: right; flex-shrink: 0; }
        .so-act-time   { font-size: 11px; color: #b0b5bc; }
        .so-act-badge  {
          font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
          padding: 3px 8px; display: inline-block; margin-top: 4px;
          text-transform: uppercase; border-radius: 4px; border: 1px solid currentColor;
        }

        .so-livefeed-body { display: flex; }
        .so-livefeed-left { flex: 1; min-width: 0; }
        .so-livefeed-right {
          width: 210px; border-left: 1px solid #f0f1f3;
          padding: 18px 20px; display: flex; flex-direction: column; justify-content: space-between;
        }
        .so-prog-label { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
        .so-prog-name  { color: #555570; font-weight: 500; }
        .so-prog-track { height: 5px; background: #f0f0f8; border-radius: 3px; overflow: hidden; margin-bottom: 14px; }
        .so-prog-fill  { height: 5px; border-radius: 3px; }
        .so-action-btn-row { display: flex; gap: 8px; margin-top: 4px; }
        .so-action-btn {
          flex: 1; font-size: 11px; font-weight: 600; color: #555570;
          background: #f4f4f9; border: 1px solid #e8e8f4; border-radius: 7px;
          padding: 8px 6px; text-align: center; cursor: pointer; font-family: inherit;
        }
        .so-action-btn:hover { background: #ededf8; }

        @media (max-width: 1024px) {
          .so-bottom { grid-template-columns: 1fr; }
          .so-livefeed-body { flex-direction: column; }
          .so-livefeed-right { width: 100%; border-left: none; border-top: 1px solid #f0f1f3; }
        }

        @media (max-width: 768px) {
          .so-lf-meta { flex-wrap: wrap; gap: 16px; }
          .so-gauge-cell { min-width: 100%; border-right: none !important; border-bottom: 1px solid #f0f1f3; }
          .so-gauge-cell:last-child { border-bottom: none; }
        }
      `}</style>

        {loading && (
          <div
            style={{
              fontSize: 12,
              color: "#8a9099",
              textAlign: "center",
              padding: "4px 0",
            }}
          >
            Loading live data...
          </div>
        )}

        {/* ── Top header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 300,
                color: "#1a1e25",
                letterSpacing: "-0.02em",
              }}
            >
              <span style={{ fontWeight: 800 }}>
                SmartWaste
              </span>{" "}
              <span style={{ fontWeight: 300 }}>Dashboard</span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#8a9099",
                marginTop: 2,
              }}
            >
              ParkCactive · Brazzaville, Republic of Congo
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {headerStatsLive.map((s: HeaderStat) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#8a9099",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: s.color,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.1,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
                <MiniBarChart values={s.bars} color={s.color} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Live Feed card ── */}
        <div className="so-card">
          <div className="so-card-header">
            <span
              className="so-dot"
              style={{ background: "#1cb97a" }}
            />
            <span className="so-card-title">
              Live Operations
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  background: "#ff6b9d",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="12"
                  height="14"
                  viewBox="0 0 12 14"
                  fill="none"
                >
                  <rect
                    x="2"
                    y="5.5"
                    width="8"
                    height="7"
                    rx="1.5"
                    fill="white"
                    opacity="0.9"
                  />
                  <path
                    d="M3.5 5.5V4a2.5 2.5 0 015 0v1.5"
                    stroke="white"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div style={{ display: "flex" }}>
                {(
                  [
                    { id: "reports" as const, label: "Waste Reports" },
                    { id: "districts" as const, label: "Districts" },
                  ]
                ).map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setLiveFeedTab(tab.id)}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 14px",
                        cursor: "pointer",
                        color:
                          liveFeedTab === tab.id ? "#7c6be8" : "#9a9ab0",
                        borderBottom:
                          liveFeedTab === tab.id
                            ? "2px solid #7c6be8"
                            : "2px solid transparent",
                        background: "none",
                        borderTop: "none",
                        borderLeft: "none",
                        borderRight: "none",
                        fontFamily: "inherit",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="so-livefeed-body">
            <div className="so-livefeed-left">
              {liveFeedTab === "reports" ? (
                <>
              <div className="so-lf-meta">
                {liveStatsLive.map((s) => (
                  <div key={s.label}>
                    <div className="so-lf-stat-label">
                      {s.label}
                    </div>
                    <div
                      className="so-lf-stat-val"
                      style={{ color: s.color }}
                    >
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart
                  data={reportsTrendLive}
                  margin={{
                    top: 16,
                    right: 0,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="areaGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#7c6be8"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="#7c6be8"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      background: "#1a1e25",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ display: "none" }}
                    formatter={(v: number) => [v, "Reports"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#7c6be8"
                    strokeWidth={2}
                    fill="url(#areaGrad)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: "#7c6be8",
                      strokeWidth: 0,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "2px 10px 10px",
                  fontSize: 10,
                  color: "#c0c0d0",
                }}
              >
                {[0, 25, 50, 75, 100, 125, 150, 175].map(
                  (n: number) => (
                    <span key={n}>{n}</span>
                  ),
                )}
              </div>
                </>
              ) : (
                <div style={{ padding: "12px 16px" }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#8a9099",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 12,
                    }}
                  >
                    District completion rates
                  </div>
                  {progressItemsLive.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#aab0bb", margin: 0 }}>
                      No district data yet.
                    </p>
                  ) : (
                    progressItemsLive.map((d) => (
                      <div key={d.name} style={{ marginBottom: 14 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            fontWeight: 700,
                            marginBottom: 6,
                          }}
                        >
                          <span>{d.name}</span>
                          <span>{d.val}</span>
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: "#f0f1f3",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${d.pct}%`,
                              height: "100%",
                              background: d.color,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    className="so-action-btn"
                    style={{ marginTop: 8, width: "100%" }}
                    onClick={() => navigate("/dashboard/admin/districts")}
                  >
                    Manage Districts
                  </button>
                </div>
              )}
            </div>

            <div className="so-livefeed-right">
              <div>
                {progressItemsLive.map((p: ProgItem) => (
                  <div key={p.name}>
                    <div className="so-prog-label">
                      <span className="so-prog-name">
                        {p.name}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          color: "#1a1e25",
                        }}
                      >
                        {p.val}
                      </span>
                    </div>
                    <div className="so-prog-track">
                      <div
                        className="so-prog-fill"
                        style={{
                          width: `${p.pct}%`,
                          background: p.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="so-action-btn-row">
                <button
                  type="button"
                  className="so-action-btn"
                  onClick={exportDashboardPdf}
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  className="so-action-btn"
                  onClick={viewDistrictMap}
                >
                  View Map
                </button>
              </div>
            </div>
          </div>

          {/* Gauge row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              borderTop: "1px solid #f0f1f3",
            }}
          >
            {gaugesLive.map((g: GaugeItem) => (
              <div key={g.label} className="so-gauge-cell">
                <div className="so-gauge-wrap">
                  <Gauge
                    value={g.val}
                    color={g.color}
                    size={60}
                  />
                  <span className="so-gauge-num">{g.val}</span>
                </div>
                <div className="so-gauge-info">
                  <div className="so-gauge-label">
                    {g.label}
                  </div>
                  <div className="so-gauge-sublabel">
                    {g.sub}
                  </div>
                  <div className="so-gauge-badges">
                    {g.badges.map((b: Badge) => (
                      <span
                        key={b.t}
                        className="so-badge"
                        style={{
                          background: b.c + "18",
                          color: b.c,
                        }}
                      >
                        {b.t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="so-gauge-spark">
                  <Spark data={g.spark} color={g.sc} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom: System Health + Recent Activity ── */}
        <div className="so-bottom">
          {/* System Health */}
          <div className="so-card">
            <div className="so-card-header">
              <span
                className="so-dot"
                style={{ background: "#1cb97a" }}
              />
              <span
                className="so-dot"
                style={{ background: "#f59e0b" }}
              />
              <span
                className="so-dot"
                style={{ background: "#ef4444" }}
              />
              <span className="so-card-title">
                System Health
              </span>
              <span style={{ fontSize: 10, color: "#8a9099" }}>
                Live
              </span>
            </div>
            <div style={{ padding: "20px 20px 0" }}>
              {healthLive.map((h: HealthItem) => (
                <div key={h.label} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "#4a5568",
                        fontWeight: 500,
                      }}
                    >
                      {h.label}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: h.color,
                      }}
                    >
                      {h.value}%
                    </span>
                  </div>
                  <div className="so-health-track">
                    <div
                      className="so-health-fill"
                      style={{
                        width: `${h.value}%`,
                        background: h.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="so-stat-grid">
              {statCellsLive.map((s: StatCell) => (
                <div key={s.label} className="so-stat-cell">
                  <div className="so-stat-label">{s.label}</div>
                  <div
                    className="so-stat-val"
                    style={{ color: s.color }}
                  >
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="so-card">
            <div className="so-card-header">
              <span
                className="so-dot"
                style={{ background: "#1a5fa8" }}
              />
              <span
                className="so-dot"
                style={{ background: "#ef4444" }}
              />
              <span
                className="so-dot"
                style={{ background: "#1cb97a" }}
              />
              <span className="so-card-title">
                Recent Activity
              </span>
              <span style={{ fontSize: 10, color: "#8a9099" }}>
                Last 3 hours
              </span>
            </div>
            {activityLive.map((item: ActivityItem, i: number) => {
              const meta: StatusMeta = statusMeta[item.status];
              return (
                <div key={i} className="so-act-row">
                  <span
                    className="so-act-dot"
                    style={{ background: meta.color }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="so-act-action">
                      {item.action}
                    </div>
                    <div className="so-act-actor">
                      {item.actor}
                    </div>
                  </div>
                  <div className="so-act-right">
                    <div className="so-act-time">
                      {item.time}
                    </div>
                    <span
                      className="so-act-badge"
                      style={{
                        color: meta.color,
                        borderColor: meta.color + "55",
                        background: meta.color + "10",
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminMobileBlock>
  );
}