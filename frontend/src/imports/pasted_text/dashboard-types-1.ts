import {
  AreaChart,
  Area,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from "recharts";

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
const submissionsTrend: { t: number; v: number }[] = [
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

const sparkFlagged: number[] = [
  18, 22, 15, 28, 19, 11, 8, 24, 31, 26, 19, 28,
];
const sparkCleared: number[] = [
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
    label: "AI Model Performance",
    value: 94,
    color: "#1cb97a",
  },
  { label: "Analyst Workload", value: 68, color: "#f59e0b" },
  { label: "Queue Clearance", value: 85, color: "#1a5fa8" },
];

const activity: ActivityItem[] = [
  {
    action: "New submission received",
    actor: "john.doe@email.com",
    time: "2m ago",
    status: "pending",
  },
  {
    action: "Flagged as fraudulent",
    actor: "Sarah Chen",
    time: "15m ago",
    status: "flagged",
  },
  {
    action: "Case escalated",
    actor: "Mike Johnson",
    time: "1h ago",
    status: "escalated",
  },
  {
    action: "Cleared as legitimate",
    actor: "David Lee",
    time: "2h ago",
    status: "cleared",
  },
  {
    action: "Reported to FTC",
    actor: "Admin",
    time: "3h ago",
    status: "reported",
  },
];

const statusMeta: Record<string, StatusMeta> = {
  pending: { color: "#1a5fa8", label: "Pending" },
  flagged: { color: "#ef4444", label: "Flagged" },
  escalated: { color: "#f59e0b", label: "Escalated" },
  cleared: { color: "#1cb97a", label: "Cleared" },
  reported: { color: "#8b5cf6", label: "Reported" },
};

const expenseBars: number[] = [
  40, 55, 35, 65, 50, 75, 45, 70, 60, 80, 55, 85, 45, 75, 65,
  90, 50,
];
const profitBars: number[] = [
  30, 45, 55, 35, 60, 40, 70, 50, 65, 45, 80, 55, 75, 40, 85,
  60, 70,
];

const gauges: GaugeItem[] = [
  {
    label: "Server Load",
    sub: "Processing",
    val: 75,
    color: "#7c6be8",
    badges: [
      { t: "92%", c: "#1cb97a" },
      { t: "44%", c: "#8a9099" },
    ],
    spark: sparkFlagged,
    sc: "#7c6be8",
  },
  {
    label: "Disk Space",
    sub: "Storage",
    val: 79,
    color: "#00c8a0",
    badges: [
      { t: "74%", c: "#00c8a0" },
      { t: "3%", c: "#f59e0b" },
    ],
    spark: sparkCleared,
    sc: "#00c8a0",
  },
  {
    label: "Data TTF",
    sub: "Pending jobs",
    val: 23,
    color: "#378add",
    badges: [
      { t: "100k", c: "#555570" },
      { t: "10%", c: "#8a9099" },
    ],
    spark: sparkFlagged,
    sc: "#378add",
  },
  {
    label: "Temp",
    sub: "Avg celsius",
    val: 36,
    color: "#ff6b9d",
    badges: [
      { t: "134", c: "#ff6b9d" },
      { t: "40F", c: "#1cb97a" },
    ],
    spark: sparkResponse,
    sc: "#ff6b9d",
  },
];

const headerStats: HeaderStat[] = [
  {
    label: "Expenses",
    value: "$47,000",
    color: "#7c6be8",
    bars: expenseBars,
  },
  {
    label: "My Profits",
    value: "$38,500",
    color: "#ff6b9d",
    bars: profitBars,
  },
];

const liveStats: {
  label: string;
  val: string;
  color: string;
}[] = [
  { label: "Total This Month", val: "1,247", color: "#1a1e25" },
  { label: "Flagged", val: "423", color: "#ef4444" },
  { label: "Cleared", val: "782", color: "#1cb97a" },
  { label: "Avg Response", val: "2.4h", color: "#8b5cf6" },
];

const progressItems: ProgItem[] = [
  {
    name: "My Tasks",
    val: "130 / 500",
    pct: 26,
    color: "#555570",
  },
  {
    name: "Transferred",
    val: "440 TB",
    pct: 72,
    color: "#1cb97a",
  },
  {
    name: "Bugs Squashed",
    val: "77%",
    pct: 77,
    color: "#378add",
  },
  {
    name: "User Testing",
    val: "7 days",
    pct: 60,
    color: "#7c6be8",
  },
];

const statCells: StatCell[] = [
  { label: "Uptime", val: "99.9%", color: "#1cb97a" },
  { label: "Errors", val: "0.1%", color: "#ef4444" },
  { label: "Queue", val: "12", color: "#f59e0b" },
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
export function SystemOverview() {
  return (
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
      `}</style>

      {/* ── Top header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            <span style={{ fontWeight: 800 }}>Analytics</span>{" "}
            <span style={{ fontWeight: 300 }}>Dashboard</span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#8a9099",
              marginTop: 2,
            }}
          >
            JobShield · Live monitoring
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          {headerStats.map((s: HeaderStat) => (
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
          <span className="so-card-title">Live Feeds</span>
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
              {["Live Stats", "Revenue"].map(
                (t: string, i: number) => (
                  <div
                    key={t}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "4px 14px",
                      cursor: "pointer",
                      color: i === 0 ? "#7c6be8" : "#9a9ab0",
                      borderBottom:
                        i === 0
                          ? "2px solid #7c6be8"
                          : "2px solid transparent",
                    }}
                  >
                    {t}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="so-livefeed-body">
          <div className="so-livefeed-left">
            <div className="so-lf-meta">
              {liveStats.map((s) => (
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
                data={submissionsTrend}
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
                  formatter={(v: number) => [v, "Submissions"]}
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
          </div>

          <div className="so-livefeed-right">
            <div>
              {progressItems.map((p: ProgItem) => (
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
              <button className="so-action-btn">
                Generate PDF
              </button>
              <button className="so-action-btn">
                Report a Bug
              </button>
            </div>
          </div>
        </div>

        {/* Gauge row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            borderTop: "1px solid #f0f1f3",
          }}
        >
          {gauges.map((g: GaugeItem, idx: number) => (
            <div
              key={g.label}
              className="so-gauge-cell"
              style={{
                borderRight:
                  idx < 3 ? "1px solid #f0f1f3" : "none",
              }}
            >
              <div className="so-gauge-wrap">
                <Gauge
                  value={g.val}
                  color={g.color}
                  size={60}
                />
                <span className="so-gauge-num">{g.val}</span>
              </div>
              <div className="so-gauge-info">
                <div className="so-gauge-label">{g.label}</div>
                <div className="so-gauge-sublabel">{g.sub}</div>
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
            <span className="so-card-title">System Health</span>
            <span style={{ fontSize: 10, color: "#8a9099" }}>
              Live
            </span>
          </div>
          <div style={{ padding: "20px 20px 0" }}>
            {health.map((h: HealthItem) => (
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
            {statCells.map((s: StatCell) => (
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
          {activity.map((item: ActivityItem, i: number) => {
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
                  <div className="so-act-time">{item.time}</div>
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
  );
}