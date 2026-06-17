import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Building2,
  Recycle,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  ArrowRight,
} from "lucide-react";

interface CompensationRecord {
  id: number;
  assignmentId: number;
  citizenId: number | null;
  collectorId: number | null;
  partnerId: number | null;
  materialType: string;
  weightKg: number;
  materialBreakdown: string;
  pricePerKg: number;
  grossAmount: number;
  vatPct: number;
  vatAmount: number;
  envLevyPct: number;
  envLevyAmount: number;
  netAmount: number;
  citizenPct: number;
  citizenAmount: number;
  collectorPct: number;
  collectorAmount: number;
  systemPct: number;
  systemAmount: number;
  compensatedAt: string;
  assignPartnerId?: number | null;
}

// Module-level constants — not recreated on every render
const STAT_GRADIENTS: Record<
  string,
  { from: string; to: string }
> = {
  violet: {
    from: "var(--violet-light, #9f86f7)",
    to: "var(--violet, #7c6be8)",
  },
  green: {
    from: "var(--green-light, #34d9a0)",
    to: "var(--green, #1cb97a)",
  },
  pink: {
    from: "var(--pink-light, #ff8cb8)",
    to: "var(--pink, #ff6b9d)",
  },
  cyan: {
    from: "var(--cyan-light, #5de8ef)",
    to: "var(--cyan, #34d9e0)",
  },
};

const recentActivity = [
  {
    id: "1",
    type: "collection",
    title: "Plastic waste collected",
    citizen: "Jean Mbemba",
    amount: "5.2kg",
    partner: "EcoRecycle Congo",
    compensation: "2,600 XAF",
    time: "2 hours ago",
    // links to the waste tab, highlights assignment RA-004
    navTab: "waste" as const,
    highlightId: "RA-004",
  },
  {
    id: "2",
    type: "compensation",
    title: "Payment processed",
    citizen: "Marie Kouka",
    amount: "8.5kg",
    compensation: "2,550 XAF",
    time: "5 hours ago",
    // links to the waste tab, highlights assignment RA-003
    navTab: "waste" as const,
    highlightId: "RA-003",
  },
  {
    id: "3",
    type: "partner",
    title: "New partner added",
    partner: "Electronic Waste Solutions",
    materials: "E-Waste, Batteries",
    time: "1 day ago",
    // links to the partners tab, highlights partner P-003
    navTab: "partners" as const,
    highlightId: "P-003",
  },
];

const activityIconMap = {
  collection: {
    icon: Package,
    color: "#1cb97a",
    bg: "#1cb97a15",
  },
  compensation: {
    icon: DollarSign,
    color: "#ff6b9d",
    bg: "#ff6b9d15",
  },
  partner: {
    icon: Building2,
    color: "#7c6be8",
    bg: "#7c6be815",
  },
};

export function RecyclingSupervisorDashboard() {
  const navigate = useNavigate();
  const [compensationMap, setCompensationMap] = useState<Record<number, CompensationRecord>>({});

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("http://localhost:8080/api/compensations", {
          credentials: "include",
        });
        if (!response.ok) return;
        const data: CompensationRecord[] = await response.json();
        const map: Record<number, CompensationRecord> = {};
        data.forEach((c) => { map[c.id] = c; });
        setCompensationMap(map);
      } catch (err) {
        console.error("[fetchCompensations] Error:", err);
      }
    })();
  }, []);

  // Build stats dynamically from compensation data
  const buildStats = () => {
    const partnerIds = new Set<number>();
    let totalWeightKg = 0;
    const citizenIds = new Set<number>();
    let totalCompensationXaf = 0;

    Object.values(compensationMap).forEach((comp) => {
      if (comp.partnerId != null) partnerIds.add(Number(comp.partnerId));
      totalWeightKg += comp.weightKg || 0;
      if (comp.citizenId != null) citizenIds.add(Number(comp.citizenId));
      if (comp.collectorId != null) citizenIds.add(Number(comp.collectorId));
      totalCompensationXaf += comp.netAmount || 0;
    });

    const activePartnersCount = partnerIds.size;
    const wasteRecycledLabel =
      totalWeightKg >= 1000
        ? (totalWeightKg / 1000).toFixed(1) + "t"
        : totalWeightKg.toFixed(1) + " kg";
    const pendingCompensationLabel =
      Object.values(compensationMap).length.toString();
    const citizensCount = citizenIds.size;

    return [
      {
        label: "Active Partners",
        value: activePartnersCount.toString(),
        icon: Building2,
        color: "violet",
        trend: activePartnersCount > 0 ? "+1 this month" : "0",
      },
      {
        label: "Waste Recycled",
        value: wasteRecycledLabel,
        icon: Recycle,
        color: "green",
        trend: totalWeightKg > 0 ? "+18% vs last month" : "0",
      },
      {
        label: "Pending Compensation",
        value: pendingCompensationLabel,
        icon: DollarSign,
        color: "pink",
        trend: totalCompensationXaf > 0 
          ? `${Math.round(totalCompensationXaf / 1000)}K XAF` 
          : "0 XAF",
      },
      {
        label: "Citizens Compensated",
        value: citizensCount.toString(),
        icon: Users,
        color: "cyan",
        trend: citizensCount > 0 ? "+8 this week" : "0",
      },
    ];
  };

  const stats = buildStats();

  function handleActivityClick(
    activity: (typeof recentActivity)[number],
  ) {
    navigate("/dashboard/supervisor/recycling/management", {
      state: {
        tab: activity.navTab,
        highlightId: activity.highlightId,
      },
    });
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

        /* ── Stats grid ── */
        .rsd-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 700px) {
          .rsd-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 400px) {
          .rsd-stats-grid { grid-template-columns: 1fr; }
        }

        .rsd-stat-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 10px 16px;
          display: flex;
          flex-direction: column;
        }
        .rsd-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 6px 16px rgba(0,0,0,0.13);
        }
        .rsd-stat-label { font-size: 12px; font-weight: 600; color: #9aa0ac; margin-bottom: 2px; }
        .rsd-stat-value { font-size: 28px; font-weight: 800; color: #1a1e25; letter-spacing: -0.04em; line-height: 1; }
        .rsd-stat-trend { font-size: 11px; font-weight: 700; color: #aab0bb; margin-top: 8px; }

        /* ── Card base ── */
        .rsd-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .rsd-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .rsd-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .rsd-card-subtitle { font-size: 11px; color: #9aa0ac; margin-top: 1px; }

        /* ── View-all link button ── */
        .rsd-link-btn {
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
        .rsd-link-btn:hover { opacity: 0.75; }
        .rsd-link-btn:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: 2px;
        }

        /* ── Activity rows ── */
        .rsd-activity-item {
          padding: 14px 16px;
          border-bottom: 1px solid #eef0f3;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          transition: background 0.1s;
          cursor: pointer;
          /* keyboard focus ring handled separately */
        }
        .rsd-activity-item:last-child { border-bottom: none; }
        .rsd-activity-item:hover { background: #eef9f4; }
        .rsd-activity-item:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: -2px;
          background: #eef9f4;
        }
        .rsd-activity-item:active { background: #d6f5e8; }

        /* Subtle "go" arrow shown on hover */
        .rsd-activity-arrow {
          display: flex;
          align-items: center;
          opacity: 0;
          transition: opacity 0.15s, transform 0.15s;
          color: var(--green, #1cb97a);
          flex-shrink: 0;
          align-self: center;
          transform: translateX(-4px);
        }
        .rsd-activity-item:hover .rsd-activity-arrow,
        .rsd-activity-item:focus-visible .rsd-activity-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .rsd-activity-icon {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .rsd-activity-title {
          font-size: 13px;
          font-weight: 700;
          color: #1a1e25;
          margin-bottom: 2px;
        }
        .rsd-activity-desc { font-size: 12px; color: #8a9099; }
        .rsd-activity-time {
          font-size: 11px;
          color: #aab0bb;
          margin-top: 4px;
          font-weight: 600;
        }

        /* ── CTA button ── */
        .rsd-cta-btn {
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
        .rsd-cta-btn:hover { opacity: 0.9; }
        .rsd-cta-btn:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: 2px;
        }

        @media (max-width: 480px) {
          .rsd-cta-btn { width: 100%; justify-content: center; }
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
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#1a1e25",
              letterSpacing: "-0.02em",
            }}
          >
            Recycling Supervisor Dashboard
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Manage partners, recyclable waste, and compensation
          </p>
        </div>
        <button
          className="rsd-cta-btn"
          onClick={() =>
            navigate(
              "/dashboard/supervisor/recycling/management",
            )
          }
        >
          <Recycle size={13} aria-hidden="true" />
          Manage Recycling
        </button>
      </div>

      {/* ── Body shell ── */}
      <div
        style={{
          background: "#f7f8fa",
          border: "1px solid #dde1e7",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Stats row */}
        <div
          className="rsd-stats-grid"
          role="list"
          aria-label="Summary statistics"
        >
          {stats.map((s) => {
            const Icon = s.icon;
            const grad = STAT_GRADIENTS[s.color];
            return (
              <div
                className="rsd-stat-card"
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
                  <div
                    className="rsd-stat-icon"
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                    }}
                  >
                    <Icon
                      size={20}
                      color="#fff"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <div className="rsd-stat-label">
                      {s.label}
                    </div>
                    <div className="rsd-stat-value">
                      {s.value}
                    </div>
                  </div>
                </div>
                <div className="rsd-stat-trend">{s.trend}</div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="rsd-card">
          <div className="rsd-card-header">
            <div>
              <div className="rsd-card-title">
                Recent Activity
              </div>
              <div className="rsd-card-subtitle">
                Click any row to open it in the management page
              </div>
            </div>
            <button
              className="rsd-link-btn"
              onClick={() =>
                navigate(
                  "/dashboard/supervisor/recycling/management",
                )
              }
            >
              View All{" "}
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          </div>

          {recentActivity.map((activity) => {
            const config =
              activityIconMap[
                activity.type as keyof typeof activityIconMap
              ];
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="rsd-activity-item"
                role="button"
                tabIndex={0}
                aria-label={`Open ${activity.title} in management page`}
                onClick={() => handleActivityClick(activity)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleActivityClick(activity);
                  }
                }}
              >
                <div
                  className="rsd-activity-icon"
                  aria-hidden="true"
                  style={{ background: config.bg }}
                >
                  <Icon
                    size={16}
                    color={config.color}
                    aria-hidden="true"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="rsd-activity-title">
                    {activity.title}
                  </div>
                  <div className="rsd-activity-desc">
                    {activity.type === "collection" && (
                      <>
                        {activity.citizen} · {activity.amount} ·{" "}
                        {activity.partner} ·{" "}
                        {activity.compensation}
                      </>
                    )}
                    {activity.type === "compensation" && (
                      <>
                        {activity.citizen} · {activity.amount} ·{" "}
                        {activity.compensation}
                      </>
                    )}
                    {activity.type === "partner" && (
                      <>
                        {activity.partner} ·{" "}
                        {activity.materials}
                      </>
                    )}
                  </div>
                  <div className="rsd-activity-time">
                    {activity.time}
                  </div>
                </div>
                {/* Hover arrow indicator */}
                <div
                  className="rsd-activity-arrow"
                  aria-hidden="true"
                >
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}