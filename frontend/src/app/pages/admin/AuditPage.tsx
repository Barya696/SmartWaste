import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  MapPin,
  Clock,
  AlertCircle,
  Download,
  ChevronDown,
  Edit2,
  Package,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { AdminMobileBlock } from "../../components/AdminMobileBlock";
import {
  AdminService,
  type AdminReportRow,
  type SecurityEvent,
  backendStatus,
  BRAZZAVILLE_DISTRICTS,
  isCompletedLifecycleStatus,
  formatDateTime,
} from "../../../services/adminService";
import { WasteService } from "../../../services/wasteService";

type AuditTab = "waste" | "system";

export function AuditPage() {
  const [activeTab, setActiveTab] = useState<AuditTab>("waste");

  // --- Waste Audit State ---
  const [wasteSearchTerm, setWasteSearchTerm] = useState("");
  const [wasteFilterStatus, setWasteFilterStatus] = useState("all");
  const [wasteFilterDistrict, setWasteFilterDistrict] = useState("all");
  const [wasteFilterPriority, setWasteFilterPriority] = useState("all");
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [wasteLoading, setWasteLoading] = useState(true);
  const [wasteError, setWasteError] = useState<string | null>(null);
  const [statusEditId, setStatusEditId] = useState<number | null>(null);

  // --- System Audit State ---
  const [systemSearchTerm, setSystemSearchTerm] = useState("");
  const [systemFilterType, setSystemFilterType] = useState("all");
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [systemLoading, setSystemLoading] = useState(true);
  const [systemError, setSystemError] = useState<string | null>(null);

  const loadWasteReports = async () => {
    try {
      setWasteLoading(true);
      setWasteError(null);
      const rows = await AdminService.getReportRows();
      setReports(rows);
    } catch (err) {
      setWasteError("Failed to load reports. Please try again.");
      console.error(err);
    } finally {
      setWasteLoading(false);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      setSystemLoading(true);
      setSystemError(null);
      const events = await AdminService.getSecurityEvents();
      setSecurityEvents(events);
    } catch (err) {
      setSystemError("Failed to load security events. Please try again.");
      console.error(err);
    } finally {
      setSystemLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "waste") {
      loadWasteReports();
    } else {
      loadSecurityEvents();
    }
  }, [activeTab]);

  // --- Waste Audit Logic ---
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
      setWasteError("Failed to update report status");
      console.error(err);
    }
  };

  const exportWasteCsv = () => {
    const header =
      "Report ID,Citizen,District,Waste Type,Quantity,Status,Assigned To,Date\n";
    const rows = filteredWasteReports
      .map(
        (r) =>
          `"${r.id}","${r.citizenName}","${r.district}","${r.wasteType}","${r.quantity}","${r.status}","${r.assignedCollector ?? ""}","${r.reportedDate}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waste-audit.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredWasteReports = reports.filter((r) => {
    const q = wasteSearchTerm.toLowerCase();
    const matchSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.citizenName.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q);
    return (
      matchSearch &&
      (wasteFilterStatus === "all" ||
        (wasteFilterStatus === "completed"
          ? isCompletedLifecycleStatus(r.status)
          : r.status === wasteFilterStatus)) &&
      (wasteFilterDistrict === "all" ||
        r.district === wasteFilterDistrict) &&
      (wasteFilterPriority === "all" ||
        r.priority === wasteFilterPriority)
    );
  });

  // --- System Audit Logic ---
  const eventTypeStyles: Record<string, { icon: any; text: string; bg: string; border: string }> = {
    FAILED_LOGIN: { icon: UserX, text: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    FAILED_SIGNUP: { icon: UserX, text: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
    BLOCKED_LOGIN: { icon: ShieldAlert, text: "#991b1b", bg: "#fff1f2", border: "#fca5a5" },
    SERVER_ERROR: { icon: AlertCircle, text: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    SUCCESSFUL_LOGIN: { icon: UserCheck, text: "#065f46", bg: "#f0fdf4", border: "#6ee7b7" },
    SUCCESSFUL_SIGNUP: { icon: UserCheck, text: "#059669", bg: "#ecfdf5", border: "#6ee7b7" },
    USER_LOGOUT: { icon: ShieldAlert, text: "#4a5568", bg: "#f0f2f5", border: "#dde1e7" }
  };

  const eventTypeLabels: Record<string, string> = {
    FAILED_LOGIN: "Failed Login",
    FAILED_SIGNUP: "Failed Signup",
    BLOCKED_LOGIN: "Blocked Login",
    SERVER_ERROR: "Server Error",
    SUCCESSFUL_LOGIN: "Successful Login",
    SUCCESSFUL_SIGNUP: "Successful Signup",
    USER_LOGOUT: "User Logout"
  };

  const filteredSecurityEvents = securityEvents.filter((e) => {
    const q = systemSearchTerm.toLowerCase();
    const matchSearch =
      !q ||
      e.email.toLowerCase().includes(q) ||
      e.message.toLowerCase().includes(q) ||
      e.eventType.toLowerCase().includes(q);
    return (
      matchSearch &&
      (systemFilterType === "all" || e.eventType === systemFilterType)
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
          .rm-body { background: #f7f8fa; border: 1px solid #dde1e7; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }

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

          .tab-container {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
          }
          .tab-btn {
            padding: 10px 20px;
            border: none;
            background: transparent;
            font-size: 14px;
            font-weight: 700;
            color: #6b7a8f;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            margin-bottom: -2px;
            transition: all 0.2s;
          }
          .tab-btn:hover { color: #1a1e25; }
          .tab-btn.active {
            color: #1cb97a;
            border-bottom-color: #1cb97a;
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
              Audit
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: 12.5,
                color: "#8a9099",
                fontWeight: 500,
              }}
            >
              Review system and waste report activity
            </p>
          </div>
          {activeTab === "waste" && (
            <button className="rm-btn-export" onClick={exportWasteCsv}>
              <Download size={13} /> Export Data
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="tab-container">
          <button
            className={`tab-btn ${activeTab === "waste" ? "active" : ""}`}
            onClick={() => setActiveTab("waste")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={16} />
              Waste Audit
            </div>
          </button>
          <button
            className={`tab-btn ${activeTab === "system" ? "active" : ""}`}
            onClick={() => setActiveTab("system")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={16} />
              System Audit
            </div>
          </button>
        </div>

        {/* Waste Audit Content */}
        {activeTab === "waste" && (
          <div className="rm-body">
            {/* Toolbar */}
            <div className="rm-toolbar">
              <div className="rm-search-wrap">
                <Search size={13} className="rm-search-icon" />
                <input
                  type="text"
                  className="rm-input"
                  placeholder="Search by ID, citizen or location…"
                  value={wasteSearchTerm}
                  onChange={(e) => setWasteSearchTerm(e.target.value)}
                />
              </div>

              {[
                {
                  value: wasteFilterStatus,
                  onChange: setWasteFilterStatus,
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
                  value: wasteFilterDistrict,
                  onChange: setWasteFilterDistrict,
                  options: [
                    ["all", "All Districts"],
                    ...BRAZZAVILLE_DISTRICTS.map((d) => [d, d] as [string, string]),
                  ],
                },
                {
                  value: wasteFilterPriority,
                  onChange: setWasteFilterPriority,
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
                {filteredWasteReports.length} result
                {filteredWasteReports.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table */}
            <div className="rm-card">
              <div className="rm-card-header">
                <div>
                  <div className="rm-card-title">Waste Reports</div>
                  <div className="rm-card-subtitle">
                    Complete audit trail of all waste reports
                  </div>
                </div>
              </div>

              {wasteError && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    borderBottom: "1px solid #dde1e7",
                    padding: "12px 16px",
                    fontSize: "12px",
                    color: "#991b1b",
                  }}
                >
                  {wasteError}
                </div>
              )}

              {wasteLoading ? (
                <div className="rm-empty">
                  <p style={{ margin: 0, fontSize: 13, color: "#aab0bb" }}>
                    Loading reports...
                  </p>
                </div>
              ) : filteredWasteReports.length === 0 ? (
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
                    {filteredWasteReports.map((report) => {
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
        )}

        {/* System Audit Content */}
        {activeTab === "system" && (
          <div className="rm-body">
            {/* Toolbar */}
            <div className="rm-toolbar">
              <div className="rm-search-wrap">
                <Search size={13} className="rm-search-icon" />
                <input
                  type="text"
                  className="rm-input"
                  placeholder="Search by email or message…"
                  value={systemSearchTerm}
                  onChange={(e) => setSystemSearchTerm(e.target.value)}
                />
              </div>

              <div className="rm-select-wrap">
                <select
                  className="rm-select"
                  value={systemFilterType}
                  onChange={(e) => setSystemFilterType(e.target.value)}
                >
                  <option value="all">All Event Types</option>
                  {[
                    "SUCCESSFUL_LOGIN",
                    "SUCCESSFUL_SIGNUP",
                    "USER_LOGOUT",
                    "FAILED_LOGIN",
                    "FAILED_SIGNUP",
                    "BLOCKED_LOGIN",
                    "SERVER_ERROR"
                  ].map((type) => (
                    <option key={type} value={type}>
                      {eventTypeLabels[type]}
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

              <span className="rm-count">
                {filteredSecurityEvents.length} result
                {filteredSecurityEvents.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Events List */}
            <div className="rm-card">
              <div className="rm-card-header">
                <div>
                  <div className="rm-card-title">System Events</div>
                  <div className="rm-card-subtitle">
                    Security and system activity audit trail
                  </div>
                </div>
              </div>

              {systemError && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    borderBottom: "1px solid #dde1e7",
                    padding: "12px 16px",
                    fontSize: "12px",
                    color: "#991b1b",
                  }}
                >
                  {systemError}
                </div>
              )}

              {systemLoading ? (
                <div className="rm-empty">
                  <p style={{ margin: 0, fontSize: 13, color: "#aab0bb" }}>
                    Loading events...
                  </p>
                </div>
              ) : filteredSecurityEvents.length === 0 ? (
                <div className="rm-empty">
                  <ShieldAlert
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
                    No security events found
                  </p>
                </div>
              ) : (
                <table className="rm-table">
                  <thead>
                    <tr>
                      <th className="rm-th">Event</th>
                      <th className="rm-th">Email</th>
                      <th className="rm-th">Message</th>
                      <th className="rm-th">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSecurityEvents.map((event) => {
                      const style = eventTypeStyles[event.eventType] ?? {
                        icon: AlertCircle,
                        text: "#4a5568",
                        bg: "#f0f2f5",
                        border: "#dde1e7",
                      };
                      const Icon = style.icon;
                      return (
                        <tr
                          key={event.id}
                          className="rm-tr"
                        >
                          <td className="rm-td">
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                backgroundColor: style.bg,
                                border: `1px solid ${style.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}>
                                <Icon size={14} color={style.text} />
                              </div>
                              <span className="rm-badge" style={{
                                color: style.text,
                                backgroundColor: style.bg,
                                borderColor: style.border,
                              }}>
                                {eventTypeLabels[event.eventType] ?? event.eventType}
                              </span>
                            </div>
                          </td>
                          <td className="rm-td" style={{ fontWeight: 600 }}>
                            {event.email}
                          </td>
                          <td className="rm-td">
                            <span style={{ color: "#4a5568" }}>
                              {event.message}
                            </span>
                          </td>
                          <td className="rm-td">
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#9aa0ac", fontSize: "12px" }}>
                              <Clock size={10} />
                              {formatDateTime(event.createdAt)}
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
        )}
      </div>
    </AdminMobileBlock>
  );
}
