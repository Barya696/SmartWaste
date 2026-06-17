import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  ChevronDown,
  Edit2,
  Package,
} from "lucide-react";
import { AdminMobileBlock } from "../../components/AdminMobileBlock";
import {
  AdminService,
  type AdminReportRow,
  backendStatus,
  BRAZZAVILLE_DISTRICTS,
  isCompletedLifecycleStatus,
} from "../../../services/adminService";
import { WasteService } from "../../../services/wasteService";

export function ReportsManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusEditId, setStatusEditId] = useState<number | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await AdminService.getReportRows();
      setReports(rows);
    } catch (err) {
      setError("Failed to load reports. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const stats = [
    {
      label: "All Reports",
      value: String(reports.length),
      trend: `${reports.length} total`,
      icon: FileText,
      gradFrom: "#60a5fa",
      gradTo: "#3b82f6",
    },
    {
      label: "Pending",
      value: String(reports.filter((r) => r.status === "pending").length),
      trend: "awaiting action",
      icon: Clock,
      gradFrom: "#fb923c",
      gradTo: "#f97316",
    },
    {
      label: "Completed",
      value: String(
        reports.filter((r) => isCompletedLifecycleStatus(r.status)).length,
      ),
      trend: "COMPLETED + RECYCLED + COMPENSATED",
      icon: CheckCircle,
      gradFrom: "#34d9a0",
      gradTo: "#1cb97a",
    },
  ];

  const priorityStyle: Record<
    string,
    { text: string; bg: string; border: string }
  > = {
    critical: {
      text: "#991b1b",
      bg: "#fff1f2",
      border: "#fca5a5",
    },
    high: { text: "#92400e", bg: "#fffbeb", border: "#fcd34d" },
    medium: {
      text: "#854d0e",
      bg: "#fefce8",
      border: "#fde047",
    },
    low: { text: "#065f46", bg: "#f0fdf4", border: "#6ee7b7" },
  };

  const statusStyle: Record<
    string,
    { text: string; bg: string }
  > = {
    pending: { text: "#92400e", bg: "#fffbeb" },
    "in-progress": { text: "#7c3aed", bg: "#f5f3ff" },
    compensated: { text: "#1e40af", bg: "#eff6ff" },
    recycled: { text: "#065f46", bg: "#ecfdf5" },
    completed: { text: "#065f46", bg: "#f0fdf4" },
    rejected: { text: "#991b1b", bg: "#fff1f2" },
  };

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    "in-progress": "In Progress",
    compensated: "Compensated",
    recycled: "Recycled",
    completed: "Completed",
    rejected: "Rejected",
  };

  const handleStatusChange = async (
    reportId: number,
    newStatus: string,
  ) => {
    if (newStatus === "compensated" || newStatus === "recycled") return;
    try {
      await WasteService.updateReportStatus(
        reportId,
        backendStatus(newStatus),
      );
      setReports((prev) =>
        prev.map((r) =>
          r.reportId === reportId ? { ...r, status: newStatus } : r,
        ),
      );
      setStatusEditId(null);
    } catch (err) {
      setError("Failed to update report status");
      console.error(err);
    }
  };

  const exportCsv = () => {
    const header =
      "Report ID,Citizen,District,Waste Type,Quantity,Status,Assigned To,Date\n";
    const rows = filtered
      .map(
        (r) =>
          `"${r.id}","${r.citizenName}","${r.district}","${r.wasteType}","${r.quantity}","${r.status}","${r.assignedCollector ?? ""}","${r.reportedDate}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waste-reports.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.citizenName.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q);
    return (
      matchSearch &&
      (filterStatus === "all" ||
        (filterStatus === "completed"
          ? isCompletedLifecycleStatus(r.status)
          : r.status === filterStatus)) &&
      (filterDistrict === "all" ||
        r.district === filterDistrict) &&
      (filterPriority === "all" ||
        r.priority === filterPriority)
    );
  });

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

        .rm-body { background: #f7f8fa; border: 1px solid #dde1e7; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .rm-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .rm-stat-card { background: #fff; border: 1px solid #e8eaee; border-radius: 8px; padding: 10px 16px; display: flex; flex-direction: column; }
        .rm-stat-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 6px 16px rgba(0,0,0,0.13); }
        .rm-stat-label { font-size: 12px; font-weight: 600; color: #9aa0ac; margin-bottom: 2px; }
        .rm-stat-value { font-size: 30px; font-weight: 800; color: #1a1e25; letter-spacing: -0.04em; line-height: 1; }
        .rm-stat-trend { font-size: 11.5px; font-weight: 700; color: #1cb97a; margin-top: 8px; }

        .rm-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .rm-search-wrap { position: relative; flex: 1 1 180px; }
        .rm-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #aab0bb; pointer-events: none; }
        .rm-input {
          width: 100%; padding: 8px 12px 8px 34px; border: 1px solid #dde1e7; border-radius: 6px;
          font-size: 12.5px; font-weight: 600; color: #1a1e25; background: #fff;
          font-family: inherit; outline: none; transition: border-color 0.15s; box-sizing: border-box;
        }
        .rm-input:focus { border-color: #1cb97a; }
        .rm-input::placeholder { color: #aab0bb; font-weight: 500; }
        .rm-select-wrap { position: relative; }
        .rm-select {
          padding: 8px 28px 8px 12px; border: 1px solid #dde1e7; border-radius: 6px;
          font-size: 12.5px; font-weight: 600; color: #1a1e25; background: #fff;
          font-family: inherit; appearance: none; cursor: pointer; outline: none;
          transition: border-color 0.15s; min-width: 130px;
        }
        .rm-select:focus { border-color: #1cb97a; }

        .rm-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden; }
        .rm-card-header {
          background: #f0f2f5; padding: 10px 16px; border-bottom: 1px solid #dde1e7;
          display: flex; align-items: center; justify-content: space-between;
        }
        .rm-card-title { font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em; }
        .rm-card-subtitle { font-size: 11px; color: #9aa0ac; margin-top: 1px; }
        .rm-count { font-size: 10.5px; font-weight: 800; background: #f0f2f5; color: #6b7a8f; padding: 3px 10px; border-radius: 4px; border: 1px solid #dde1e7; letter-spacing: 0.03em; }

        .rm-table { width: 100%; border-collapse: collapse; }
        .rm-th {
          padding: 8px 14px; text-align: left; font-size: 10.5px; font-weight: 800;
          color: #9aa0ac; letter-spacing: 0.06em; text-transform: uppercase;
          background: #f7f8fa; border-bottom: 1px solid #eef0f3;
        }
        .rm-tr { border-bottom: 1px solid #eef0f3; transition: background 0.1s; }
        .rm-tr:last-child { border-bottom: none; }
        .rm-tr:hover { background: #f7f9fc; }
        .rm-td { padding: 10px 14px; font-size: 12.5px; color: #1a1e25; vertical-align: middle; }

        .rm-badge {
          display: inline-flex; align-items: center; padding: 3px 8px;
          border-radius: 4px; border: 1px solid; font-size: 10.5px; font-weight: 800;
          letter-spacing: 0.03em; text-transform: capitalize; white-space: nowrap;
        }
        .rm-status {
          display: inline-flex; align-items: center; padding: 3px 8px;
          border-radius: 4px; font-size: 10.5px; font-weight: 800;
          letter-spacing: 0.03em; white-space: nowrap;
        }
        .rm-action-btn {
          width: 26px; height: 26px; border-radius: 5px; border: 1px solid #dde1e7;
          background: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; transition: background 0.1s;
        }
        .rm-action-btn:hover { background: #f0f2f5; }

        .rm-btn-export {
          display: inline-flex; align-items: center; gap: 6px; background: #1cb97a;
          color: #fff; border: none; border-radius: 6px; padding: 8px 16px;
          font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          letter-spacing: 0.02em; transition: opacity 0.12s;
        }
        .rm-btn-export:hover { opacity: 0.87; }

        .rm-empty { text-align: center; padding: 48px 16px; }
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
            Reports Management
          </p>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Global view of all waste reports across Brazzaville
          </p>
        </div>
        <button className="rm-btn-export" onClick={exportCsv}>
          <Download size={13} /> Export Data
        </button>
      </div>

      <div className="rm-body">
        {/* Stats */}
        <div className="rm-stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div className="rm-stat-card" key={stat.label}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 8,
                  }}
                >
                  <div
                    className="rm-stat-icon"
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
                    <div className="rm-stat-label">
                      {stat.label}
                    </div>
                    <div className="rm-stat-value">
                      {stat.value}
                    </div>
                  </div>
                </div>
                <div className="rm-stat-trend">
                  ↑ {stat.trend} this month
                </div>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="rm-toolbar">
          <div className="rm-search-wrap">
            <Search size={13} className="rm-search-icon" />
            <input
              type="text"
              className="rm-input"
              placeholder="Search by ID, citizen or location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {[
            {
              value: filterStatus,
              onChange: setFilterStatus,
              options: [
                ["all", "All Statuses"],
                ["pending", "Pending"],
                ["in-progress", "In Progress"],
                ["completed", "Completed (all done)"],
                ["compensated", "Compensated"],
                ["recycled", "Recycled"],
                ["rejected", "Rejected"],
              ],
            },
            {
              value: filterDistrict,
              onChange: setFilterDistrict,
              options: [
                ["all", "All Districts"],
                ...BRAZZAVILLE_DISTRICTS.map((d) => [d, d] as [string, string]),
              ],
            },
            {
              value: filterPriority,
              onChange: setFilterPriority,
              options: [
                ["all", "All Priorities"],
                ["critical", "Critical"],
                ["high", "High"],
                ["medium", "Medium"],
                ["low", "Low"],
              ],
            },
          ].map((sel, i) => (
            <div className="rm-select-wrap" key={i}>
              <select
                className="rm-select"
                value={sel.value}
                onChange={(e) => sel.onChange(e.target.value)}
              >
                {sel.options.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                color="#9aa0ac"
                style={{
                  position: "absolute",
                  right: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          ))}

          <span className="rm-count">
            {filtered.length} result
            {filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="rm-card">
          <div className="rm-card-header">
            <div>
              <div className="rm-card-title">All Reports</div>
              <div className="rm-card-subtitle">
                Click any row to view full report details
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                borderBottom: "1px solid #dde1e7",
                padding: "12px 16px",
                fontSize: "12px",
                color: "#991b1b",
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="rm-empty">
              <p style={{ margin: 0, fontSize: 13, color: "#aab0bb" }}>
                Loading reports...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rm-empty">
              <Package
                size={40}
                color="#aab0bb"
                style={{
                  margin: "0 auto 10px",
                  display: "block",
                  opacity: 0.4,
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#aab0bb",
                }}
              >
                No reports found
              </p>
            </div>
          ) : (
            <table className="rm-table">
              <thead>
                <tr>
                  {[
                    "Report ID",
                    "Citizen",
                    "District",
                    "Waste Type",
                    "Priority",
                    "Status",
                    "Assigned To",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="rm-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((report) => {
                  const ps = priorityStyle[report.priority] ?? {
                    text: "#4a5568",
                    bg: "#f0f2f5",
                    border: "#dde1e7",
                  };
                  const ss = statusStyle[report.status] ?? {
                    text: "#4a5568",
                    bg: "#f0f2f5",
                  };
                  return (
                    <tr
                      key={report.id}
                      className="rm-tr"
                      style={{ cursor: "pointer" }}
                    >
                      <td className="rm-td">
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 12.5,
                            color: "#1a1e25",
                            marginBottom: 2,
                          }}
                        >
                          {report.id}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 10.5,
                            color: "#aab0bb",
                            fontWeight: 600,
                          }}
                        >
                          <Clock size={10} />{" "}
                          {report.reportedDate}
                        </div>
                      </td>
                      <td
                        className="rm-td"
                        style={{ fontWeight: 600 }}
                      >
                        {report.citizenName}
                      </td>
                      <td className="rm-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            color: "#6b7a8f",
                            fontWeight: 600,
                          }}
                        >
                          <MapPin size={10} color="#aab0bb" />{" "}
                          {report.district}
                        </div>
                      </td>
                      <td className="rm-td">
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 12.5,
                          }}
                        >
                          {report.wasteType}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#aab0bb",
                            fontWeight: 600,
                          }}
                        >
                          {report.quantity}
                        </div>
                      </td>
                      <td className="rm-td">
                        <span
                          className="rm-badge"
                          style={{
                            color: ps.text,
                            background: ps.bg,
                            borderColor: ps.border,
                          }}
                        >
                          {report.priority}
                        </span>
                      </td>
                      <td className="rm-td">
                        <span
                          className="rm-status"
                          style={{
                            color: ss.text,
                            background: ss.bg,
                          }}
                        >
                          {statusLabel[report.status] ??
                            report.status}
                        </span>
                      </td>
                      <td className="rm-td">
                        {report.assignedCollector ? (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#1a1e25",
                            }}
                          >
                            {report.assignedCollector}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11.5,
                              color: "#aab0bb",
                              fontStyle: "italic",
                              fontWeight: 500,
                            }}
                          >
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="rm-td">
                        <div style={{ display: "flex", gap: 5 }}>
                          {statusEditId === report.reportId ? (
                            isCompletedLifecycleStatus(report.status) ? (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#065f46",
                                }}
                              >
                                {statusLabel[report.status] ?? report.status}
                              </span>
                            ) : (
                            <select
                              className="rm-select"
                              style={{ minWidth: 110, fontSize: 11 }}
                              value={report.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleStatusChange(
                                  report.reportId,
                                  e.target.value,
                                )
                              }
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="rejected">Rejected</option>
                            </select>
                            )
                          ) : (
                            <button
                              className="rm-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isCompletedLifecycleStatus(report.status)) {
                                  setStatusEditId(report.reportId);
                                }
                              }}
                              title={
                                isCompletedLifecycleStatus(report.status)
                                  ? "Status set by collection lifecycle"
                                  : "Update status"
                              }
                              disabled={isCompletedLifecycleStatus(report.status)}
                              style={{
                                opacity: isCompletedLifecycleStatus(report.status)
                                  ? 0.4
                                  : 1,
                              }}
                            >
                              <Edit2 size={12} color="#3b82f6" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </AdminMobileBlock>
  );
}