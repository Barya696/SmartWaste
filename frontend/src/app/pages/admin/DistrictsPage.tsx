import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  ChevronDown,
} from "lucide-react";
import { AdminMobileBlock } from "../../components/AdminMobileBlock";
import {
  AdminService,
  type DistrictSummary,
} from "../../../services/adminService";

interface ZoneRow {
  id: number;
  name: string;
  district: string;
  status: string;
  reportCount: number;
  lastCollection: string;
  collectorAssigned: string;
}

export function DistrictsPage() {
  const [activeTab, setActiveTab] = useState<
    "districts" | "zones"
  >("districts");
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [supervisorCount, setSupervisorCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ reports, users, assignments }, summaries] =
          await Promise.all([
            AdminService.fetchCoreData(),
            AdminService.getDistrictSummaries(),
          ]);
        setDistricts(summaries);
        setSupervisorCount(
          users.filter((u) => u.role === "SUPERVISOR").length,
        );
        setAssignmentCount(assignments.length);

        const locationMap = new Map<string, ZoneRow>();
        let zoneId = 1;
        for (const r of reports) {
          const key = `${r.district}::${r.location}`;
          const existing = locationMap.get(key);
          if (existing) {
            existing.reportCount += 1;
            if (new Date(r.updatedAt) > new Date(existing.lastCollection)) {
              existing.lastCollection = r.updatedAt;
            }
          } else {
            const collector = users.find(
              (u) =>
                u.role === "COLLECTOR" && u.district === r.district,
            );
            locationMap.set(key, {
              id: zoneId++,
              name: r.location,
              district: r.district,
              status: r.status === "completed" ? "active" : "active",
              reportCount: 1,
              lastCollection: r.updatedAt,
              collectorAssigned: collector
                ? `${collector.firstName ?? ""} ${collector.lastName ?? ""}`.trim() ||
                  collector.username
                : "Unassigned",
            });
          }
        }
        setZones(Array.from(locationMap.values()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    {
      label: "Total Districts",
      value: String(districts.length),
      trend: "across Brazzaville",
      icon: MapPin,
      gradFrom: "#60a5fa",
      gradTo: "#3b82f6",
    },
    {
      label: "Active Zones",
      value: String(zones.length),
      trend: "from report locations",
      icon: CheckCircle,
      gradFrom: "#34d9a0",
      gradTo: "#1cb97a",
    },
    {
      label: "Supervisors",
      value: String(supervisorCount),
      trend: "assigned",
      icon: Users,
      gradFrom: "#c084fc",
      gradTo: "#a855f7",
    },
    {
      label: "Assignments",
      value: String(assignmentCount),
      trend: "total tasks",
      icon: Calendar,
      gradFrom: "#fb923c",
      gradTo: "#f97316",
    },
  ];

  return (
    <AdminMobileBlock>
      <div
        style={{
          fontFamily:
            "'Nunito Sans', 'DM Sans', -apple-system, sans-serif",
        }}
      >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        .dp-body { background: #f7f8fa; border: 1px solid #dde1e7; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .dp-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .dp-stat-card { background: #fff; border: 1px solid #e8eaee; border-radius: 8px; padding: 10px 16px; display: flex; flex-direction: column; }
        .dp-stat-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 6px 16px rgba(0,0,0,0.13); }
        .dp-stat-label { font-size: 12px; font-weight: 600; color: #9aa0ac; margin-bottom: 2px; }
        .dp-stat-value { font-size: 30px; font-weight: 800; color: #1a1e25; letter-spacing: -0.04em; line-height: 1; }
        .dp-stat-trend { font-size: 11.5px; font-weight: 700; color: #1cb97a; margin-top: 8px; }

        .dp-tabs { display: flex; gap: 0; border-bottom: 1px solid #dde1e7; margin-bottom: 2px; }
        .dp-tab {
          padding: 9px 16px; font-size: 12.5px; font-weight: 700; cursor: pointer;
          background: none; border: none; font-family: inherit; color: #9aa0ac;
          position: relative; letter-spacing: 0.02em; transition: color 0.15s;
        }
        .dp-tab:hover { color: #1a1e25; }
        .dp-tab.active { color: #1a1e25; }
        .dp-tab.active::after {
          content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
          height: 2px; background: #1cb97a; border-radius: 2px 2px 0 0;
        }

        .dp-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden; }
        .dp-card-header {
          background: #f0f2f5; padding: 10px 16px; border-bottom: 1px solid #dde1e7;
          display: flex; align-items: center; justify-content: space-between;
        }
        .dp-card-title { font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em; }
        .dp-card-subtitle { font-size: 11px; color: #9aa0ac; margin-top: 1px; }
        .dp-count { font-size: 10.5px; font-weight: 800; background: #f0f2f5; color: #6b7a8f; padding: 3px 10px; border-radius: 4px; border: 1px solid #dde1e7; letter-spacing: 0.03em; }

        .dp-table { width: 100%; border-collapse: collapse; }
        .dp-th {
          padding: 8px 14px; text-align: left; font-size: 10.5px; font-weight: 800;
          color: #9aa0ac; letter-spacing: 0.06em; text-transform: uppercase;
          background: #f7f8fa; border-bottom: 1px solid #eef0f3;
        }
        .dp-tr { border-bottom: 1px solid #eef0f3; transition: background 0.1s; }
        .dp-tr:last-child { border-bottom: none; }
        .dp-tr:hover { background: #f7f9fc; }
        .dp-td { padding: 10px 14px; font-size: 12.5px; color: #1a1e25; vertical-align: middle; }

        .dp-action-btn {
          width: 26px; height: 26px; border-radius: 5px; border: 1px solid #dde1e7;
          background: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; transition: background 0.1s;
        }
        .dp-action-btn:hover { background: #f0f2f5; }

        .dp-btn-add {
          display: inline-flex; align-items: center; gap: 6px; background: #1cb97a;
          color: #fff; border: none; border-radius: 6px; padding: 8px 16px;
          font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          letter-spacing: 0.02em; transition: opacity 0.12s;
        }
        .dp-btn-add:hover { opacity: 0.87; }

        .dp-supervisor-pill {
          display: inline-flex; align-items: center;
          background: #f0f2f5; border-radius: 4px; padding: 2px 7px;
          font-size: 11px; font-weight: 700; color: #4a5568;
          margin: 2px 2px 0 0;
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
            Districts &amp; Zones Management
          </p>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Manage Brazzaville districts, zones, and collection
            schedules
          </p>
        </div>
        <button className="dp-btn-add">
          <Plus size={13} />
          {activeTab === "districts"
            ? "Add District"
            : "Add Zone"}
        </button>
      </div>

      {/* Stats */}
      <div
        className="dp-stats-grid"
        style={{ marginBottom: 4 }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className="dp-stat-card" key={stat.label}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 8,
                }}
              >
                <div
                  className="dp-stat-icon"
                  style={{
                    background: `linear-gradient(135deg, ${stat.gradFrom}, ${stat.gradTo})`,
                  }}
                >
                  <Icon
                    size={22}
                    color="#fff"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <div className="dp-stat-label">
                    {stat.label}
                  </div>
                  <div className="dp-stat-value">
                    {stat.value}
                  </div>
                </div>
              </div>
              <div className="dp-stat-trend">
                ↑ {stat.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="dp-tabs">
        <button
          className={`dp-tab${activeTab === "districts" ? " active" : ""}`}
          onClick={() => setActiveTab("districts")}
        >
          Districts
        </button>
        <button
          className={`dp-tab${activeTab === "zones" ? " active" : ""}`}
          onClick={() => setActiveTab("zones")}
        >
          Zones &amp; Schedules
        </button>
      </div>

      <div
        className="dp-body"
        style={{
          marginTop: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderTop: "none",
        }}
      >
        {activeTab === "districts" ? (
          <div className="dp-card">
            <div className="dp-card-header">
              <div>
                <div className="dp-card-title">
                  All Districts
                </div>
                <div className="dp-card-subtitle">
                  Operational areas across Brazzaville
                </div>
              </div>
              <span className="dp-count">
                {districts.length} districts
              </span>
            </div>
            {loading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#aab0bb" }}>
                Loading districts...
              </div>
            ) : (
            <table className="dp-table">
              <thead>
                <tr>
                  {[
                    "District",
                    "Reports",
                    "Completed",
                    "Supervisors",
                    "Collectors",
                    "Completion",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="dp-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {districts.map((d) => {
                  const isActive = d.reportCount > 0 || d.collectorsAssigned > 0;
                  const zoneCount = zones.filter((z) => z.district === d.name).length;
                  return (
                    <tr key={d.name} className="dp-tr">
                      <td className="dp-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <MapPin size={13} color="#1cb97a" />
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            {d.name}
                          </span>
                        </div>
                      </td>
                      <td
                        className="dp-td"
                        style={{
                          fontWeight: 600,
                          color: "#6b7a8f",
                          fontSize: 12,
                        }}
                      >
                        {d.reportCount}
                      </td>
                      <td className="dp-td">
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#1a1e25",
                          }}
                        >
                          {d.completedCount}
                        </span>
                      </td>
                      <td className="dp-td">
                        {d.supervisors.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                            }}
                          >
                            {d.supervisors.map((s, i) => (
                              <span
                                className="dp-supervisor-pill"
                                key={i}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: 11.5,
                              color: "#aab0bb",
                              fontStyle: "italic",
                              fontWeight: 500,
                            }}
                          >
                            No supervisor
                          </span>
                        )}
                      </td>
                      <td className="dp-td">
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 12.5,
                            color:
                              d.collectorsAssigned > 0
                                ? "#1a1e25"
                                : "#aab0bb",
                          }}
                        >
                          {d.collectorsAssigned}
                        </span>
                      </td>
                      <td className="dp-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "#6b7a8f",
                          }}
                        >
                          <Calendar size={11} color="#9aa0ac" />
                          {d.completionRate}% ({zoneCount} zones)
                        </div>
                      </td>
                      <td className="dp-td">
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11,
                            fontWeight: 800,
                            color: isActive
                              ? "#1cb97a"
                              : "#9aa0ac",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: isActive
                                ? "#1cb97a"
                                : "#9aa0ac",
                              display: "inline-block",
                            }}
                          />
                          {isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="dp-td">
                        <div
                          style={{ display: "flex", gap: 5 }}
                        >
                          <button className="dp-action-btn">
                            <Edit size={12} color="#3b82f6" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        ) : (
          <div className="dp-card">
            <div className="dp-card-header">
              <div>
                <div className="dp-card-title">
                  Zones &amp; Schedules
                </div>
                <div className="dp-card-subtitle">
                  Collection zones with assigned collectors
                </div>
              </div>
              <span className="dp-count">
                {zones.length} zones
              </span>
            </div>
            <table className="dp-table">
              <thead>
                <tr>
                  {[
                    "Location",
                    "District",
                    "Reports",
                    "Assigned Collector",
                    "Last Activity",
                    "Status",
                  ].map((h) => (
                    <th key={h} className="dp-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => {
                  const isActive = z.status === "active";
                  return (
                    <tr key={z.id} className="dp-tr">
                      <td
                        className="dp-td"
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {z.name}
                      </td>
                      <td className="dp-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#6b7a8f",
                          }}
                        >
                          <MapPin size={10} color="#aab0bb" />{" "}
                          {z.district}
                        </div>
                      </td>
                      <td
                        className="dp-td"
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {z.reportCount}
                      </td>
                      <td
                        className="dp-td"
                        style={{
                          fontWeight: 600,
                          fontSize: 12.5,
                        }}
                      >
                        {z.collectorAssigned}
                      </td>
                      <td
                        className="dp-td"
                        style={{
                          fontSize: 12,
                          color: "#6b7a8f",
                          fontWeight: 600,
                        }}
                      >
                        {new Date(z.lastCollection).toLocaleDateString()}
                      </td>
                      <td className="dp-td">
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11,
                            fontWeight: 800,
                            color: isActive
                              ? "#1cb97a"
                              : "#9aa0ac",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: isActive
                                ? "#1cb97a"
                                : "#9aa0ac",
                              display: "inline-block",
                            }}
                          />
                          {z.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </AdminMobileBlock>
  );
}