import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import {
  MapPin,
  Search,
  Filter,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Truck,
  ClipboardCheck,
  Package,
  Calendar,
  ZoomIn,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

type Priority = "critical" | "high" | "medium" | "low";
type Status = "pending" | "in_progress" | "completed" | "rejected";

// Backend report interface
interface BackendReport {
  id: number;
  userId: number;
  category: string;
  district: string;
  location: string;
  description: string;
  quantity: string;
  photoUrl?: string;
  trackingNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastResubmittedAt?: string | null;
}

// Frontend report interface
interface Report {
  id: string;
  citizenName: string;
  district: string;
  address: string;
  wasteType: string;
  priority: Priority;
  status: Status;
  submittedAt: string;
  description: string;
  hasPhoto: boolean;
  photoUrl?: string;
  assignedTo: string | null;
  assignedAt?: string;
  backendId?: number;
}

// Backend collector interface
interface BackendCollector {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

// Frontend collector interface
interface Collector {
  id: string;
  name: string;
  phone: string;
  district: string;
  activeTasks: number;
  status: "available" | "busy" | "off";
  backendId: number;
}

// Helper functions for backend integration
async function fetchReports(): Promise<Report[]> {
  try {
    const response = await fetch("http://localhost:8080/api/reports", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) return [];
    const backendReports: BackendReport[] = await response.json();
    
    return backendReports
      .map((br) => ({
      id: br.trackingNumber,
      backendId: br.id,
      citizenName: `User ${br.userId}`,
      district: br.district,
      address: br.location,
      wasteType: br.category,
      priority: determinePriority(br.category),
      status: mapStatus(br.status),
      submittedAt: br.lastResubmittedAt ?? br.createdAt,
      description: br.description,
      hasPhoto: !!br.photoUrl,
      photoUrl: br.photoUrl,
      assignedTo: null,
    }))
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return [];
  }
}

async function fetchCollectors(): Promise<Collector[]> {
  try {
    const response = await fetch("http://localhost:8080/api/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) return [];
    const users: BackendCollector[] = await response.json();
    
    // Filter only COLLECTOR role users
    return users
      .filter((u) => u.role === "COLLECTOR")
      .map((u) => ({
        id: String(u.id),
        backendId: u.id,
        name: `${u.firstName} ${u.lastName}`,
        phone: u.phoneNumber,
        district: "",
        activeTasks: 0,
        status: "available" as const,
      }));
  } catch (error) {
    console.error("Failed to fetch collectors:", error);
    return [];
  }
}

function determinePriority(category: string): Priority {
  const lower = category.toLowerCase();
  if (lower.includes("danger") || lower.includes("hazard") || lower.includes("medical"))
    return "critical";
  if (lower.includes("organic") || lower.includes("market")) return "high";
  return "medium";
}

function mapStatus(backendStatus: string): Status {
  const s = backendStatus.toLowerCase();
  if (s === "completed") return "completed";
  if (s === "in_progress" || s === "assigned") return "in_progress";
  if (s === "rejected") return "rejected";
  return "pending";
}

// Fix #2: CSS variables instead of hardcoded hex
const priorityStyle: Record<
  Priority,
  { label: string; color: string }
> = {
  critical: {
    label: "Critical",
    color: "var(--red,    #dc2626)",
  },
  high: { label: "High", color: "var(--orange, #b45309)" },
  medium: { label: "Medium", color: "var(--amber,  #d97706)" },
  low: { label: "Low", color: "var(--green,  #166534)" },
};

// Fix #3: CSS variables instead of hardcoded hex
const statusStyle: Record<
  Status | "all",
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "var(--amber, #b45309)" },
  in_progress: {
    label: "In Progress",
    color: "var(--blue,  #1a5fa8)",
  },
  completed: {
    label: "Completed",
    color: "var(--green, #16a34a)",
  },
  rejected: {
    label: "Rejected",
    color: "var(--red, #dc2626)",
  },
  all: { label: "All", color: "#000" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-CG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDateTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return `Today · ${formatTime(iso)}`;
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function TaskAssignmentPage() {
  const { user } = useAuth();
  const location = useLocation();

  const [reports, setReports] = useState<Report[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<Report | null>(null);
  const [selectedCollector, setSelectedCollector] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [photoZoomed, setPhotoZoomed] = useState(false);
  const [showToast, setShowToast] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [reportsData, collectorsData] = await Promise.all([
          fetchReports(),
          fetchCollectors(),
        ]);
        setReports(reportsData);
        setCollectors(collectorsData);
        setError(null);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Open detail when navigated here from dashboard with a report ID
  useEffect(() => {
    const incoming = (location.state as { openReportId?: string })?.openReportId;
    if (incoming) {
      setDetailId(incoming);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  // Fix #24: pendingCount in dep array so the effect is not stale
  const pendingCount = reports.filter(
    (r) => r.status === "pending",
  ).length;
  useEffect(() => {
    if (pendingCount === 0) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [pendingCount]);

  // Fix #13 + #14: Escape key closes lightbox first, then modal
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (photoZoomed) {
        setPhotoZoomed(false);
        return;
      }
      if (assignModal) {
        setAssignModal(null);
        setSelectedCollector(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () =>
      document.removeEventListener("keydown", onKeyDown);
  }, [photoZoomed, assignModal]);

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q) ||
      r.wasteType.toLowerCase().includes(q) ||
      r.citizenName.toLowerCase().includes(q);
    return (
      matchSearch &&
      (filterStatus === "all" || r.status === filterStatus) &&
      (filterPriority === "all" ||
        r.priority === filterPriority)
    );
  });

  const detail = reports.find((r) => r.id === detailId);

  function handleAssign() {
    if (!assignModal || !selectedCollector || !user) return;
    const collector = collectors.find((c) => c.id === selectedCollector);
    if (!collector) return;

    setAssigning(true);

    // Post assignment to backend
    fetch("http://localhost:8080/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        reportId: assignModal.backendId,
        collectorId: collector.backendId,
        supervisorId: user.id,
        notes: `Assigned to ${collector.name}`,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to assign");
        return res.json();
      })
      .then(() => {
        // Update local state
        setReports((prev) =>
          prev.map((r) =>
            r.id === assignModal.id
              ? {
                  ...r,
                  status: "in_progress",
                  assignedTo: collector.name,
                  assignedAt: new Date().toISOString().slice(0, 10),
                }
              : r
          )
        );
        setSuccessBanner(
          `${assignModal.id} assigned to ${collector.name}`
        );
        setAssignModal(null);
        setSelectedCollector(null);
        setTimeout(() => setSuccessBanner(null), 4000);
      })
      .catch((err) => {
        console.error("Assignment failed:", err);
        setSuccessBanner(`Failed to assign: ${err.message}`);
        setTimeout(() => setSuccessBanner(null), 4000);
      })
      .finally(() => setAssigning(false));
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

        /* ── Body shell ── */
        .ta-body {
          background: #f7f8fa; border: 1px solid #dde1e7;
          border-radius: 8px; padding: 16px;
          display: flex; flex-direction: column; gap: 8px;
        }

        /* ── Toolbar ── */
        .ta-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 2px; }
        .ta-search-wrap { position: relative; flex: 1 1 180px; }
        .ta-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #aab0bb; pointer-events: none; }

        /* Fix #10: font-size 16px on mobile to prevent iOS zoom */
        .ta-input {
          width: 100%; padding: 8px 12px 8px 34px;
          border: 1px solid #dde1e7; border-radius: 6px;
          font-size: 12.5px; font-weight: 600; color: #1a1e25;
          background: #fff; font-family: inherit; outline: none;
          transition: border-color 0.15s; box-sizing: border-box;
          min-height: 40px;
        }
        .ta-input:focus { border-color: var(--green, #1cb97a); }
        .ta-input::placeholder { color: #aab0bb; font-weight: 500; }
        @media (max-width: 640px) { .ta-input { font-size: 16px; } }

        .ta-select-wrap { position: relative; }
        .ta-select-icon { position: absolute; top: 50%; transform: translateY(-50%); color: #aab0bb; pointer-events: none; }

        /* Fix #8/#10: min-height + iOS zoom fix on selects */
        .ta-select {
          padding: 8px 28px 8px 34px; border: 1px solid #dde1e7; border-radius: 6px;
          font-size: 12.5px; font-weight: 600; color: #1a1e25; background: #fff;
          font-family: inherit; appearance: none; cursor: pointer; outline: none;
          transition: border-color 0.15s; min-height: 40px;
        }
        .ta-select:focus { border-color: var(--green, #1cb97a); }
        .ta-select-plain {
          padding: 8px 28px 8px 12px; border: 1px solid #dde1e7; border-radius: 6px;
          font-size: 12.5px; font-weight: 600; color: #1a1e25; background: #fff;
          font-family: inherit; appearance: none; cursor: pointer; outline: none;
          transition: border-color 0.15s; min-height: 40px;
        }
        .ta-select-plain:focus { border-color: var(--green, #1cb97a); }
        @media (max-width: 640px) {
          .ta-select { font-size: 16px; }
          .ta-select-plain { font-size: 16px; }
        }

        /* Fix #26: flex-shrink prevents badge compression */
        .ta-count {
          margin-left: auto; font-size: 10.5px; font-weight: 800;
          background: #f0f2f5; color: #6b7a8f;
          padding: 3px 10px; border-radius: 4px;
          letter-spacing: 0.03em; white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Report card — Fix #11/#12: <button> with focus-visible ── */
        .ta-card {
          background: #fff; border: 1px solid #dde1e7; border-radius: 8px;
          overflow: hidden; cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s;
          width: 100%; text-align: left; font-family: inherit;
          display: block;
        }
        .ta-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); border-color: #c4c9d4; }
        .ta-card:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: -2px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        }
        .ta-card-top {
          display: grid; grid-template-columns: 38px 1fr auto;
          gap: 12px; align-items: start; padding: 14px 16px;
        }
        .ta-card-icon {
          width: 38px; height: 38px; background: #f0f2f5; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #6b7a8f; flex-shrink: 0; margin-top: 2px;
        }
        .ta-card-id { font-size: 13px; font-weight: 800; color: #1a1e25; margin-bottom: 4px; }
        .ta-card-type { font-size: 12px; color: #8a9099; margin-bottom: 8px; }
        .ta-card-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 10.5px; color: #aab0bb; }
        .ta-card-meta-item { display: flex; align-items: center; gap: 3px; font-weight: 600; }
        .ta-card-actions { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; flex-shrink: 0; }

        /* ── Action buttons ── */
        .ta-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 6px;
          font-size: 11.5px; font-weight: 700; font-family: inherit;
          cursor: pointer; letter-spacing: 0.02em; white-space: nowrap;
          transition: opacity 0.1s; border: 1px solid transparent;
          min-height: 36px;
        }
        .ta-btn:hover { opacity: 0.82; }
        /* Fix #5: CSS variables for button colours */
        .ta-btn-assign {
          background: var(--green, #1cb97a);
          color: #fff;
          border-color: var(--green, #1cb97a);
        }
        .ta-btn-assign:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: 2px;
        }
        /* Fix #25: disabled attribute handles keyboard; pointer-events none removed */
        .ta-btn-assigned {
          background: #dbeafe;
          color: var(--blue, #1a5fa8);
          border-color: #bfdbfe;
        }
        .ta-btn-assigned:disabled { cursor: default; opacity: 1; }
        .ta-btn-completed {
          color: var(--green, #16a34a);
          font-size: 12px; font-weight: 700; font-family: inherit;
          background: none; border: none;
          display: inline-flex; align-items: center; gap: 4px;
          min-height: 36px;
        }
        .ta-btn-completed:disabled { cursor: default; }

        /* ── Toast ── */
        .ta-toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px;
          padding: 11px 16px; display: flex; align-items: center; gap: 10px;
          font-size: 12.5px; color: #78350f; z-index: 500;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12); white-space: nowrap;
          animation: ta-toast-in 0.25s ease, ta-toast-out 0.3s ease 2.7s forwards;
        }
        @keyframes ta-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes ta-toast-out {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to   { opacity: 0; transform: translateX(-50%) translateY(12px); }
        }
        /* Fix #21: toast close button aria-label applied in JSX; focus ring here */
        .ta-toast-close {
          background: none; border: none; cursor: pointer; color: #92400e;
          display: flex; align-items: center; padding: 4px; margin-left: 4px;
          opacity: 0.6; transition: opacity 0.1s; border-radius: 3px;
          min-height: 32px;
        }
        .ta-toast-close:hover { opacity: 1; }
        .ta-toast-close:focus-visible { outline: 2px solid #92400e; outline-offset: 2px; opacity: 1; }

        /* ── Success banner ── */
        .ta-success-banner {
          background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 8px;
          padding: 11px 16px; display: flex; align-items: center; gap: 10px;
          font-size: 12.5px; font-weight: 700; color: #065f46;
        }

        /* ── Detail view ── */
        .ta-detail-view { display: flex; flex-direction: column; gap: 0; animation: ta-fade-in 0.18s ease; }
        @keyframes ta-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Fix #20: back button focus ring */
        .ta-back-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: none; border: none; cursor: pointer;
          font-size: 12px; font-weight: 700; color: #6b7a8f;
          font-family: inherit; padding: 4px 0; margin-bottom: 6px;
          border-radius: 3px;
        }
        .ta-back-btn:hover { color: #1a1e25; }
        .ta-back-btn:focus-visible { outline: 2px solid var(--blue, #1a5fa8); outline-offset: 2px; }

        /* ── Evidence Photo card ── */
        .ta-photo-card {
          background: #fff; border: 1px solid #dde1e7; border-radius: 8px;
          overflow: hidden; margin-bottom: 8px;
        }
        .ta-photo-header {
          background: #f0f2f5; border-bottom: 1px solid #dde1e7; padding: 10px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ta-photo-title {
          font-size: 11px; font-weight: 800; color: #4a5568;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        /* Fix #19: zoom button focus ring */
        .ta-photo-zoom-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: #fff; border: 1px solid #dde1e7; border-radius: 5px;
          padding: 4px 10px; font-size: 11px; font-weight: 700; color: #4a5568;
          cursor: pointer; font-family: inherit; transition: background 0.1s;
          min-height: 32px;
        }
        .ta-photo-zoom-btn:hover { background: #f0f2f5; }
        .ta-photo-zoom-btn:focus-visible { outline: 2px solid var(--blue, #1a5fa8); outline-offset: 2px; }

        .ta-photo-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
        .ta-no-photo {
          width: 100%; aspect-ratio: 16/9;
          background: #f0f2f5; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
        }

        /* Fix #13: lightbox role/aria in JSX; Escape handled in useEffect */
        .ta-lightbox {
          position: fixed; inset: 0; background: rgba(0,0,0,0.9);
          z-index: 400; display: flex; align-items: center; justify-content: center; cursor: zoom-out;
        }
        .ta-lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 6px; object-fit: contain; }
        .ta-lightbox-close {
          position: absolute; top: 20px; right: 20px;
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px; padding: 6px 12px; color: #fff;
          font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
          display: flex; align-items: center; gap: 5px; min-height: 36px;
        }
        .ta-lightbox-close:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

        /* Info card */
        .ta-info-card {
          background: #fff; border: 1px solid #dde1e7; border-radius: 8px;
          overflow: hidden; margin-bottom: 8px;
        }
        .ta-info-header {
          background: #f0f2f5; border-bottom: 1px solid #dde1e7; padding: 10px 16px;
          font-size: 11px; font-weight: 800; color: #4a5568;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .ta-info-body { padding: 4px 0; }
        .ta-info-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; padding: 9px 16px; border-bottom: 1px solid #f0f2f5;
        }
        .ta-info-row:last-child { border-bottom: none; }
        .ta-info-key { font-size: 11px; font-weight: 700; color: #9aa0ac; flex-shrink: 0; }
        .ta-info-val { font-size: 12.5px; font-weight: 700; color: #1a1e25; text-align: right; }
        .ta-description-text {
          padding: 12px 16px; font-size: 12.5px; color: #4a5568; line-height: 1.7; font-weight: 500;
        }

        /* Fix #7: responsive two-col for detail info cards */
        .ta-detail-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }
        @media (max-width: 560px) {
          .ta-detail-two-col { grid-template-columns: 1fr; }
        }

        /* Detail footer */
        .ta-detail-footer {
          background: #f0f2f5; border: 1px solid #dde1e7; border-radius: 8px;
          padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 8px;
        }

        /* ── Assign Modal ── */
        .ta-overlay {
          position: fixed; inset: 0; background: rgba(10,14,20,0.55);
          z-index: 300; backdrop-filter: blur(2px);
        }
        /* Fix #16: role/aria in JSX */
        .ta-modal {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: #fff; border: 1px solid #dde1e7; border-radius: 10px;
          width: 500px; max-width: calc(100vw - 32px);
          box-shadow: 0 24px 64px rgba(0,0,0,0.18); z-index: 301;
          overflow: hidden; display: flex; flex-direction: column;
          max-height: calc(100vh - 64px);
          animation: ta-modal-in 0.2s ease;
        }
        @keyframes ta-modal-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .ta-modal-header {
          background: #f0f2f5; border-bottom: 1px solid #dde1e7; padding: 10px 16px;
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }
        .ta-modal-title {
          font-size: 11px; font-weight: 800; color: #4a5568;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .ta-modal-subtitle { font-size: 11px; color: #9aa0ac; margin-top: 1px; }
        /* Fix #15/#17: aria-label in JSX; focus ring here */
        .ta-modal-close {
          width: 26px; height: 26px; border-radius: 5px; border: 1px solid #dde1e7;
          background: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #6b7a8f; transition: background 0.1s;
          min-height: 26px;
        }
        .ta-modal-close:hover { background: #f0f2f5; }
        .ta-modal-close:focus-visible { outline: 2px solid var(--blue, #1a5fa8); outline-offset: 2px; }

        .ta-modal-body { padding: 14px 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .ta-modal-footer {
          background: #f0f2f5; border-top: 1px solid #dde1e7; padding: 10px 16px;
          display: flex; gap: 8px; justify-content: flex-end; flex-shrink: 0;
        }
        /* Fix #17: focus rings on modal footer buttons */
        .ta-modal-btn-cancel {
          padding: 7px 16px; border-radius: 6px; border: 1px solid #dde1e7;
          background: #fff; font-size: 12.5px; font-weight: 700; color: #4a5568;
          cursor: pointer; font-family: inherit; transition: background 0.1s;
          min-height: 36px;
        }
        .ta-modal-btn-cancel:hover { background: #f0f2f5; }
        .ta-modal-btn-cancel:focus-visible { outline: 2px solid #4a5568; outline-offset: 2px; }

        /* Fix #6: class-based enabled/disabled dispatch button */
        .ta-modal-btn-dispatch {
          padding: 7px 18px; border-radius: 6px; border: none;
          font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: all 0.15s; display: flex; align-items: center; gap: 6px;
          min-height: 36px;
        }
        .ta-modal-btn-dispatch:enabled {
          background: var(--green, #1cb97a);
          color: #fff;
        }
        .ta-modal-btn-dispatch:disabled {
          background: #f0f2f5;
          color: #aab0bb;
          cursor: not-allowed;
        }
        /* Fix #18 */
        .ta-modal-btn-dispatch:focus-visible { outline: 2px solid var(--green, #1cb97a); outline-offset: 2px; }

        /* Report summary in modal */
        .ta-report-summary {
          background: #f7f8fa; border: 1px solid #dde1e7; border-radius: 8px;
          padding: 12px 14px; display: flex; align-items: flex-start; gap: 12px;
        }
        .ta-report-icon {
          width: 36px; height: 36px; border-radius: 8px; background: #f0f2f5;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        /* Collector picker */
        .ta-section-label {
          font-size: 10.5px; font-weight: 800; color: #4a5568;
          text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px;
        }
        .ta-collector-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 8px; border: 1px solid #dde1e7;
          background: #fff; cursor: pointer; text-align: left; width: 100%;
          font-family: inherit; transition: all 0.12s; min-height: 44px;
        }
        .ta-collector-btn:hover:not(:disabled) { border-color: #aab0bb; background: #f7f8fa; }
        .ta-collector-btn.selected { border: 2px solid var(--green, #1cb97a); background: #f0fdf9; }
        .ta-collector-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .ta-collector-btn:focus-visible { outline: 2px solid var(--green, #1cb97a); outline-offset: 2px; }

        /* Fix #4: class-based collector status colours */
        .ta-collector-status-available { color: var(--green, #0f6e56); }
        .ta-collector-status-busy      { color: var(--amber, #92400e); }

        .ta-avatar {
          border-radius: 50%; background: #f0f2f5; display: flex;
          align-items: center; justify-content: center;
          font-weight: 800; color: #6b7a8f; flex-shrink: 0;
        }
        .ta-label { font-size: 12px; font-weight: 600; white-space: nowrap; }

        /* Empty state */
        .ta-empty { text-align: center; padding: 48px 16px; }
      `}</style>

      {/* Fix #13: lightbox with role="dialog", aria-modal, aria-label, Escape handled via useEffect */}
      {photoZoomed && detail?.hasPhoto && detail?.photoUrl && (
        <div
          className="ta-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Evidence photo for report ${detail.id}`}
          onClick={() => setPhotoZoomed(false)}
        >
          <button
            className="ta-lightbox-close"
            onClick={(e) => {
              e.stopPropagation();
              setPhotoZoomed(false);
            }}
          >
            {/* Fix #23: aria-hidden on decorative icon */}
            <X size={13} aria-hidden="true" /> Close
          </button>
          {/* Fix #29: descriptive alt text */}
          <img
            src={detail.photoUrl}
            alt={`Evidence photo for report ${detail.id}`}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Fix #14/#16: modal with role="dialog", aria-modal, aria-labelledby, Escape via useEffect */}
      {assignModal && (
        <>
          <div
            className="ta-overlay"
            onClick={() => {
              setAssignModal(null);
              setSelectedCollector(null);
            }}
          />
          <div
            className="ta-modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ta-modal-title"
          >
            <div className="ta-modal-header">
              <div>
                <div
                  className="ta-modal-title"
                  id="ta-modal-title"
                >
                  Assign Collector
                </div>
                <div className="ta-modal-subtitle">
                  {assignModal.id} · {assignModal.district}
                </div>
              </div>
              {/* Fix #15: aria-label on close button */}
              <button
                className="ta-modal-close"
                onClick={() => {
                  setAssignModal(null);
                  setSelectedCollector(null);
                }}
                aria-label="Close assign collector dialog"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>

            <div className="ta-modal-body">
              {/* Report summary */}
              <div className="ta-report-summary">
                <div className="ta-report-icon">
                  <AlertTriangle
                    size={16}
                    color={
                      priorityStyle[assignModal.priority].color
                    }
                    aria-hidden="true"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#1a1e25",
                      marginBottom: 3,
                    }}
                  >
                    {assignModal.wasteType} —{" "}
                    {assignModal.district}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#aab0bb",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <MapPin size={10} aria-hidden="true" />{" "}
                    {assignModal.address}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "#6b7a8f",
                      lineHeight: 1.6,
                    }}
                  >
                    {assignModal.description}
                  </p>
                </div>
                <span
                  className="ta-label"
                  style={{
                    color:
                      priorityStyle[assignModal.priority].color,
                    alignSelf: "flex-start",
                    flexShrink: 0,
                  }}
                >
                  {priorityStyle[assignModal.priority].label}
                </span>
              </div>

              {/* Collector list */}
              <div>
                <div className="ta-section-label">
                  Select a Collector
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {collectors.length === 0 ? (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#aab0bb",
                        textAlign: "center",
                        padding: "16px",
                      }}
                    >
                      No collectors available
                    </p>
                  ) : (
                    collectors.map((c) => {
                      const selected = selectedCollector === c.id;
                      return (
                        <button
                          key={c.id}
                          className={`ta-collector-btn${selected ? " selected" : ""}`}
                          onClick={() => setSelectedCollector(c.id)}
                          aria-pressed={selected}
                          aria-label={`${c.name}, ${c.phone}`}
                        >
                          <div
                            className="ta-avatar"
                            style={{
                              width: 32,
                              height: 32,
                              fontSize: 10.5,
                              background: selected
                                ? "var(--green, #1cb97a)"
                                : "#f0f2f5",
                              color: selected
                                ? "#fff"
                                : "#6b7a8f",
                              transition:
                                "background 0.12s, color 0.12s",
                            }}
                            aria-hidden="true"
                          >
                            {c.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: 700,
                                color: "#1a1e25",
                              }}
                            >
                              {c.name}
                            </div>
                            <div
                              style={{
                                fontSize: 10.5,
                                color: "#aab0bb",
                                marginTop: 1,
                                fontWeight: 600,
                              }}
                            >
                              {c.phone}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="ta-modal-footer">
              {/* Fix #17 */}
              <button
                className="ta-modal-btn-cancel"
                onClick={() => {
                  setAssignModal(null);
                  setSelectedCollector(null);
                }}
              >
                Cancel
              </button>
              {/* Fix #6/#18 */}
              <button
                className="ta-modal-btn-dispatch"
                onClick={handleAssign}
                disabled={!selectedCollector || assigning}
              >
                {assigning ? (
                  <>
                    <div
                      style={{
                        display: "inline-block",
                        width: 13,
                        height: 13,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                        marginRight: 6,
                      }}
                    />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Truck size={13} aria-hidden="true" />
                    Dispatch to Collector
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── DETAIL VIEW ── */}
      {detail ? (
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
              {/* Fix #20: .ta-back-btn with focus ring */}
              <button
                className="ta-back-btn"
                onClick={() => {
                  setDetailId(null);
                  setPhotoZoomed(false);
                }}
              >
                <ChevronLeft size={14} aria-hidden="true" />{" "}
                Back to reports
              </button>
              {/* Fix #1: <h1> not <p> */}
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1a1e25",
                  letterSpacing: "-0.02em",
                }}
              >
                {detail.id}
              </h1>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 12.5,
                  color: "#8a9099",
                  fontWeight: 500,
                }}
              >
                {detail.wasteType} waste — {detail.address},{" "}
                {detail.district}
              </p>
            </div>
          </div>

          <div className="ta-detail-view">
            {/* Evidence Photo */}
            <div className="ta-photo-card">
              <div className="ta-photo-header">
                <span className="ta-photo-title">
                  Evidence Photo
                </span>
                {detail.hasPhoto && detail.photoUrl && (
                  <button
                    className="ta-photo-zoom-btn"
                    onClick={() => setPhotoZoomed(true)}
                  >
                    <ZoomIn size={11} aria-hidden="true" /> View
                    Full Size
                  </button>
                )}
              </div>
              {detail.hasPhoto && detail.photoUrl ? (
                /* Fix #29: descriptive alt */
                <img
                  className="ta-photo-img"
                  src={detail.photoUrl}
                  alt={`Evidence photo for report ${detail.id}`}
                />
              ) : (
                <div className="ta-no-photo">
                  <Camera
                    size={28}
                    color="#c4c9d4"
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: "#aab0bb",
                      fontWeight: 600,
                    }}
                  >
                    No photo submitted
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="ta-info-card">
              <div className="ta-info-header">
                Reporter's Description
              </div>
              <p className="ta-description-text">
                {detail.description}
              </p>
            </div>

            {/* Fix #7: responsive two-col via .ta-detail-two-col */}
            <div className="ta-detail-two-col">
              <div
                className="ta-info-card"
                style={{ margin: 0 }}
              >
                <div className="ta-info-header">
                  Report Details
                </div>
                <div className="ta-info-body">
                  <div className="ta-info-row">
                    <span className="ta-info-key">
                      Waste Type
                    </span>
                    <span className="ta-info-val">
                      {detail.wasteType}
                    </span>
                  </div>
                  <div className="ta-info-row">
                    <span className="ta-info-key">
                      Priority
                    </span>
                    <span
                      className="ta-info-val"
                      style={{
                        color:
                          priorityStyle[detail.priority].color,
                      }}
                    >
                      {priorityStyle[detail.priority].label}
                    </span>
                  </div>
                  <div className="ta-info-row">
                    <span className="ta-info-key">
                      District
                    </span>
                    <span className="ta-info-val">
                      {detail.district}
                    </span>
                  </div>
                  <div className="ta-info-row">
                    <span className="ta-info-key">Address</span>
                    <span className="ta-info-val">
                      {detail.address}
                    </span>
                  </div>
                  <div className="ta-info-row">
                    <span className="ta-info-key">Photo</span>
                    <span
                      className="ta-info-val"
                      style={{
                        color: detail.hasPhoto
                          ? "var(--green, #1cb97a)"
                          : "#aab0bb",
                      }}
                    >
                      {detail.hasPhoto ? "Submitted" : "None"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="ta-info-card"
                style={{ margin: 0 }}
              >
                <div className="ta-info-header">
                  Citizen & Assignment
                </div>
                <div className="ta-info-body">
                  <div className="ta-info-row">
                    <span className="ta-info-key">
                      Reported by
                    </span>
                    <span className="ta-info-val">
                      {detail.citizenName}
                    </span>
                  </div>
                  <div className="ta-info-row">
                    <span className="ta-info-key">
                      Submitted
                    </span>
                    <span className="ta-info-val">
                      {formatDateTime(detail.submittedAt)}
                    </span>
                  </div>
                  <div className="ta-info-row">
                    <span className="ta-info-key">Status</span>
                    <span
                      className="ta-info-val"
                      style={{
                        color: statusStyle[detail.status].color,
                      }}
                    >
                      {statusStyle[detail.status].label}
                    </span>
                  </div>
                  <div className="ta-info-row">
                    <span className="ta-info-key">
                      Assigned to
                    </span>
                    <span
                      className="ta-info-val"
                      style={{
                        color: detail.assignedTo
                          ? "#1a1e25"
                          : "#aab0bb",
                        fontStyle: detail.assignedTo
                          ? "normal"
                          : "italic",
                      }}
                    >
                      {detail.assignedTo ?? "Unassigned"}
                    </span>
                  </div>
                  {detail.assignedAt && (
                    <div className="ta-info-row">
                      <span className="ta-info-key">
                        Assigned on
                      </span>
                      <span className="ta-info-val">
                        {detail.assignedAt}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detail footer */}
            <div className="ta-detail-footer">
              <span
                style={{
                  fontSize: 11.5,
                  color: "#8a9099",
                  fontWeight: 600,
                }}
              >
                Report {detail.id}
              </span>
              {detail.status === "completed" ? (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--green, #1cb97a)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <CheckCircle size={13} aria-hidden="true" />{" "}
                  Completed
                </span>
              ) : detail.status === "in_progress" ? (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--blue, #1a5fa8)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Truck size={13} aria-hidden="true" />{" "}
                  Assigned to {detail.assignedTo}
                </span>
              ) : (
                <button
                  className="ta-btn ta-btn-assign"
                  onClick={() => {
                    setAssignModal(detail);
                    setSelectedCollector(null);
                  }}
                >
                  <ClipboardCheck
                    size={12}
                    aria-hidden="true"
                  />
                  Assign Collector
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── LIST VIEW ── */
        <>
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
              {/* Fix #1: <h1> for list view title */}
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1a1e25",
                  letterSpacing: "-0.02em",
                }}
              >
                Task Assignment
              </h1>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 12.5,
                  color: "#8a9099",
                  fontWeight: 500,
                }}
              >
                Review submitted reports and dispatch collectors
              </p>
            </div>
          </div>

          <div className="ta-body">
            {/* Fix #22: role="status" so success is announced */}
            {successBanner && (
              <div
                className="ta-success-banner"
                role="status"
                aria-live="polite"
              >
                <CheckCircle2
                  size={15}
                  color="var(--green, #1cb97a)"
                  style={{ flexShrink: 0 }}
                  aria-hidden="true"
                />
                {successBanner}
              </div>
            )}
            {/* Error state */}
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#fee",
                  border: "1px solid #fcc",
                  borderRadius: "6px",
                  fontSize: "12.5px",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}
            {/* Loading state */}
            {loading && (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  color: "#6b7a8f",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    width: 20,
                    height: 20,
                    border: "3px solid #e5e7eb",
                    borderTop: "3px solid #1a5fa8",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                    marginBottom: "8px",
                  }}
                />
                <p style={{ margin: "8px 0 0" }}>Loading reports and collectors...</p>
              </div>
            )}

            {/* Fix #21: role="status" on toast; aria-label on close button */}
            {pendingCount > 0 && showToast && (
              <div
                className="ta-toast"
                role="status"
                aria-live="polite"
              >
                <AlertTriangle
                  size={14}
                  color="#f59e0b"
                  style={{ flexShrink: 0 }}
                  aria-hidden="true"
                />
                <span>
                  <strong>
                    {pendingCount} report
                    {pendingCount > 1 ? "s" : ""}
                  </strong>{" "}
                  still unassigned — assign a collector to
                  dispatch immediately.
                </span>
                <button
                  className="ta-toast-close"
                  onClick={() => setShowToast(false)}
                  aria-label="Dismiss notification"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Toolbar and content - only show when not loading */}
            {!loading && (
              <>
            {/* Toolbar */}
            <div className="ta-toolbar">
              <div className="ta-search-wrap">
                <Search
                  size={13}
                  className="ta-search-icon"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  className="ta-input"
                  placeholder="Search by ID, district, type…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search reports"
                />
              </div>

              {/* Fix #27: aria-label on selects */}
              <div className="ta-select-wrap">
                <Filter
                  size={13}
                  style={{ left: 11 }}
                  className="ta-select-icon"
                  aria-hidden="true"
                />
                <select
                  className="ta-select"
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value as Status | "all",
                    )
                  }
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown
                  size={12}
                  style={{ right: 9 }}
                  className="ta-select-icon"
                  aria-hidden="true"
                />
              </div>

              <div className="ta-select-wrap">
                <select
                  className="ta-select-plain"
                  value={filterPriority}
                  onChange={(e) =>
                    setFilterPriority(
                      e.target.value as Priority | "all",
                    )
                  }
                  aria-label="Filter by priority"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown
                  size={12}
                  style={{ right: 9 }}
                  className="ta-select-icon"
                  aria-hidden="true"
                />
              </div>

              <span
                className="ta-count"
                aria-live="polite"
                aria-atomic="true"
              >
                {filtered.length} result
                {filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Report cards — Fix #11/#12: <button> with aria-label and focus ring */}
            {filtered.length === 0 ? (
              <div className="ta-empty">
                <Package
                  size={40}
                  color="#aab0bb"
                  style={{
                    margin: "0 auto 10px",
                    display: "block",
                    opacity: 0.4,
                  }}
                  aria-hidden="true"
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#aab0bb",
                  }}
                >
                  No reports match your filters.
                </p>
              </div>
            ) : (
              filtered.map((row) => {
                const p = priorityStyle[row.priority];
                const s = statusStyle[row.status];
                return (
                  <button
                    key={row.id}
                    className="ta-card"
                    onClick={() => setDetailId(row.id)}
                    aria-label={`Report ${row.id}, ${row.wasteType} waste, ${p.label} priority, ${row.district}, ${s.label}`}
                  >
                    <div className="ta-card-top">
                      <div
                        className="ta-card-icon"
                        aria-hidden="true"
                      >
                        <AlertTriangle
                          size={17}
                          aria-hidden="true"
                        />
                      </div>

                      <div>
                        <div className="ta-card-id">
                          {row.id}
                        </div>
                        <div className="ta-card-type">
                          <strong
                            style={{
                              color: "#1a1e25",
                              fontWeight: 700,
                            }}
                          >
                            {row.wasteType}
                          </strong>{" "}
                          waste —{" "}
                          <span
                            className="ta-label"
                            style={{ color: p.color }}
                          >
                            {p.label}
                          </span>{" "}
                          priority
                        </div>
                        <div className="ta-card-meta">
                          <span className="ta-card-meta-item">
                            <MapPin
                              size={10}
                              aria-hidden="true"
                            />
                            {row.district}
                          </span>
                          <span className="ta-card-meta-item">
                            <User
                              size={10}
                              aria-hidden="true"
                            />
                            {row.citizenName}
                          </span>
                          <span className="ta-card-meta-item">
                            <Calendar
                              size={10}
                              aria-hidden="true"
                            />
                            {formatDateTime(row.submittedAt)}
                          </span>
                          {row.hasPhoto && (
                            <span
                              className="ta-card-meta-item"
                              style={{
                                color: "var(--green, #1cb97a)",
                              }}
                            >
                              <Camera
                                size={10}
                                aria-hidden="true"
                              />{" "}
                              Photo attached
                            </span>
                          )}
                        </div>
                        {row.assignedTo && (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 10.5,
                              color: "#aab0bb",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <Truck
                              size={10}
                              aria-hidden="true"
                            />{" "}
                            Assigned to {row.assignedTo}
                          </div>
                        )}
                      </div>

                      {/* Actions — Fix #25: disabled attribute on non-interactive buttons */}
                      <div className="ta-card-actions">
                        {row.status === "completed" ? (
                          <button
                            className="ta-btn-completed"
                            disabled
                            aria-disabled="true"
                            tabIndex={-1}
                          >
                            <CheckCircle
                              size={13}
                              aria-hidden="true"
                            />{" "}
                            Completed
                          </button>
                        ) : row.status === "in_progress" ? (
                          <button
                            className="ta-btn ta-btn-assigned"
                            disabled
                            aria-disabled="true"
                            tabIndex={-1}
                          >
                            <Truck
                              size={12}
                              aria-hidden="true"
                            />{" "}
                            Assigned
                          </button>
                        ) : (
                          <button
                            className="ta-btn ta-btn-assign"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignModal(row);
                              setSelectedCollector(null);
                            }}
                          >
                            <ClipboardCheck
                              size={12}
                              aria-hidden="true"
                            />{" "}
                            Assign
                          </button>
                        )}
                        {/* Fix #28: aria-hidden on decorative chevron */}
                        <span
                          aria-hidden="true"
                          style={{
                            color: "#c4c9d4",
                            marginTop: 8,
                          }}
                        >
                          <ChevronRight
                            size={14}
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
            </>
            )}
          </div>
        </>
      )}
    </div>
  );
}