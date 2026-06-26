import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  Calendar,
  TrendingUp,
  Recycle,
  Truck,
  Package,
} from "lucide-react";
import { AdminMobileBlock } from "../../components/AdminMobileBlock";
import {
  AdminService,
  type AnalyticsData,
} from "../../../services/adminService";

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminService.getAnalyticsData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const monthlyTrends = data?.monthlyTrends ?? [
    {
      month: "Jan",
      reported: 856,
      collected: 823,
      recycled: 654,
    },
    {
      month: "Feb",
      reported: 912,
      collected: 891,
      recycled: 702,
    },
    {
      month: "Mar",
      reported: 1034,
      collected: 998,
      recycled: 789,
    },
    {
      month: "Apr",
      reported: 1156,
      collected: 1124,
      recycled: 867,
    },
    {
      month: "May",
      reported: 1247,
      collected: 1198,
      recycled: 910,
    },
  ];

  const wasteByCategory = data?.wasteByCategory ?? [
    { name: "Plastic", value: 2340, color: "#3b82f6" },
    { name: "Organic", value: 1890, color: "#1cb97a" },
    { name: "Paper", value: 1234, color: "#f59e0b" },
    { name: "Glass", value: 987, color: "#8b5cf6" },
    { name: "Metal", value: 654, color: "#ef4444" },
    { name: "Electronic", value: 456, color: "#06b6d4" },
    { name: "Other", value: 345, color: "#9aa0ac" },
  ];

  const districtPerformance = data?.districtPerformance ?? [
    {
      district: "Poto-Poto",
      collection: 95,
      recycling: 78,
      efficiency: 92,
    },
    {
      district: "Moungali",
      collection: 88,
      recycling: 72,
      efficiency: 85,
    },
    {
      district: "Bacongo",
      collection: 91,
      recycling: 76,
      efficiency: 88,
    },
    {
      district: "Makélékélé",
      collection: 86,
      recycling: 69,
      efficiency: 82,
    },
    {
      district: "Ouenzé",
      collection: 82,
      recycling: 65,
      efficiency: 79,
    },
    {
      district: "Mfilou",
      collection: 79,
      recycling: 62,
      efficiency: 75,
    },
  ];

  const kpis = data?.kpis ?? [
    {
      label: "Collection Rate",
      value: "96.1%",
      pct: 96.1,
      color: "#1cb97a",
    },
    {
      label: "Recycling Rate",
      value: "76%",
      pct: 76,
      color: "#3b82f6",
    },
    {
      label: "Transformation Rate",
      value: "68%",
      pct: 68,
      color: "#8b5cf6",
    },
    {
      label: "Avg Response Time",
      value: "2.3 hrs",
      pct: 85,
      color: "#f97316",
    },
  ];

  const impact = [
    {
      value: data
        ? `${data.monthlyTrends.reduce((s, m) => s + m.collected, 0).toLocaleString()}`
        : "5,034",
      label: "Collections",
      icon: Package,
    },
    {
      value: kpis[1]?.value ?? "76%",
      label: "Recycling Rate",
      icon: Recycle,
    },
  ];

  const tooltipStyle = {
    background: "#fff",
    border: "1px solid #dde1e7",
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "Nunito Sans, sans-serif",
    fontWeight: 700,
    color: "#1a1e25",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  };

  const exportAnalyticsReport = () => {
    const lines: string[] = [
      "SmartWaste Analytics Report",
      `Generated,${new Date().toISOString()}`,
      "",
      "KPI,Value",
      ...kpis.map((k) => `${k.label},${k.value}`),
      "",
      "Month,Reported,Collected,Recycled",
      ...monthlyTrends.map(
        (m) => `${m.month},${m.reported},${m.collected},${m.recycled}`,
      ),
      "",
      "Category,Weight (kg)",
      ...wasteByCategory.map((c) => `${c.name},${c.value}`),
      "",
      "District,Collection %,Recycling %,Efficiency %",
      ...districtPerformance.map(
        (d) =>
          `${d.district},${d.collection},${d.recycling},${d.efficiency}`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartwaste-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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

        .an-body {
          background: #f7f8fa;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .an-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .an-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .an-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .an-card-subtitle {
          font-size: 11px;
          color: #9aa0ac;
          margin-top: 1px;
        }
        .an-card-body { padding: 14px 16px; }

        .an-two-col { display: grid; grid-template-columns: 1fr 300px; gap: 10px; }
        .an-three-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }

        /* KPI rows */
        .an-kpi-row {
          padding: 10px 16px;
          border-bottom: 1px solid #eef0f3;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .an-kpi-row:last-child { border-bottom: none; }
        .an-bar-track {
          height: 4px;
          background: #f0f2f5;
          border-radius: 2px;
          overflow: hidden;
        }
        .an-bar-fill { height: 100%; border-radius: 2px; }

        /* Impact bar */
        .an-impact-bar {
          background: #2c3340;
          border: 1px solid #1e242e;
          border-radius: 8px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 0;
        }
        .an-impact-left {
          flex: 1;
          padding-right: 24px;
          border-right: 1px solid #3e4a5c;
        }
        .an-impact-heading { font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 2px; }
        .an-impact-sub { font-size: 11px; color: #6b7a8f; }
        .an-impact-stats { display: flex; gap: 0; flex: 3; }
        .an-impact-stat {
          flex: 1;
          text-align: center;
          padding: 0 20px;
          border-right: 1px solid #3e4a5c;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .an-impact-stat:last-child { border-right: none; }
        .an-impact-value { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1; }
        .an-impact-label { font-size: 10.5px; font-weight: 700; color: #6b7a8f; text-transform: uppercase; letter-spacing: 0.07em; }

        /* Export buttons */
        .an-export-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid #eef0f3;
          cursor: pointer;
          transition: background 0.1s;
        }
        .an-export-row:last-child { border-bottom: none; }
        .an-export-row:hover { background: #f7f8fa; }

        /* Env impact cells */
        .an-env-cell {
          padding: 12px 16px;
          border-bottom: 1px solid #eef0f3;
          border-right: 1px solid #eef0f3;
        }

        /* Recharts tick override */
        .recharts-text { font-family: 'Nunito Sans', sans-serif !important; }

        .an-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 14px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .an-header-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        @media (max-width: 900px) {
          .an-two-col { grid-template-columns: 1fr; }
          .an-three-col { grid-template-columns: 1fr; }
        }
        @media (max-width: 700px) {
          .an-impact-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
            padding: 14px 16px;
          }
          .an-impact-left {
            padding-right: 0;
            border-right: none;
            border-bottom: 1px solid #3e4a5c;
            padding-bottom: 12px;
          }
          .an-impact-stats {
            flex-wrap: wrap;
            width: 100%;
          }
          .an-impact-stat {
            flex: 1 1 45%;
            min-width: 120px;
            padding: 8px 12px;
          }
        }
        @media (max-width: 480px) {
          .an-impact-stat {
            flex: 1 1 100%;
            border-right: none;
          }
          .an-header-actions { width: 100%; }
          .an-header-actions button { flex: 1; justify-content: center; }
        }
      `}</style>

      {/* Page header */}
      <div className="an-page-header">
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
            Analytics &amp; Reports
          </p>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Comprehensive waste management insights ·
            Brazzaville
          </p>
        </div>
        <div className="an-header-actions">
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: "1px solid #dde1e7",
              borderRadius: 6,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              color: "#4a5568",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.02em",
            }}
          >
            <Calendar size={13} /> Date Range
          </button>
          <button
            type="button"
            onClick={exportAnalyticsReport}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#1cb97a",
              border: "none",
              borderRadius: 6,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.02em",
            }}
          >
            <Download size={13} /> Export Report
          </button>
        </div>
      </div>

      <div className="an-body">
        {loading && (
          <p style={{ margin: 0, fontSize: 12, color: "#8a9099", textAlign: "center" }}>
            Loading analytics...
          </p>
        )}
        {/* ── Row 1: Monthly Trends + Waste Distribution ── */}
        <div className="an-two-col">
          {/* Line chart */}
          <div className="an-card">
            <div className="an-card-header">
              <div>
                <div className="an-card-title">
                  Monthly Trends
                </div>
                <div className="an-card-subtitle">
                  Reports, collections, and recycling — Jan to
                  May 2026
                </div>
              </div>
            </div>
            <div
              className="an-card-body"
              style={{ paddingTop: 12 }}
            >
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#eef0f3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 10.5,
                      fontFamily: "Nunito Sans",
                      fill: "#9aa0ac",
                      fontWeight: 600,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 10.5,
                      fontFamily: "Nunito Sans",
                      fill: "#9aa0ac",
                      fontWeight: 600,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{
                      stroke: "#eef0f3",
                      strokeWidth: 1,
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      fontFamily: "Nunito Sans",
                      fontWeight: 700,
                      paddingTop: 8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="reported"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Reported"
                  />
                  <Line
                    type="monotone"
                    dataKey="collected"
                    stroke="#1cb97a"
                    strokeWidth={2}
                    dot={false}
                    name="Collected"
                  />
                  <Line
                    type="monotone"
                    dataKey="recycled"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="Recycled"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie + legend */}
          <div className="an-card">
            <div className="an-card-header">
              <div>
                <div className="an-card-title">
                  Waste Distribution
                </div>
                <div className="an-card-subtitle">
                  By category (kg)
                </div>
              </div>
            </div>
            <div
              className="an-card-body"
              style={{ paddingTop: 8 }}
            >
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={wasteByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={62}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {wasteByCategory.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "5px 12px",
                  marginTop: 8,
                }}
              >
                {wasteByCategory.map((cat) => (
                  <div
                    key={cat.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: cat.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#6b7a8f",
                        flex: 1,
                      }}
                    >
                      {cat.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: "#1a1e25",
                      }}
                    >
                      {cat.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: District Performance bar chart ── */}
        <div className="an-card">
          <div className="an-card-header">
            <div>
              <div className="an-card-title">
                District Performance Comparison
              </div>
              <div className="an-card-subtitle">
                Collection, recycling, and efficiency rates (%)
              </div>
            </div>
          </div>
          <div
            className="an-card-body"
            style={{ paddingTop: 12 }}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={districtPerformance} barSize={16}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#eef0f3"
                  vertical={false}
                />
                <XAxis
                  dataKey="district"
                  tick={{
                    fontSize: 10.5,
                    fontFamily: "Nunito Sans",
                    fill: "#9aa0ac",
                    fontWeight: 600,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 10.5,
                    fontFamily: "Nunito Sans",
                    fill: "#9aa0ac",
                    fontWeight: 600,
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(28,185,122,0.05)" }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    fontFamily: "Nunito Sans",
                    fontWeight: 700,
                    paddingTop: 8,
                  }}
                />
                <Bar
                  dataKey="collection"
                  fill="#1cb97a"
                  radius={[4, 4, 0, 0]}
                  name="Collection %"
                />
                <Bar
                  dataKey="recycling"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Recycling %"
                />
                <Bar
                  dataKey="efficiency"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  name="Efficiency %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Row 3: KPIs + Environmental Impact + Export ── */}
        <div className="an-three-col">
          {/* KPIs */}
          <div className="an-card">
            <div className="an-card-header">
              <div className="an-card-title">
                Key Performance Indicators
              </div>
            </div>
            {kpis.map((kpi) => (
              <div className="an-kpi-row" key={kpi.label}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#4a5568",
                    }}
                  >
                    {kpi.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#1a1e25",
                    }}
                  >
                    {kpi.value}
                  </span>
                </div>
                <div className="an-bar-track">
                  <div
                    className="an-bar-fill"
                    style={{
                      width: `${kpi.pct}%`,
                      background: kpi.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Environmental impact */}
          <div className="an-card">
            <div className="an-card-header">
              <div className="an-card-title">
                Environmental Impact
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              }}
            >
              {[
                {
                  label: "Energy Saved",
                  value: "1,240 kWh",
                  trend: "+15% vs last month",
                  color: "#8b5cf6",
                  bg: "#f5f3ff",
                },
                {
                  label: "Recycling Rate",
                  value: kpis[1]?.value ?? "76%",
                  trend: "+3% vs last month",
                  color: "#f97316",
                  bg: "#fff7ed",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "14px 16px",
                    background: item.bg,
                    borderBottom: "1px solid #eef0f3",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 3px",
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#9aa0ac",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      margin: "0 0 3px",
                      fontSize: 20,
                      fontWeight: 800,
                      color: item.color,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                    }}
                  >
                    {item.value}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: item.color,
                      opacity: 0.75,
                    }}
                  >
                    {item.trend}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Export options */}
          <div className="an-card">
            <div className="an-card-header">
              <div className="an-card-title">
                Export Options
              </div>
            </div>
            {[
              {
                label: "PDF Report",
                desc: "Full analytics report",
              },
              {
                label: "Excel Spreadsheet",
                desc: "Raw data export",
              },
              { label: "CSV Data", desc: "Custom analysis" },
            ].map((opt) => (
              <div className="an-export-row" key={opt.label}>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#1a1e25",
                    }}
                  >
                    {opt.label}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      color: "#aab0bb",
                      fontWeight: 500,
                    }}
                  >
                    {opt.desc}
                  </p>
                </div>
                <Download size={13} color="#9aa0ac" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Impact bar ── */}
        <div className="an-impact-bar">
          <div className="an-impact-left">
            <div className="an-impact-heading">
              Environmental Impact
            </div>
            <div className="an-impact-sub">
              Republic of Congo · Brazzaville
            </div>
          </div>
          <div className="an-impact-stats">
            {impact.map(({ value, label, icon: Icon }) => (
              <div className="an-impact-stat" key={label}>
                <Icon size={14} color="#1cb97a" />
                <div className="an-impact-value">{value}</div>
                <div className="an-impact-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </AdminMobileBlock>
  );
}