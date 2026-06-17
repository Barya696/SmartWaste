import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation2,
  CheckCircle,
  Package,
  Filter,
  ChevronDown,
  Calendar,
  User,
  X,
  Clock,
  ChevronLeft,
  ZoomIn,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Backend assignment interface
interface BackendAssignment {
  id: number;
  reportId: number;
  collectorId: number;
  supervisorId: number;
  assignmentStatus:
    | "PENDING"
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "REJECTED"
    | "PENDING_CITIZEN_APPROVAL"
    | "RECYCLED";
  assignmentDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface CompensationRecord {
  id: number;
  assignmentId: number;
}

// Backend report interface
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

type TaskStatus =
  | "assigned"
  | "in_progress"
  | "pending_approval"
  | "collected"
  | "recycled"
  | "compensated";

type Task = {
  id: string;
  type: string;
  location: string;
  coordinates: string;
  district: string;
  status: TaskStatus;
  priority: "high" | "medium" | "normal";
  quantity: string;
  distance: string;
  reportedBy: string;
  reportedDate: string;
  collectedDate?: string;
  description: string;
  photoUrl: string;
  assignmentId?: number;
};

const quantityIcon = (q: string) =>
  q === "small" ? "🗑️" : q === "large" ? "🚛" : "♻️";

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  pending_approval: "Awaiting Approval",
  collected: "Collected",
  recycled: "Recycled",
  compensated: "Compensated",
};

function isTerminalStatus(status: TaskStatus): boolean {
  return status === "collected" || status === "recycled" || status === "compensated";
}

async function fetchCompensatedAssignmentIds(): Promise<Set<number>> {
  try {
    const res = await fetch("http://localhost:8080/api/compensations", {
      credentials: "include",
    });
    if (!res.ok) return new Set();
    const data: CompensationRecord[] = await res.json();
    return new Set(data.map((c) => c.assignmentId));
  } catch {
    return new Set();
  }
}

async function fetchAssignmentsForCollector(collectorId: number): Promise<Task[]> {
  try {
    const [assignResponse, reportsResponse, compensatedIds] = await Promise.all([
      fetch(`http://localhost:8080/api/assignments/collector/${collectorId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }),
      fetch("http://localhost:8080/api/reports", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }),
      fetchCompensatedAssignmentIds(),
    ]);

    if (!assignResponse.ok) return [];
    const assignments: BackendAssignment[] = await assignResponse.json();

    if (!reportsResponse.ok) return [];
    const reports: BackendReport[] = await reportsResponse.json();

    return assignments
      .map((assignment) => {
        const report = reports.find((r) => r.id === assignment.reportId);
        if (!report) return null;

        const status = mapAssignmentStatus(
          assignment.assignmentStatus,
          compensatedIds.has(assignment.id),
        );

        return {
          id: report.trackingNumber,
          type: report.category,
          location: report.location,
          coordinates: "0, 0",
          district: report.district,
          status,
          priority: determinePriority(report.category),
          quantity: mapQuantity(report.quantity),
          distance: "—",
          reportedBy: `User ${report.userId}`,
          reportedDate: new Date(report.createdAt).toISOString().split("T")[0],
          collectedDate:
            status !== "assigned" && status !== "in_progress"
              ? new Date(assignment.updatedAt).toISOString().split("T")[0]
              : undefined,
          description: report.description,
          photoUrl:
            report.photoUrl ||
            "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=900&h=600&fit=crop",
          assignmentId: assignment.id,
        } as Task;
      })
      .filter((t) => t !== null);
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    return [];
  }
}

function mapAssignmentStatus(
  backendStatus: BackendAssignment["assignmentStatus"],
  isCompensated: boolean,
): TaskStatus {
  if (isCompensated) return "compensated";
  switch (backendStatus) {
    case "PENDING":
    case "ACCEPTED":
      return "assigned";
    case "IN_PROGRESS":
      return "in_progress";
    case "PENDING_CITIZEN_APPROVAL":
      return "pending_approval";
    case "COMPLETED":
      return "collected";
    case "RECYCLED":
      return "recycled";
    case "REJECTED":
      return "assigned";
    default:
      return "assigned";
  }
}

function determinePriority(category: string): "high" | "medium" | "normal" {
  const lower = category.toLowerCase();
  if (lower.includes("danger") || lower.includes("hazard") || lower.includes("medical")) {
    return "high";
  }
  if (lower.includes("organic") || lower.includes("market")) {
    return "medium";
  }
  return "normal";
}

function mapQuantity(quantity: string): string {
  const lower = quantity.toLowerCase();
  if (lower.includes("large") || lower.includes("kg")) return "large";
  if (lower.includes("small") || lower.includes("little")) return "small";
  return "medium";
}

async function patchAssignmentStatus(assignmentId: number, status: string): Promise<boolean> {
  try {
    const response = await fetch(
      `http://localhost:8080/api/assignments/${assignmentId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      }
    );
    if (!response.ok) {
      console.error(`Failed to update assignment ${assignmentId} to ${status}:`, response.status);
      return false;
    }
    console.log(`Successfully updated assignment ${assignmentId} to ${status}`);
    return true;
  } catch (error) {
    console.error(`Error updating assignment ${assignmentId}:`, error);
    return false;
  }
}

async function fetchAssignmentStatus(
  assignmentId: number,
): Promise<BackendAssignment["assignmentStatus"] | null> {
  try {
    const response = await fetch(
      `http://localhost:8080/api/assignments/${assignmentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );
    if (!response.ok) return null;
    const assignment: BackendAssignment = await response.json();
    return assignment.assignmentStatus;
  } catch (error) {
    console.error("Failed to fetch assignment status:", error);
    return null;
  }
}

async function resolveTaskStatus(assignmentId: number): Promise<TaskStatus | null> {
  const [backendStatus, compensatedIds] = await Promise.all([
    fetchAssignmentStatus(assignmentId),
    fetchCompensatedAssignmentIds(),
  ]);
  if (!backendStatus) return null;
  return mapAssignmentStatus(backendStatus, compensatedIds.has(assignmentId));
}

export function CollectionTasksPage() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailTask, setDetailTask] = useState<string | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [photoZoomed, setPhotoZoomed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingTaskId, setRefreshingTaskId] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAssignments() {
      if (!user?.id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const assignedTasks = await fetchAssignmentsForCollector(user.id);
        setTasks(assignedTasks);
        setError(null);
      } catch (err) {
        console.error("Error loading assignments:", err);
        setError("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, [user?.id]);

  const filteredTasks = tasks
    .map((t) => ({
      ...t,
      status: (taskStatuses[t.id] ?? t.status) as TaskStatus,
    }))
    .filter((t) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "in_progress")
        return t.status === "in_progress" || t.status === "pending_approval";
      if (filterStatus === "done")
        return isTerminalStatus(t.status);
      return t.status === filterStatus;
    });

  // Escape key closes lightbox
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && photoZoomed) setPhotoZoomed(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [photoZoomed]);

  const handleCompleteFromList = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.assignmentId) {
      console.error(`No assignmentId for task ${taskId}`);
      setError("Failed to complete task: Missing assignment ID");
      return;
    }

    setCompletingTaskId(taskId);
    try {
      const success = await patchAssignmentStatus(task.assignmentId, "PENDING_CITIZEN_APPROVAL");
      if (success) {
        // Optimistic UI update only if API call succeeded
        setTaskStatuses((prev) => ({ ...prev, [taskId]: "pending_approval" }));
        setError(null);
      } else {
        setError("Failed to mark task as complete. Please try again.");
      }
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleCompleteFromDetail = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.assignmentId) {
      console.error(`No assignmentId for task ${taskId}`);
      setError("Failed to complete task: Missing assignment ID");
      return;
    }

    setCompletingTaskId(taskId);
    try {
      const success = await patchAssignmentStatus(task.assignmentId, "PENDING_CITIZEN_APPROVAL");
      if (success) {
        // Optimistic UI update only if API call succeeded
        setTaskStatuses((prev) => ({ ...prev, [taskId]: "pending_approval" }));
        setError(null);
      } else {
        setError("Failed to mark task as complete. Please try again.");
      }
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleRefreshApprovalStatus = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === taskId);
    if (!task?.assignmentId) return;

    setRefreshingTaskId(taskId);
    try {
      const newStatus = await resolveTaskStatus(task.assignmentId);
      if (newStatus) {
        setTaskStatuses((prev) => ({ ...prev, [taskId]: newStatus }));
      }
    } finally {
      setRefreshingTaskId(null);
    }
  };

  const detail = tasks.find((t) => t.id === detailTask);
  // Merge any local status overrides into the detail task
  const detailWithStatus = detail
    ? { ...detail, status: (taskStatuses[detail.id] ?? detail.status) as TaskStatus }
    : null;

  return (
    <div
      style={{
        fontFamily: "'Nunito Sans', 'DM Sans', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        .ct-body {
          background: #f7f8fa;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ct-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
        .ct-select-wrap { position: relative; }
        .ct-select {
          padding: 8px 32px 8px 36px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1e25;
          background: #fff;
          font-family: inherit;
          appearance: none;
          cursor: pointer;
          min-width: 160px;
          min-height: 44px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .ct-select:focus { border-color: var(--green, #1cb97a); }
        @media (max-width: 640px) { .ct-select { font-size: 16px; } }

        .ct-count {
          margin-left: auto;
          font-size: 10.5px;
          font-weight: 800;
          background: #f0f2f5;
          color: #6b7a8f;
          padding: 3px 10px;
          border-radius: 4px;
          letter-spacing: 0.03em;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .ct-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }
        .ct-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); border-color: #c4c9d4; }
        .ct-card:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: -2px;
          border-color: var(--green, #1cb97a);
        }

        .ct-card-top {
          display: grid;
          grid-template-columns: 38px 1fr auto;
          gap: 12px;
          align-items: start;
          padding: 14px 16px;
        }
        @media (max-width: 480px) {
          .ct-card-top { grid-template-columns: 1fr auto; }
          .ct-card-icon { display: none; }
        }

        .ct-icon {
          width: 38px; height: 38px;
          background: #f0f2f5;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #6b7a8f; flex-shrink: 0; margin-top: 2px;
        }
        .ct-id   { font-size: 13px; font-weight: 800; color: #1a1e25; margin-bottom: 4px; }
        .ct-type { font-size: 12px; color: #8a9099; margin-bottom: 8px; }
        .ct-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 10.5px; color: #aab0bb; }
        .ct-meta-item { display: flex; align-items: center; gap: 3px; font-weight: 600; }
        .ct-gps {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700; color: #9aa0ac;
          background: #f0f2f5; border-radius: 4px;
          padding: 2px 7px; margin-top: 6px; letter-spacing: 0.02em;
        }
        .ct-actions { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; flex-shrink: 0; }

        .ct-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 6px;
          font-size: 11.5px; font-weight: 700; font-family: inherit;
          cursor: pointer; letter-spacing: 0.02em; white-space: nowrap;
          transition: opacity 0.1s; border: 1px solid transparent;
          min-height: 36px;
        }
        .ct-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
        .ct-btn:hover:not(:disabled) { opacity: 0.82; }
        .ct-btn-complete { background: var(--green, #1cb97a); color: #fff; border-color: transparent; }
        .ct-btn-pending {
          background: #fef3c7; color: #92400e; border-color: #fcd34d;
        }
        .ct-btn-pending:disabled { cursor: default; opacity: 0.85; }

        .ct-collected { text-align: right; }
        .ct-collected-label {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 4px; font-size: 12px; font-weight: 800;
          color: var(--green, #1cb97a); margin-bottom: 2px;
        }
        .ct-collected-label.recycled { color: #7c3aed; }
        .ct-collected-label.compensated { color: #1d4ed8; }
        .ct-collected-date { font-size: 10.5px; color: #aab0bb; font-weight: 600; }
        .ct-chevron { color: #c4c9d4; margin-top: 10px; }
        .ct-empty { text-align: center; padding: 48px 16px; }

        .ct-detail-view {
          display: flex;
          flex-direction: column;
          gap: 0;
          animation: ct-fade-in 0.18s ease;
        }
        @keyframes ct-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .ct-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          color: #6b7a8f;
          font-family: inherit;
          padding: 4px 0;
          margin-bottom: 6px;
          border-radius: 4px;
        }
        .ct-back-btn:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: 3px;
        }
        .ct-back-btn:hover { color: #1a1e25; }

        .ct-photo-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .ct-photo-header {
          background: #f0f2f5;
          border-bottom: 1px solid #dde1e7;
          padding: 10px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ct-photo-title {
          font-size: 11px; font-weight: 800; color: #4a5568;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .ct-photo-zoom-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: #fff; border: 1px solid #dde1e7; border-radius: 5px;
          padding: 4px 10px; font-size: 11px; font-weight: 700; color: #4a5568;
          cursor: pointer; font-family: inherit; transition: background 0.1s;
          min-height: 32px;
        }
        .ct-photo-zoom-btn:hover { background: #f0f2f5; }
        .ct-photo-zoom-btn:focus-visible { outline: 2px solid var(--green, #1cb97a); outline-offset: 2px; }

        .ct-photo-img {
          width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block;
        }
        .ct-no-photo {
          width: 100%; aspect-ratio: 16/9;
          background: #f0f2f5; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
        }

        .ct-info-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .ct-info-header {
          background: #f0f2f5; border-bottom: 1px solid #dde1e7;
          padding: 10px 16px;
          font-size: 11px; font-weight: 800; color: #4a5568;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .ct-info-body { padding: 4px 0; }
        .ct-info-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; padding: 9px 16px;
          border-bottom: 1px solid #f0f2f5;
        }
        .ct-info-row:last-child { border-bottom: none; }
        .ct-info-key { font-size: 11px; font-weight: 700; color: #9aa0ac; flex-shrink: 0; }
        .ct-info-val { font-size: 12.5px; font-weight: 700; color: #1a1e25; text-align: right; }
        .ct-description-text {
          padding: 12px 16px;
          font-size: 12.5px; color: #4a5568; line-height: 1.7; font-weight: 500;
        }

        .ct-detail-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }
        @media (max-width: 560px) {
          .ct-detail-two-col { grid-template-columns: 1fr; }
        }

        .ct-detail-footer {
          background: #f0f2f5; border: 1px solid #dde1e7; border-radius: 8px;
          padding: 12px 16px; display: flex; align-items: center;
          justify-content: space-between; gap: 10px; flex-wrap: wrap;
        }

        .ct-lightbox {
          position: fixed; inset: 0; background: rgba(0,0,0,0.9);
          z-index: 400; display: flex; align-items: center; justify-content: center; cursor: zoom-out;
        }
        .ct-lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 6px; object-fit: contain; }
        .ct-lightbox-close {
          position: absolute; top: 20px; right: 20px;
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px; padding: 6px 12px; color: #fff;
          font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
          display: flex; align-items: center; gap: 5px; min-height: 36px;
        }
        .ct-lightbox-close:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
      `}</style>

      {/* ── Lightbox ── */}
      {photoZoomed && detailWithStatus && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full size evidence photo"
          className="ct-lightbox"
          onClick={() => setPhotoZoomed(false)}
        >
          <button
            className="ct-lightbox-close"
            aria-label="Close photo"
            onClick={(e) => {
              e.stopPropagation();
              setPhotoZoomed(false);
            }}
          >
            <X size={13} aria-hidden="true" /> Close
          </button>
          <img
            src={detailWithStatus.photoUrl}
            alt={`Evidence photo for task ${detailWithStatus.id}`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ══════════════════════════════════════
          DETAIL VIEW
      ══════════════════════════════════════ */}
      {detailWithStatus ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div>
              <button
                className="ct-back-btn"
                onClick={() => {
                  setDetailTask(null);
                  setPhotoZoomed(false);
                }}
              >
                <ChevronLeft size={14} aria-hidden="true" /> Back to tasks
              </button>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1a1e25",
                  letterSpacing: "-0.02em",
                }}
              >
                {detailWithStatus.id}
              </h1>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 12.5,
                  color: "#8a9099",
                  fontWeight: 500,
                }}
              >
                {detailWithStatus.type} waste — {detailWithStatus.location}
              </p>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fee",
                border: "1px solid #fcc",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#dc2626",
                fontSize: "12.5px",
                marginBottom: "12px",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div className="ct-detail-view">
            {/* Evidence photo */}
            <div className="ct-photo-card">
              <div className="ct-photo-header">
                <span className="ct-photo-title">Evidence Photo</span>
                <button
                  className="ct-photo-zoom-btn"
                  aria-label="View evidence photo full size"
                  onClick={() => setPhotoZoomed(true)}
                >
                  <ZoomIn size={11} aria-hidden="true" /> View Full Size
                </button>
              </div>
              {detailWithStatus.photoUrl ? (
                <img
                  className="ct-photo-img"
                  src={detailWithStatus.photoUrl}
                  alt={`Evidence photo for ${detailWithStatus.id} — ${detailWithStatus.type} waste at ${detailWithStatus.location}`}
                />
              ) : (
                <div className="ct-no-photo" aria-label="No photo submitted">
                  <Package size={28} color="#c4c9d4" aria-hidden="true" />
                  <span style={{ fontSize: 12, color: "#aab0bb", fontWeight: 600 }}>
                    No photo submitted
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="ct-info-card">
              <div className="ct-info-header">Reporter's Description</div>
              <p className="ct-description-text">{detailWithStatus.description}</p>
            </div>

            {/* Two-col info */}
            <div className="ct-detail-two-col">
              <div className="ct-info-card" style={{ margin: 0 }}>
                <div className="ct-info-header">Waste Details</div>
                <div className="ct-info-body">
                  <div className="ct-info-row">
                    <span className="ct-info-key">Type</span>
                    <span className="ct-info-val">{detailWithStatus.type}</span>
                  </div>
                  <div className="ct-info-row">
                    <span className="ct-info-key">Quantity</span>
                    <span className="ct-info-val">
                      <span aria-hidden="true">{quantityIcon(detailWithStatus.quantity)} </span>
                      {detailWithStatus.quantity}
                    </span>
                  </div>
                  <div className="ct-info-row">
                    <span className="ct-info-key">District</span>
                    <span className="ct-info-val">{detailWithStatus.district}</span>
                  </div>
                  <div className="ct-info-row">
                    <span className="ct-info-key">GPS</span>
                    <span className="ct-info-val" style={{ fontFamily: "monospace", fontSize: 10.5 }}>
                      {detailWithStatus.coordinates}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ct-info-card" style={{ margin: 0 }}>
                <div className="ct-info-header">Report Info</div>
                <div className="ct-info-body">
                  <div className="ct-info-row">
                    <span className="ct-info-key">Reported by</span>
                    <span className="ct-info-val">{detailWithStatus.reportedBy}</span>
                  </div>
                  <div className="ct-info-row">
                    <span className="ct-info-key">Date</span>
                    <span className="ct-info-val">{detailWithStatus.reportedDate}</span>
                  </div>
                  <div className="ct-info-row">
                    <span className="ct-info-key">Distance</span>
                    <span className="ct-info-val">{detailWithStatus.distance}</span>
                  </div>
                  {detailWithStatus.status !== "assigned" &&
                    detailWithStatus.status !== "in_progress" &&
                    detailWithStatus.collectedDate && (
                    <div className="ct-info-row">
                      <span className="ct-info-key">Status date</span>
                      <span className="ct-info-val" style={{ color: "var(--green, #1cb97a)" }}>
                        {detailWithStatus.collectedDate}
                      </span>
                    </div>
                  )}
                  <div className="ct-info-row">
                    <span className="ct-info-key">Status</span>
                    <span className="ct-info-val">
                      {TASK_STATUS_LABEL[detailWithStatus.status]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer action */}
            <div className="ct-detail-footer">
              <span style={{ fontSize: 11.5, color: "#8a9099", fontWeight: 600 }}>
                Task {detailWithStatus.id}
              </span>
              {isTerminalStatus(detailWithStatus.status) ? (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      detailWithStatus.status === "compensated"
                        ? "#1d4ed8"
                        : detailWithStatus.status === "recycled"
                          ? "#7c3aed"
                          : "var(--green, #1cb97a)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <CheckCircle size={13} aria-hidden="true" />
                  {TASK_STATUS_LABEL[detailWithStatus.status]}
                  {detailWithStatus.collectedDate
                    ? ` · ${detailWithStatus.collectedDate}`
                    : ""}
                </span>
              ) : detailWithStatus.status === "pending_approval" ? (
                <button
                  onClick={() => handleRefreshApprovalStatus(detailWithStatus.id, new MouseEvent('click') as any)}
                  disabled={refreshingTaskId === detailWithStatus.id}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: refreshingTaskId === detailWithStatus.id ? "wait" : "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#92400e",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                  aria-label="Refresh approval status"
                >
                  {refreshingTaskId === detailWithStatus.id ? (
                    <>
                      <div
                        style={{
                          display: "inline-block",
                          width: 13,
                          height: 13,
                          border: "2px solid #b45309",
                          borderTop: "2px solid #fcd34d",
                          borderRadius: "50%",
                          animation: "spin 0.6s linear infinite",
                        }}
                        aria-hidden="true"
                      />
                      Checking approval...
                    </>
                  ) : (
                    <>
                      <Clock size={13} color="#b45309" aria-hidden="true" /> Awaiting citizen
                      approval
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="ct-btn ct-btn-complete"
                  onClick={() => handleCompleteFromDetail(detailWithStatus.id)}
                  disabled={completingTaskId === detailWithStatus.id}
                  style={{
                    opacity: completingTaskId === detailWithStatus.id ? 0.6 : 1,
                    cursor: completingTaskId === detailWithStatus.id ? "wait" : "pointer",
                  }}
                >
                  {completingTaskId === detailWithStatus.id ? (
                    <>
                      <div
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          border: "2px solid #fff",
                          borderTop: "2px solid rgba(255,255,255,0.3)",
                          borderRadius: "50%",
                          animation: "spin 0.6s linear infinite",
                        }}
                        aria-hidden="true"
                      />
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={12} aria-hidden="true" />
                      Mark as Complete
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ══════════════════════════════════════
           LIST VIEW
        ══════════════════════════════════════ */
        <>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 14,
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
                Collection Tasks
              </h1>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 12.5,
                  color: "#8a9099",
                  fontWeight: 500,
                }}
              >
                Manage your assigned collection routes
              </p>
            </div>
          </div>

          <div className="ct-body">
            <div className="ct-toolbar">
              <div className="ct-select-wrap">
                <Filter
                  size={14}
                  color="#9aa0ac"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <select
                  className="ct-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  aria-label="Filter tasks by status"
                >
                  <option value="all">All Tasks</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="collected">Collected</option>
                  <option value="recycled">Recycled</option>
                  <option value="compensated">Compensated</option>
                  <option value="done">Completed (all done)</option>
                </select>
                <ChevronDown
                  size={13}
                  color="#9aa0ac"
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <span className="ct-count" aria-live="polite" aria-atomic="true">
                {filteredTasks.length}{" "}
                {filteredTasks.length === 1 ? "task" : "tasks"}
              </span>
            </div>

            {/* Loading state */}
            {loading && (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#6b7a8f",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    width: 24,
                    height: 24,
                    border: "3px solid #e5e7eb",
                    borderTop: "3px solid #1a5fa8",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                    marginBottom: "12px",
                  }}
                />
                <p style={{ margin: "8px 0 0" }}>Loading your assignments...</p>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div
                style={{
                  padding: "16px",
                  background: "#fee",
                  border: "1px solid #fcc",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#dc2626",
                  fontSize: "12.5px",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && filteredTasks.length === 0 && (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#aab0bb",
                }}
              >
                <Package
                  size={40}
                  style={{ opacity: 0.4, marginBottom: "12px" }}
                  aria-hidden="true"
                />
                <p style={{ margin: "8px 0 0" }}>No tasks assigned yet. Check back soon!</p>
              </div>
            )}

            {filteredTasks.map((task) => {
              const isPending = task.status === "pending_approval";
              const isDone = isTerminalStatus(task.status);
              const doneLabelClass =
                task.status === "compensated"
                  ? "compensated"
                  : task.status === "recycled"
                    ? "recycled"
                    : "";
              return (
                <button
                  key={task.id}
                  className="ct-card"
                  onClick={() => setDetailTask(task.id)}
                  aria-label={`Task ${task.id} — ${task.type} waste at ${task.location}, status: ${TASK_STATUS_LABEL[task.status]}`}
                >
                  <div className="ct-card-top">
                    <div className="ct-icon ct-card-icon" aria-hidden="true">
                      <Package size={17} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="ct-id">{task.id}</div>
                      <div className="ct-type">
                        <strong style={{ color: "#1a1e25", fontWeight: 700 }}>
                          {task.type}
                        </strong>{" "}
                        waste —{" "}
                        <span style={{ textTransform: "capitalize" }}>{task.quantity}</span>{" "}
                        quantity
                      </div>
                      <div className="ct-meta">
                        <span className="ct-meta-item">
                          <MapPin size={10} aria-hidden="true" />
                          {task.location}
                        </span>
                        <span className="ct-meta-item">
                          <User size={10} aria-hidden="true" />
                          {task.reportedBy}
                        </span>
                        <span className="ct-meta-item">
                          <Calendar size={10} aria-hidden="true" />
                          {task.reportedDate}
                        </span>
                        <span className="ct-meta-item">
                          <Navigation2 size={10} aria-hidden="true" />
                          {task.distance} away
                        </span>
                      </div>
                      <div>
                        <span className="ct-gps">
                          <MapPin size={9} aria-hidden="true" />
                          {task.coordinates}
                        </span>
                      </div>
                    </div>
                    <div className="ct-actions">
                      {isDone ? (
                        <div className="ct-collected">
                          <div className={`ct-collected-label ${doneLabelClass}`.trim()}>
                            <CheckCircle size={13} aria-hidden="true" />
                            {TASK_STATUS_LABEL[task.status]}
                          </div>
                          <div className="ct-collected-date">
                            {task.collectedDate ?? task.reportedDate}
                          </div>
                        </div>
                      ) : isPending ? (
                        <button
                          type="button"
                          className="ct-btn ct-btn-pending"
                          aria-label="Check approval status"
                          onClick={(e) => handleRefreshApprovalStatus(task.id, e)}
                          disabled={refreshingTaskId === task.id}
                          style={{
                            opacity: refreshingTaskId === task.id ? 0.6 : 1,
                            cursor: refreshingTaskId === task.id ? "wait" : "pointer",
                          }}
                        >
                          {refreshingTaskId === task.id ? (
                            <>
                              <div
                                style={{
                                  display: "inline-block",
                                  width: 10,
                                  height: 10,
                                  border: "2px solid #b45309",
                                  borderTop: "2px solid #fcd34d",
                                  borderRadius: "50%",
                                  animation: "spin 0.6s linear infinite",
                                }}
                                aria-hidden="true"
                              />
                              Checking...
                            </>
                          ) : (
                            <>
                              <Clock size={12} aria-hidden="true" />
                              Awaiting Approval
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="ct-btn ct-btn-complete"
                          onClick={(e) => handleCompleteFromList(task.id, e)}
                          disabled={completingTaskId === task.id}
                          style={{
                            opacity: completingTaskId === task.id ? 0.6 : 1,
                            cursor: completingTaskId === task.id ? "wait" : "pointer",
                          }}
                        >
                          {completingTaskId === task.id ? (
                            <>
                              <div
                                style={{
                                  display: "inline-block",
                                  width: 10,
                                  height: 10,
                                  border: "2px solid #fff",
                                  borderTop: "2px solid rgba(255,255,255,0.3)",
                                  borderRadius: "50%",
                                  animation: "spin 0.6s linear infinite",
                                }}
                                aria-hidden="true"
                              />
                              Marking...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} aria-hidden="true" />
                              Complete
                            </>
                          )}
                        </button>
                      )}
                      <span className="ct-chevron" aria-hidden="true">
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {!loading && filteredTasks.length === 0 && (
              <div className="ct-empty">
                <Package
                  size={40}
                  color="#aab0bb"
                  aria-hidden="true"
                  style={{ margin: "0 auto 10px", display: "block", opacity: 0.4 }}
                />
                <p style={{ margin: 0, fontSize: 13, color: "#aab0bb" }}>No tasks found</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}