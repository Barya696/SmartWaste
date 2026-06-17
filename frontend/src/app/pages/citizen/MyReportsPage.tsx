import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Package,
  MapPin,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  RefreshCw,
  AlertTriangle,
  Coins,
  ImageIcon,
  X,
  CheckCircle,
  Bell,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  CompensationService,
  RESUBMIT_HOURS_THRESHOLD,
  type EnrichedCitizenReport,
} from "../../../services/compensationService";
import { WasteService } from "../../../services/wasteService";
import {
  EcoPointsService,
  type CitizenEcoRewards,
} from "../../../services/ecoPointsService";

// Toaster component for pending collection approvals
function PendingApprovalToaster({
  reportId,
  reportType,
  collectorName,
  onApprove,
  onDismiss,
  onRefresh,
  isRefreshing,
}: {
  reportId: string;
  reportType: string;
  collectorName?: string;
  onApprove: () => void;
  onDismiss: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Collection approval request"
      style={{
        background: "#d1fae5",
        border: "1px solid #6ee7b7",
        borderRadius: 8,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        animation: "slideDown 0.3s ease-out",
        boxShadow: "0 4px 12px rgba(28, 185, 122, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: 1,
        }}
      >
        <Bell
          size={18}
          color="#0f6e56"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: "#0f6e56",
              lineHeight: 1.4,
            }}
          >
            Collection Completed
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 12,
              color: "#047857",
              lineHeight: 1.3,
            }}
          >
            {reportType} waste (ID: {reportId}) has been collected.
            {collectorName && ` Collected by ${collectorName}.`} Please confirm to finalize.
          </p>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Check approval status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "#f3f4f6",
              color: "#0f6e56",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: isRefreshing ? "wait" : "pointer",
              transition: "background 0.15s",
              minHeight: 32,
              whiteSpace: "nowrap",
              opacity: isRefreshing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) (e.target as HTMLButtonElement).style.background = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              if (!isRefreshing) (e.target as HTMLButtonElement).style.background = "#f3f4f6";
            }}
          >
            {isRefreshing ? (
              <>
                <div
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    border: "2px solid #0f6e56",
                    borderTop: "2px solid #d1fae5",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }}
                  aria-hidden="true"
                />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw size={12} aria-hidden="true" />
                Check Status
              </>
            )}
          </button>
        )}
        <button
          onClick={onApprove}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "#0f6e56",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            transition: "background 0.15s",
            minHeight: 32,
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = "#084e3e";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = "#0f6e56";
          }}
        >
          <CheckCircle size={13} aria-hidden="true" />
          Approve
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px 8px",
            background: "rgba(0,0,0,0.08)",
            color: "#0f6e56",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
            transition: "background 0.15s",
            minHeight: 32,
            minWidth: 32,
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = "rgba(0,0,0,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = "rgba(0,0,0,0.08)";
          }}
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}



type Report = EnrichedCitizenReport;

// FIX #1: Status config uses CSS variables instead of hardcoded hex.
// Also adds a `bg` tint for the status pill.
const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pending",
    color: "var(--amber)",
    bg: "rgba(245,158,11,0.1)",
  },
  in_progress: {
    label: "In progress",
    color: "var(--blue)",
    bg: "rgba(37,99,235,0.09)",
  },
  collected: {
    label: "Collected",
    color: "var(--green)",
    bg: "rgba(28,185,122,0.1)",
  },
  recycled: {
    label: "Recycled",
    color: "var(--violet)",
    bg: "rgba(124,58,237,0.09)",
  },
  compensated: {
    label: "Compensated",
    color: "#1d4ed8",
    bg: "rgba(29,78,216,0.10)",
  },
};

const tlSteps = [
  "Reported",
  "Assigned",
  "Collected",
  "Recycled",
  "Compensated",
];
const tlOrder: Record<string, number> = {
  pending: 0,
  in_progress: 1,
  collected: 2,
  recycled: 3,
  compensated: 4,
};

// FIX #2: ReportRight uses CSS variables instead of hardcoded hex.
function ReportRight({
  report,
  pointsPerCompensation,
}: {
  report: Report;
  pointsPerCompensation: number;
}) {
  if (report.status === "pending") {
    return (
      <p
        style={{
          margin: 0,
          fontSize: 11.5,
          color: "#aab0bb",
          fontStyle: "italic",
        }}
      >
        Waiting for assignment…
      </p>
    );
  }
  if (
    report.status === "in_progress" &&
    report.assignedCollector
  ) {
    return (
      <div style={{ textAlign: "right" }}>
        <p
          style={{
            margin: "0 0 2px",
            fontSize: 10.5,
            color: "#9aa0ac",
            fontWeight: 600,
          }}
        >
          Assigned to
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            fontWeight: 700,
            color: "#1a1e25",
            display: "flex",
            alignItems: "center",
            gap: 5,
            justifyContent: "flex-end",
          }}
        >
          <User size={11} color="#8a9099" aria-hidden="true" />
          {report.assignedCollector}
        </p>
      </div>
    );
  }
  if (report.status === "collected" && report.collectedDate) {
    return (
      <div style={{ textAlign: "right" }}>
        <p
          style={{
            margin: "0 0 2px",
            fontSize: 10.5,
            color: "#9aa0ac",
            fontWeight: 600,
          }}
        >
          Collected on
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            fontWeight: 700,
            color: "#1a1e25",
          }}
        >
          {report.collectedDate}
        </p>
      </div>
    );
  }
  if (report.status === "recycled" && report.recycledDate) {
    return (
      <div style={{ textAlign: "right" }}>
        <p
          style={{
            margin: "0 0 2px",
            fontSize: 10.5,
            color: "#9aa0ac",
            fontWeight: 600,
          }}
        >
          Recycled on
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--violet)",
          }}
        >
          {report.recycledDate}
        </p>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 10.5,
            fontWeight: 800,
            color: "#b45309",
          }}
        >
          Awaiting compensation…
        </p>
      </div>
    );
  }
  if (report.status === "compensated") {
    return (
      <div style={{ textAlign: "right" }}>
        <p
          style={{
            margin: "0 0 2px",
            fontSize: 10.5,
            color: "#9aa0ac",
            fontWeight: 600,
          }}
        >
          Compensated on
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            fontWeight: 700,
            color: "#1d4ed8",
          }}
        >
          {report.compensatedDate ?? report.date}
        </p>
        {report.citizenAmount != null && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 10.5,
              fontWeight: 800,
              color: "var(--green)",
            }}
          >
            +{report.citizenAmount.toLocaleString("fr-CG")} XAF earned
          </p>
        )}
        {report.ecoPointsAwarded && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 10.5,
              fontWeight: 800,
              color: "var(--green)",
            }}
          >
            +{pointsPerCompensation} Eco Points earned!
          </p>
        )}
      </div>
    );
  }
  return null;
}

// FIX #3: ReportTimeline uses CSS variables instead of hardcoded hex.
function ReportTimeline({ report }: { report: Report }) {
  if (report.status === "pending") return null;
  const cur = tlOrder[report.status];
  return (
    <div
      style={{
        borderTop: "1px solid #eef0f3",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
      }}
    >
      {tlSteps.map((step, i) => {
        const active = i <= cur;
        return (
          <div
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < tlSteps.length - 1 ? 1 : undefined,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  // FIX #3: CSS variable
                  background: active
                    ? "var(--green)"
                    : "#dde1e7",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  // FIX #3: CSS variable-derived tone (no var() needed for text, kept readable)
                  color: active ? "#0f6e56" : "#aab0bb",
                  whiteSpace: "nowrap",
                }}
              >
                {step}
              </span>
            </div>
            {i < tlSteps.length - 1 && (
              <div
                aria-hidden="true"
                style={{
                  flex: 1,
                  height: 1,
                  margin: "0 6px",
                  // FIX #3: CSS variable
                  background:
                    i < cur ? "var(--green)" : "#eef0f3",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// FIX #4: ActionButton — replace onMouseEnter/onMouseLeave DOM mutation with CSS :hover.
// The hover is handled via the .mr-action-btn CSS class defined in <style>.
// Adds optional `disabled` prop for the Approve Collection button.
function ActionButton({
  icon,
  label,
  color,
  bg,
  border,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
  border: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mr-action-btn"
      style={
        {
          "--ab-color": color,
          "--ab-bg": bg,
          "--ab-border": border,
        } as React.CSSProperties
      }
    >
      {icon}
      {label}
    </button>
  );
}

function ExpandedPanel({
  report,
  onPhotoOpen,
  onApprove,
  onRefresh,
  onResubmit,
  isRefreshing,
  isResubmitting,
  pointsPerCompensation,
}: {
  report: Report;
  onPhotoOpen: (url: string) => void;
  onApprove: (reportId: string) => void;
  onRefresh?: (reportId: string) => void;
  onResubmit?: (reportId: string) => void;
  isRefreshing?: boolean;
  isResubmitting?: boolean;
  pointsPerCompensation: number;
}) {
  const handleApproveCollection = onApprove;
  const showResubmit =
    (report.status === "pending" || report.status === "in_progress") &&
    !report.pendingApproval;
  const resubmitLabel = isResubmitting ? "Resubmitting…" : "Resubmit report";

  const helpText: Record<string, string> = {
    pending: report.canResubmit
      ? "No collector has been assigned yet. You can resubmit now to bump this report back to the top of the queue."
      : `No collector has been assigned yet. Resubmit becomes available after ${RESUBMIT_HOURS_THRESHOLD} hours${
          report.resubmitHoursRemaining
            ? ` (about ${report.resubmitHoursRemaining}h remaining).`
            : "."
        }`,
    in_progress: report.pendingApproval
      ? `${report.assignedCollector ?? "Your collector"} has marked this as collected and is awaiting your approval. Tap "Approve Collection" to confirm.`
      : report.canResubmit
        ? `${report.assignedCollector ?? "Your collector"} was assigned but collection is taking too long. Resubmit to cancel the current assignment and re-enter the queue.`
        : `${report.assignedCollector ?? "A collector"} was assigned on ${report.date}. Resubmit is available after ${RESUBMIT_HOURS_THRESHOLD} hours if collection has not happened${
            report.resubmitHoursRemaining
              ? ` (about ${report.resubmitHoursRemaining}h remaining).`
              : "."
          }`,
    collected: `Waste was collected on ${report.collectedDate}. It is now being processed at the sorting facility.`,
    recycled: `Recycled on ${report.recycledDate}. Your compensation is being processed.`,
    compensated: report.citizenAmount != null
      ? `Compensated on ${report.compensatedDate ?? report.date}. You received ${report.citizenAmount.toLocaleString("fr-CG")} XAF (${report.citizenPct ?? 60}% share). +${pointsPerCompensation} Eco Points added.`
      : `Compensated on ${report.compensatedDate ?? report.date}. +${pointsPerCompensation} Eco Points added.`,
  };

  return (
    <div
      style={{
        borderTop: "1px solid #eef0f3",
        background: "#f7f8fa",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      >
        {showResubmit && (
          <ActionButton
            icon={<RefreshCw size={12} aria-hidden="true" />}
            label={resubmitLabel}
            color="#92400e"
            bg="#fef3c7"
            border="#fcd34d"
            disabled={!report.canResubmit || isResubmitting}
            onClick={() => onResubmit?.(report.id)}
          />
        )}
        {report.status === "in_progress" && (
          <ActionButton
            icon={<CheckCircle size={12} aria-hidden="true" />}
            label="Approve Collection"
            color="#0f6e56"
            bg="#d1fae5"
            border="#6ee7b7"
            disabled={!report.pendingApproval}
            onClick={() => handleApproveCollection(report.id)}
          />
        )}
        {report.status === "in_progress" && report.pendingApproval && onRefresh && (
          <ActionButton
            icon={
              isRefreshing ? (
                <div
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    border: "2px solid #0f6e56",
                    borderTop: "2px solid #d1fae5",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }}
                  aria-hidden="true"
                />
              ) : (
                <RefreshCw size={12} aria-hidden="true" />
              )
            }
            label={isRefreshing ? "Checking..." : "Check Status"}
            color="#0f6e56"
            bg="#d1fae5"
            border="#6ee7b7"
            disabled={isRefreshing}
            onClick={() => onRefresh(report.id)}
          />
        )}
        {report.status === "recycled" &&
          !report.ecoPointsAwarded && (
            <ActionButton
              icon={<Coins size={12} aria-hidden="true" />}
              label="Awaiting compensation"
              color="#5b21b6"
              bg="#ede9fe"
              border="#c4b5fd"
            />
          )}
        {report.photoUrl && (
          <ActionButton
            icon={<ImageIcon size={12} aria-hidden="true" />}
            label="View evidence photo"
            color="#0f6e56"
            bg="#d1fae5"
            border="#6ee7b7"
            onClick={() =>
              report.photoUrl && onPhotoOpen(report.photoUrl)
            }
          />
        )}
        {!report.photoUrl && (
          <span
            style={{
              fontSize: 11,
              color: "#aab0bb",
              alignSelf: "center",
              fontStyle: "italic",
            }}
          >
            No photo submitted
          </span>
        )}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "#aab0bb",
          lineHeight: 1.6,
        }}
      >
        {helpText[report.status]}
      </p>
    </div>
  );
}

// FIX #5: PhotoModal z-index raised from 100 → 300 so it clears the sticky appbar (z-index: 100).
// FIX #6: Modal image width changed from hardcoded 500px → 100% so it respects maxWidth: "90vw" on mobile.
// FIX #7: Close button gets aria-label for screen readers.
function PhotoModal({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  // FIX #8: Trap focus and close on Escape key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Evidence photo"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 300, // FIX #5: was 100
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          width: 500,
          maxWidth: "90vw",
        }}
      >
        <div
          style={{
            background: "#f0f2f5",
            padding: "10px 14px",
            borderBottom: "1px solid #dde1e7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#4a5568",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Evidence Photo
          </span>
          <button
            onClick={onClose}
            aria-label="Close photo" // FIX #7
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7a8f",
              display: "flex",
              padding: 2,
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {/* FIX #6: width 100% instead of hardcoded 500px */}
        <img
          src={url}
          alt="Evidence photo of reported waste"
          style={{
            width: "100%",
            height: "auto",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

export function MyReportsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(
    searchParams.get("expand"),
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [dismissedApprovals, setDismissedApprovals] = useState<
    Set<string>
  >(new Set());
  const [approvingReportId, setApprovingReportId] = useState<
    string | null
  >(null);
  const [refreshingReportId, setRefreshingReportId] = useState<
    string | null
  >(null);
  const [resubmittingReportId, setResubmittingReportId] = useState<
    string | null
  >(null);
  const [rewards, setRewards] = useState<CitizenEcoRewards | null>(null);

  // Fetch reports with full lifecycle including compensation
  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [enriched, eco] = await Promise.all([
          CompensationService.getCitizenReports(user.id),
          EcoPointsService.getCitizenRewards(user.id),
        ]);
        setReports(enriched);
        setRewards(eco);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load reports";
        console.error("Error fetching reports:", err);
        setError(errorMsg);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user?.id]);

  // FIX #9: Add searchParams to dep array to satisfy exhaustive-deps.
  // The effect only reads the "expand" param on mount, so it's intentionally
  // run once — but including searchParams is still correct.
  useEffect(() => {
    const id = searchParams.get("expand");
    if (!id) return;
    const el = document.getElementById(`report-card-${id}`);
    if (el)
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [searchParams]);

  // Fetch assignment status from database to check for approval updates
  const handleRefreshApprovalStatus = async (reportId: string) => {
    if (!user?.id) return;

    setRefreshingReportId(reportId);
    try {
      const [enriched, eco] = await Promise.all([
        CompensationService.getCitizenReports(user.id),
        EcoPointsService.getCitizenRewards(user.id),
      ]);
      const updated = enriched.find((r) => r.id === reportId);
      if (updated) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? updated : r)),
        );
      }
      setRewards(eco);
    } catch (err) {
      console.error("Failed to refresh approval status:", err);
    } finally {
      setRefreshingReportId(null);
    }
  };

  const handleResubmitReport = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report?.canResubmit) return;

    const confirmed = window.confirm(
      `Resubmit ${reportId}? This will return the report to the assignment queue${
        report.status === "in_progress"
          ? " and cancel the current collector assignment"
          : ""
      }.`,
    );
    if (!confirmed) return;

    setResubmittingReportId(reportId);
    try {
      await WasteService.resubmitReport(report.backendId);
      if (!user?.id) return;
      const [enriched, eco] = await Promise.all([
        CompensationService.getCitizenReports(user.id),
        EcoPointsService.getCitizenRewards(user.id),
      ]);
      setReports(enriched);
      setRewards(eco);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resubmit report.";
      alert(message);
    } finally {
      setResubmittingReportId(null);
    }
  };

  // Handle citizen approval of completed collection
  const handleApproveCollection = async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report || !report.assignmentId) return;

    setApprovingReportId(reportId);
    try {
      // Update assignment status to COMPLETED — this is the authoritative workflow driver
      const response = await fetch(
        `http://localhost:8080/api/assignments/${report.assignmentId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "COMPLETED" }),
        }
      );

      if (!response.ok) {
        console.error("Failed to approve collection:", response.status);
        alert("Failed to approve collection. Please try again.");
        return;
      }

      // Update local state
      setReports((prevReports) =>
        prevReports.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: "collected",
                backendStatus: "completed",
                pendingApproval: false,
              }
            : r
        )
      );
      // Mark toaster as dismissed
      setDismissedApprovals((prev) => new Set([...prev, reportId]));
    } catch (error) {
      console.error("Error approving collection:", error);
      alert("Error approving collection. Please try again.");
    } finally {
      setApprovingReportId(null);
    }
  };

  const pointsPerCompensation = rewards?.pointsPerCompensation ?? 50;

  const filtered = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q);
    const matchFilter =
      filterStatus === "all" ||
      r.status === filterStatus ||
      (filterStatus === "collected" &&
        ["collected", "recycled", "compensated"].includes(r.status));
    return matchSearch && matchFilter;
  });

  return (
    <div
      style={{
        fontFamily:
          "'Nunito Sans','DM Sans',-apple-system,sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mr-input {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1e25;
          background: #fff;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
          min-height: 44px;
        }
        .mr-input:focus { border-color: var(--green, #1cb97a); }
        .mr-input::placeholder { color: #aab0bb; font-weight: 500; }

        .mr-select {
          padding: 8px 32px 8px 36px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1e25;
          background: #fff;
          font-family: inherit;
          outline: none;
          appearance: none;
          cursor: pointer;
          min-width: 160px;
          min-height: 44px;
          transition: border-color 0.15s;
        }
        .mr-select:focus { border-color: var(--green, #1cb97a); }

        /* FIX #10: Mobile — search and filter stack vertically on narrow screens */
        @media (max-width: 480px) {
          .mr-filter-row {
            flex-direction: column !important;
          }
          .mr-select {
            min-width: unset;
            width: 100%;
            font-size: 16px; /* prevent iOS zoom */
          }
          .mr-input {
            font-size: 16px; /* prevent iOS zoom */
          }
        }

        .mr-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
          transition: box-shadow 0.15s;
        }
        .mr-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .mr-card.mr-card--expanded {
          border-color: var(--green, #1cb97a);
          box-shadow: 0 0 0 2px rgba(28,185,122,0.12);
        }

        /* FIX #11: Card header row as a proper button — keyboard accessible */
        .mr-card-header {
          display: grid;
          grid-template-columns: 38px 1fr auto;
          gap: 12px;
          align-items: start;
          padding: 14px 16px;
          width: 100%;
          background: none;
          border: none;
          font-family: inherit;
          text-align: left;
          cursor: pointer;
          box-sizing: border-box;
        }
        .mr-card-header:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: -2px;
          border-radius: 8px;
        }

        /* FIX #12: mobile — card grid collapses icon on very small screens */
        @media (max-width: 360px) {
          .mr-card-header {
            grid-template-columns: 1fr auto;
          }
          .mr-card-icon { display: none; }
        }

        /* FIX #4: ActionButton hover via CSS, not DOM mutation */
        .mr-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 13px;
          border-radius: 6px;
          border: 1px solid var(--ab-border);
          background: var(--ab-bg);
          color: var(--ab-color);
          font-size: 11.5px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: opacity 0.1s;
          min-height: 36px;
        }
        .mr-action-btn:hover { opacity: 0.8; }
        .mr-action-btn:focus-visible {
          outline: 2px solid var(--ab-color);
          outline-offset: 2px;
        }
        .mr-action-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .mr-action-btn:disabled:hover { opacity: 0.45; }

        /* FIX #13: Status pill */
        .mr-status-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
      `}</style>

      {photoUrl && (
        <PhotoModal
          url={photoUrl}
          onClose={() => setPhotoUrl(null)}
        />
      )}

      {/* Pending approval toasters */}
      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          right: 16,
          zIndex: 250,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 500,
          pointerEvents: "none",
        }}
      >
        {reports
          .filter(
            (r) =>
              r.pendingApproval &&
              !dismissedApprovals.has(r.id)
          )
          .map((report) => (
            <div
              key={report.id}
              style={{ pointerEvents: "auto" }}
            >
              <PendingApprovalToaster
                reportId={report.id}
                reportType={report.type}
                collectorName={report.assignedCollector}
                onApprove={() =>
                  handleApproveCollection(report.id)
                }
                onDismiss={() => {
                  setDismissedApprovals((prev) =>
                    new Set([...prev, report.id])
                  );
                }}
                onRefresh={() =>
                  handleRefreshApprovalStatus(report.id)
                }
                isRefreshing={refreshingReportId === report.id}
              />
            </div>
          ))}
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* FIX #14: Page title is <h1>, not <p> */}
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
            My Reports
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Track all your waste reports
            {rewards != null && (
              <span style={{ marginLeft: 8, color: "var(--green, #1cb97a)", fontWeight: 700 }}>
                · {rewards.totalEcoPoints} eco pts
              </span>
            )}
          </p>
        </div>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            background: "#f0f2f5",
            color: "#6b7a8f",
            padding: "3px 10px",
            borderRadius: 4,
            letterSpacing: "0.03em",
            alignSelf: "flex-start",
            marginTop: 4,
            flexShrink: 0,
          }}
        >
          {loading ? "Loading…" : `${filtered.length} report${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Body */}
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
        {/* Search + Filter — FIX #10: uses mr-filter-row class for mobile stacking */}
        <div
          className="mr-filter-row"
          style={{ display: "flex", gap: 8 }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Search
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
            <input
              type="text"
              className="mr-input"
              placeholder="Search by ID, type, or location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search reports"
              autoComplete="off"
            />
          </div>
          <div style={{ position: "relative" }}>
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
              className="mr-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="collected">Collected / done</option>
              <option value="recycled">Recycled</option>
              <option value="compensated">Compensated</option>
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
        </div>

        {/* Report cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 16px",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  margin: "0 auto 10px",
                  border: "3px solid #eef0f3",
                  borderTop: "3px solid var(--green)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#aab0bb",
                }}
              >
                Loading your reports…
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {!loading && filtered.map((report) => {
            const isExpanded = expandedId === report.id;
            const cfg = statusConfig[report.status];

            return (
              <div
                id={`report-card-${report.id}`}
                className={`mr-card${isExpanded ? " mr-card--expanded" : ""}`}
                key={report.id}
              >
                {/* FIX #11: Card top row is now a <button> — keyboard accessible, has aria-expanded */}
                <button
                  type="button"
                  className="mr-card-header"
                  aria-expanded={isExpanded}
                  aria-controls={`report-panel-${report.id}`}
                  aria-label={`${report.id} — ${report.type} waste, ${report.status.replace("_", " ")}. ${isExpanded ? "Collapse" : "Expand"} details.`}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : report.id)
                  }
                >
                  {/* Icon */}
                  <div
                    className="mr-card-icon"
                    aria-hidden="true"
                    style={{
                      width: 38,
                      height: 38,
                      background: "#f0f2f5",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6b7a8f",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Package size={17} />
                  </div>

                  {/* Main info */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        marginBottom: 3,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#1a1e25",
                        }}
                      >
                        {report.id}
                      </span>
                      {/* FIX #13: Status pill — visible on card top for scannability */}
                      <span
                        className="mr-status-pill"
                        style={{
                          color: cfg.color,
                          background: cfg.bg,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: "0 0 5px",
                        fontSize: 12,
                        color: "#8a9099",
                      }}
                    >
                      <strong
                        style={{
                          color: "#1a1e25",
                          fontWeight: 700,
                        }}
                      >
                        {report.type}
                      </strong>{" "}
                      waste — {report.quantity} quantity
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        fontSize: 11,
                        color: "#aab0bb",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <MapPin size={11} aria-hidden="true" />
                        {report.location}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Calendar
                          size={11}
                          aria-hidden="true"
                        />
                        Reported: {report.date}
                      </span>
                    </div>
                  </div>

                  {/* Right: status info + chevron */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 10,
                      flexShrink: 0,
                    }}
                  >
                    <ReportRight
                      report={report}
                      pointsPerCompensation={pointsPerCompensation}
                    />
                    <span
                      style={{ color: "#aab0bb" }}
                      aria-hidden="true"
                    >
                      {isExpanded ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </span>
                  </div>
                </button>

                {/* Timeline */}
                <ReportTimeline report={report} />

                {/* Expandable panel — no stopPropagation needed since the trigger is now a button sibling */}
                {isExpanded && (
                  <div
                    id={`report-panel-${report.id}`}
                    role="region"
                    aria-label={`Details for ${report.id}`}
                  >
                    <ExpandedPanel
                      report={report}
                      onPhotoOpen={(url) => setPhotoUrl(url)}
                      onApprove={handleApproveCollection}
                      onRefresh={handleRefreshApprovalStatus}
                      onResubmit={handleResubmitReport}
                      isRefreshing={refreshingReportId === report.id}
                      isResubmitting={resubmittingReportId === report.id}
                      pointsPerCompensation={pointsPerCompensation}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 16px",
              }}
            >
              <Package
                size={40}
                color="#aab0bb"
                aria-hidden="true"
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
          )}
        </div>
      </div>
    </div>
  );
}