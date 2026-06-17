import { useState, useEffect, useCallback } from "react";
import {
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  Save,
  Eye,
  Calendar,
  Award,
  Truck,
  ChevronLeft,
  Mail,
  User,
  Loader2,
} from "lucide-react";
import {
  loadCollectorRoster,
  createCollectorFromForm,
  updateCollectorFromForm,
  deleteCollector as removeCollectorFromBackend,
  type CollectorRosterEntry,
} from "../../../../services/supervisorWasteService";

type CollectorStatus = "free" | "available" | "active" | "busy";

interface Collector extends CollectorRosterEntry {}

function getEffectiveCompleted(
  todayTasks: number,
  completedTasks: number,
): number {
  return todayTasks > 0 ? completedTasks : 0;
}

function getStatus(todayTasks: number): CollectorStatus {
  if (todayTasks === 0) return "free";
  if (todayTasks <= 10) return "available";
  if (todayTasks <= 19) return "active";
  return "busy";
}

// ── CSS-variable-based status classes ───────────────────────────────────────
const STATUS_CLASS: Record<CollectorStatus, string> = {
  free: "cp-status-free",
  available: "cp-status-available",
  active: "cp-status-active",
  busy: "cp-status-busy",
};
const STATUS_LABEL: Record<CollectorStatus, string> = {
  free: "Free",
  available: "Available",
  active: "Active",
  busy: "Busy",
};

// ── Bar-fill class per status ────────────────────────────────────────────────
const BAR_CLASS: Record<CollectorStatus, string> = {
  free: "cp-bar-fill--free",
  available: "cp-bar-fill--available",
  active: "cp-bar-fill--active",
  busy: "cp-bar-fill--busy",
};

// ── Stat card gradient tokens ────────────────────────────────────────────────
const STAT_GRADIENTS: Record<
  string,
  { from: string; to: string }
> = {
  blue: {
    from: "var(--blue-light, #60a5fa)",
    to: "var(--blue,  #3b82f6)",
  },
  orange: {
    from: "var(--orange-light, #fb923c)",
    to: "var(--orange, #f97316)",
  },
  green: {
    from: "var(--green-light, #4ade80)",
    to: "var(--green,  #16a34a)",
  },
};

function StatusLabel({ todayTasks }: { todayTasks: number }) {
  const s = getStatus(todayTasks);
  return (
    <span className={`cp-status-label ${STATUS_CLASS[s]}`}>
      {STATUS_LABEL[s]}
    </span>
  );
}

// ── Accessible progress bar ──────────────────────────────────────────────────
function LoadBar({
  pct,
  status,
  label,
}: {
  pct: number;
  status: CollectorStatus;
  label: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="cp-bar-track"
    >
      <div
        className={`cp-bar-fill ${BAR_CLASS[status]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const DISTRICTS = [
  "Poto-Poto",
  "Moungali",
  "Bacongo",
  "Ouenzé",
  "Talangaï",
  "Mfilou",
  "Makélékélé",
  "Plateau des 15 Ans",
];
const VEHICLES = [
  "Truck — BZV-1041",
  "Truck — BZV-0892",
  "Pickup — BZV-2033",
  "Pickup — BZV-1774",
  "Motorbike — BZV-3310",
  "Motorbike — BZV-4421",
];
const EMPTY_FORM: Omit<
  Collector,
  "id" | "backendId" | "todayTasks" | "completedTasks" | "totalCompleted"
> = {
  name: "",
  phone: "",
  district: "",
  joined: new Date().toISOString().slice(0, 10),
  email: "",
  nationalId: "",
  vehicle: "",
  notes: "",
};

// ── Stat card definitions (module scope — not recreated on every render) ──────
const SUMMARY_STAT_DEFS = [
  {
    label: "Total Completed",
    icon: Award,
    color: "blue",
    trend: "all-time collections across team",
    key: "grandTotal" as const,
  },
  {
    label: "Assigned Today",
    icon: Clock,
    color: "orange",
    trend: "tasks across all agents",
    key: "totalTodayTasks" as const,
  },
  {
    label: "Completed Today",
    icon: TrendingUp,
    color: "green",
    trend: "tasks finished today",
    key: "totalCompletedToday" as const,
  },
];

function formatJoined(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    CollectorStatus | "all"
  >("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [inlineEdit, setInlineEdit] = useState<
    Partial<Collector>
  >({});
  const [inlineDirty, setInlineDirty] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    null,
  );
  const [form, setForm] =
    useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof typeof EMPTY_FORM, string>>
  >({});

  const refreshCollectors = useCallback(async () => {
    const data = await loadCollectorRoster();
    setCollectors(data);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        await refreshCollectors();
        setError(null);
      } catch (err) {
        console.error("Failed to load collectors:", err);
        setError("Failed to load collectors. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshCollectors]);

  // ── Escape key handler for both modals ─────────────────────────────────────
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showForm) {
        setShowForm(false);
        return;
      }
      if (deleteId) {
        setDeleteId(null);
        return;
      }
    },
    [showForm, deleteId],
  );
  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () =>
      document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  const filtered = collectors.filter((c) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.phone.includes(q);
    const matchStatus =
      filterStatus === "all" ||
      getStatus(c.todayTasks) === filterStatus;
    return matchQ && matchStatus;
  });

  const detail = collectors.find((c) => c.id === detailId);
  const detailMerged = detail
    ? { ...detail, ...inlineEdit }
    : null;
  const collectorToDelete = collectors.find(
    (c) => c.id === deleteId,
  );

  // ── Aggregate stats (derived inline, no intermediate array allocation) ──────
  const grandTotal = collectors.reduce(
    (a, c) => a + c.totalCompleted,
    0,
  );
  const totalTodayTasks = collectors.reduce(
    (a, c) => a + c.todayTasks,
    0,
  );
  const totalCompletedToday = collectors.reduce(
    (a, c) =>
      a + getEffectiveCompleted(c.todayTasks, c.completedTasks),
    0,
  );
  const statValues = {
    grandTotal,
    totalTodayTasks,
    totalCompletedToday,
  };

  function openDetail(id: string) {
    setDetailId(id);
    setInlineEdit({});
    setInlineDirty(false);
  }
  function closeDetail() {
    setDetailId(null);
    setInlineEdit({});
    setInlineDirty(false);
  }
  function updateInline<K extends keyof Collector>(
    key: K,
    value: Collector[K],
  ) {
    setInlineEdit((prev) => ({ ...prev, [key]: value }));
    setInlineDirty(true);
  }

  function handleInlineSave() {
    if (!detailId || !detail) return;
    setSaving(true);
    updateCollectorFromForm(detail.backendId, {
      name: detailMerged?.name ?? detail.name,
      phone: detailMerged?.phone ?? detail.phone,
      district: detailMerged?.district ?? detail.district,
      nationalId: detailMerged?.nationalId ?? detail.nationalId,
    })
      .then(() => refreshCollectors())
      .then(() => {
        setInlineDirty(false);
        setInlineEdit({});
        flash(
          `${detailMerged?.name ?? detail.name}'s profile updated.`,
        );
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to save changes",
        );
      })
      .finally(() => setSaving(false));
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setShowForm(true);
  }

  function validateForm() {
    const errors: typeof formErrors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.phone.trim()) errors.phone = "Phone is required";
    if (!form.district)
      errors.district = "District is required";
    if (!form.email.trim()) errors.email = "Email is required";
    if (!form.nationalId.trim())
      errors.nationalId = "National ID is required";
    return errors;
  }

  function handleSave() {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setSaving(true);
    createCollectorFromForm({
      name: form.name,
      phone: form.phone,
      district: form.district,
      email: form.email,
      nationalId: form.nationalId,
    })
      .then(() => refreshCollectors())
      .then(() => {
        flash(`${form.name} added to the team. Default password: ChangeMe123!`);
        setShowForm(false);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to add collector",
        );
      })
      .finally(() => setSaving(false));
  }

  function handleDelete() {
    if (!deleteId) return;
    const target = collectorToDelete?.name ?? "";
    const backendId = collectorToDelete?.backendId;
    if (!backendId) return;
    const wasViewing = detailId === deleteId;
    setSaving(true);
    removeCollectorFromBackend(backendId)
      .then(() => refreshCollectors())
      .then(() => {
        setDeleteId(null);
        if (wasViewing) closeDetail();
        flash(`${target} removed from the team.`);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to remove collector",
        );
      })
      .finally(() => setSaving(false));
  }

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: 48,
          color: "#6b7a8f",
          fontFamily: "'Nunito Sans', sans-serif",
        }}
      >
        <Loader2 size={20} aria-hidden="true" />
        Loading collectors…
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily:
          "'Nunito Sans','DM Sans',-apple-system,sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        /* ── Status label colours via CSS variables ── */
        .cp-status-label{font-size:11.5px;font-weight:800;letter-spacing:0.02em}
        .cp-status-free     {color:var(--grey,  #9aa0ac)}
        .cp-status-available{color:var(--green, #1cb97a)}
        .cp-status-active   {color:var(--amber, #f59e0b)}
        .cp-status-busy     {color:var(--red,   #e53e3e)}

        /* ── Progress bar fill colours via CSS variables ── */
        .cp-bar-fill--free     {background:var(--grey,  #9aa0ac)}
        .cp-bar-fill--available{background:var(--green, #1cb97a)}
        .cp-bar-fill--active   {background:var(--amber, #f59e0b)}
        .cp-bar-fill--busy     {background:var(--red,   #e53e3e)}

        /* ── Stat number colours via CSS variables ── */
        .cp-num-blue  {color:var(--blue,  #3b82f6)}
        .cp-num-amber {color:var(--amber, #f59e0b)}
        .cp-num-green {color:var(--green, #1cb97a)}

        .cp-body{background:#f7f8fa;border:1px solid #dde1e7;border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:10px}

        /* ── Stats grid: 3-col → 1-col on mobile ── */
        .cp-stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        @media(max-width:500px){.cp-stats-grid{grid-template-columns:1fr}}

        .cp-stat-card{background:#fff;border:1px solid #dde1e7;border-radius:8px;padding:10px 16px;display:flex;flex-direction:column}
        .cp-stat-icon{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 6px 16px rgba(0,0,0,0.13)}
        .cp-stat-label{font-size:12px;font-weight:600;color:#9aa0ac;margin-bottom:2px}
        .cp-stat-value{font-size:28px;font-weight:800;color:#1a1e25;letter-spacing:-0.04em;line-height:1}
        .cp-stat-trend{font-size:11px;font-weight:700;color:#aab0bb;margin-top:8px}
        .cp-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .cp-search-wrap{position:relative;flex:1 1 180px}
        .cp-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#aab0bb;pointer-events:none}

        /* ── Inputs / selects — min-height + iOS zoom fix ── */
        .cp-input{width:100%;padding:8px 12px 8px 34px;border:1px solid #dde1e7;border-radius:6px;font-size:12.5px;font-weight:600;color:#1a1e25;background:#fff;font-family:inherit;outline:none;transition:border-color 0.15s;box-sizing:border-box;min-height:40px}
        .cp-input:focus{border-color:#1cb97a}
        .cp-input:focus-visible{outline:2px solid #1cb97a;outline-offset:1px}
        .cp-input::placeholder{color:#aab0bb;font-weight:500}
        .cp-select{padding:8px 28px 8px 12px;border:1px solid #dde1e7;border-radius:6px;font-size:12.5px;font-weight:600;color:#1a1e25;background:#fff;font-family:inherit;appearance:none;cursor:pointer;outline:none;transition:border-color 0.15s;min-height:40px}
        .cp-select:focus{border-color:#1cb97a}
        .cp-select:focus-visible{outline:2px solid #1cb97a;outline-offset:1px}
        @media(max-width:640px){
          .cp-input,.cp-select{font-size:16px}
        }

        .cp-section-header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#f0f2f5;border-bottom:1px solid #dde1e7}
        .cp-section-title{font-size:11px;font-weight:800;color:#4a5568;text-transform:uppercase;letter-spacing:0.07em}
        .cp-section-subtitle{font-size:11px;color:#9aa0ac}
        .cp-count{font-size:10.5px;font-weight:800;background:#fff;color:#6b7a8f;padding:3px 10px;border-radius:4px;border:1px solid #dde1e7;letter-spacing:0.03em;flex-shrink:0}

        /* ── Collector grid: 2-col → 1-col on mobile ── */
        .cp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
        @media(max-width:540px){.cp-grid{grid-template-columns:1fr}}

        .cp-card{background:#fff;border:1px solid #dde1e7;border-radius:8px;overflow:hidden;display:flex;flex-direction:column}
        .cp-card-top{padding:14px 16px;display:flex;align-items:flex-start;gap:12px;border-bottom:1px solid #eef0f3}
        .cp-avatar{width:42px;height:42px;border-radius:50%;background:#f0f2f5;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#4a5568;flex-shrink:0}
        .cp-name{font-size:13.5px;font-weight:800;color:#1a1e25;margin-bottom:4px}
        .cp-meta{display:flex;flex-wrap:wrap;gap:10px;font-size:11px;font-weight:600;color:#aab0bb}
        .cp-meta-item{display:flex;align-items:center;gap:3px}
        .cp-card-stats{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #eef0f3}
        .cp-card-stat{padding:12px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-right:1px solid #eef0f3}
        .cp-card-stat:last-child{border-right:none}
        .cp-stat-num{font-size:20px;font-weight:800;letter-spacing:-0.03em;line-height:1}
        .cp-stat-sublabel{font-size:10px;font-weight:800;color:#aab0bb;text-transform:uppercase;letter-spacing:0.06em}
        .cp-card-footer{padding:9px 16px;display:flex;align-items:center;justify-content:space-between;background:#f7f8fa}
        .cp-footer-text{font-size:10.5px;font-weight:700;color:#aab0bb}
        .cp-bar-wrap{display:flex;align-items:center;gap:8px}
        .cp-bar-track{width:72px;height:4px;background:#f0f2f5;border-radius:2px;overflow:hidden}
        .cp-bar-fill{height:100%;border-radius:2px;transition:width 0.3s}
        .cp-bar-label{font-size:10px;font-weight:800;color:#aab0bb;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap}
        .cp-card-actions{display:flex;align-items:center;gap:6px;padding:8px 12px;border-top:1px solid #eef0f3;background:#fff}

        /* ── Action buttons with min-height + focus rings ── */
        .cp-action-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:5px;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer;letter-spacing:0.02em;transition:opacity 0.12s;border:1px solid transparent;flex:1;justify-content:center;min-height:32px}
        .cp-action-btn:hover{opacity:0.8}
        .cp-action-btn:focus-visible{outline:2px solid #1cb97a;outline-offset:2px}
        .cp-btn-view{background:#f0f2f5;color:#4a5568;border-color:#dde1e7}
        .cp-btn-delete{background:#fee2e2;color:#b91c1c;border-color:#fca5a5}
        .cp-btn-add{display:inline-flex;align-items:center;gap:6px;background:#1cb97a;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:0.02em;transition:opacity 0.12s;min-height:40px}
        .cp-btn-add:hover{opacity:0.87}
        .cp-btn-add:focus-visible{outline:2px solid #1cb97a;outline-offset:2px}
        .cp-btn-back{display:inline-flex;align-items:center;gap:5px;background:none;border:none;cursor:pointer;font-size:12px;font-weight:700;color:#6b7a8f;font-family:inherit;padding:0;margin-bottom:6px}
        .cp-btn-back:hover{color:#1a1e25}
        .cp-btn-back:focus-visible{outline:2px solid #1cb97a;outline-offset:2px;border-radius:3px}

        /* ── Success / live region ── */
        .cp-success{background:#d1fae5;border:1px solid #6ee7b7;border-radius:8px;padding:10px 16px;display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:700;color:#065f46}
        .cp-empty{text-align:center;padding:48px 16px;font-size:13px;color:#aab0bb}
        .cp-detail-view{display:flex;flex-direction:column;gap:0;animation:cp-fade-in 0.18s ease}
        @keyframes cp-fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .cp-hero-card{background:#fff;border:1px solid #dde1e7;border-radius:8px;overflow:hidden;margin-bottom:8px}
        .cp-hero-header{background:#f0f2f5;border-bottom:1px solid #dde1e7;padding:10px 16px;font-size:11px;font-weight:800;color:#4a5568;text-transform:uppercase;letter-spacing:0.07em}
        .cp-hero-body{padding:20px 20px 16px;display:flex;align-items:center;gap:20px}
        .cp-hero-avatar{width:72px;height:72px;border-radius:50%;background:#f0f2f5;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#4a5568;flex-shrink:0}
        .cp-hero-name{font-size:18px;font-weight:800;color:#1a1e25;margin-bottom:3px;letter-spacing:-0.01em}
        .cp-hero-role{font-size:12.5px;color:#8a9099;font-weight:500;margin-bottom:6px}
        .cp-hero-meta{display:flex;gap:16px;flex-wrap:wrap;align-items:center}
        .cp-status-hint{font-size:10px;font-weight:600;color:#aab0bb;margin-top:5px}
        .cp-perf-row{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #eef0f3}
        .cp-perf-cell{padding:14px 0;display:flex;flex-direction:column;align-items:center;gap:3px;border-right:1px solid #eef0f3}
        .cp-perf-cell:last-child{border-right:none}
        .cp-perf-num{font-size:24px;font-weight:800;letter-spacing:-0.03em;line-height:1}
        .cp-perf-label{font-size:10px;font-weight:800;color:#aab0bb;text-transform:uppercase;letter-spacing:0.06em}
        .cp-info-card{background:#fff;border:1px solid #dde1e7;border-radius:8px;overflow:hidden;margin-bottom:8px}
        .cp-info-card-header{background:#f0f2f5;border-bottom:1px solid #dde1e7;padding:10px 16px;font-size:11px;font-weight:800;color:#4a5568;text-transform:uppercase;letter-spacing:0.07em}
        .cp-info-body{padding:4px 0}
        .cp-info-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:6px 16px;border-bottom:1px solid #f0f2f5}
        .cp-info-row:last-child{border-bottom:none}
        .cp-info-key{font-size:11px;font-weight:700;color:#9aa0ac;flex-shrink:0;display:flex;align-items:center;gap:5px;min-width:120px}
        .cp-info-val{font-size:12.5px;font-weight:700;color:#1a1e25;text-align:right}

        /* ── Inline edit inputs — min-height + iOS zoom fix ── */
        .cp-inline-input{padding:5px 9px;border:1px solid #dde1e7;border-radius:5px;font-size:12.5px;font-weight:600;color:#1a1e25;background:#f7f8fa;font-family:inherit;outline:none;transition:border-color 0.15s,background 0.15s;text-align:right;width:100%;box-sizing:border-box;min-height:36px}
        .cp-inline-input:focus{border-color:#1cb97a;background:#fff}
        .cp-inline-input:focus-visible{outline:2px solid #1cb97a;outline-offset:1px}
        .cp-inline-select{padding:5px 9px;border:1px solid #dde1e7;border-radius:5px;font-size:12.5px;font-weight:600;color:#1a1e25;background:#f7f8fa;font-family:inherit;outline:none;appearance:none;cursor:pointer;transition:border-color 0.15s,background 0.15s;text-align:right;width:100%;min-height:36px}
        .cp-inline-select:focus{border-color:#1cb97a;background:#fff}
        .cp-inline-select:focus-visible{outline:2px solid #1cb97a;outline-offset:1px}
        .cp-inline-textarea{padding:6px 9px;border:1px solid #dde1e7;border-radius:5px;font-size:12.5px;font-weight:500;color:#1a1e25;background:#f7f8fa;font-family:inherit;outline:none;resize:none;transition:border-color 0.15s,background 0.15s;width:100%;box-sizing:border-box}
        .cp-inline-textarea:focus{border-color:#1cb97a;background:#fff}
        .cp-inline-textarea:focus-visible{outline:2px solid #1cb97a;outline-offset:1px}
        .cp-inline-number{padding:5px 9px;border:1px solid #dde1e7;border-radius:5px;font-size:12.5px;font-weight:600;color:#1a1e25;background:#f7f8fa;font-family:inherit;outline:none;transition:border-color 0.15s,background 0.15s;text-align:right;width:80px;min-height:36px}
        .cp-inline-number:focus{border-color:#1cb97a;background:#fff}
        .cp-inline-number:focus-visible{outline:2px solid #1cb97a;outline-offset:1px}
        @media(max-width:640px){
          .cp-inline-input,.cp-inline-select,.cp-inline-number,.cp-inline-textarea{font-size:16px}
        }

        /* ── Detail two-col info grid: stacks on mobile ── */
        .cp-detail-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
        @media(max-width:580px){.cp-detail-info-grid{grid-template-columns:1fr}}

        .cp-detail-footer{background:#f0f2f5;border:1px solid #dde1e7;border-radius:8px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}

        /* ── Modal overlay + animation ── */
        .cp-overlay{position:fixed;inset:0;background:rgba(10,14,20,0.55);z-index:200;backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center}
        .cp-modal{background:#fff;border:1px solid #dde1e7;border-radius:10px;box-shadow:0 24px 64px rgba(0,0,0,0.18);overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 64px);animation:cp-modal-in 0.18s ease}
        @keyframes cp-modal-in{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        .cp-modal-header{background:#f0f2f5;border-bottom:1px solid #dde1e7;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .cp-modal-title{font-size:11px;font-weight:800;color:#4a5568;text-transform:uppercase;letter-spacing:0.07em}
        .cp-modal-subtitle{font-size:11px;color:#9aa0ac;margin-top:1px}
        .cp-modal-close{width:26px;height:26px;border-radius:5px;border:1px solid #dde1e7;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#6b7a8f;transition:background 0.1s}
        .cp-modal-close:hover{background:#f0f2f5}
        .cp-modal-close:focus-visible{outline:2px solid #1cb97a;outline-offset:2px}
        .cp-modal-body{padding:16px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:16px}
        .cp-modal-footer{background:#f0f2f5;border-top:1px solid #dde1e7;padding:10px 16px;display:flex;gap:8px;justify-content:flex-end;flex-shrink:0}
        .cp-modal-btn-cancel{padding:7px 16px;border-radius:6px;border:1px solid #dde1e7;background:#fff;font-size:12.5px;font-weight:700;color:#4a5568;cursor:pointer;font-family:inherit;transition:background 0.1s;min-height:36px}
        .cp-modal-btn-cancel:hover{background:#f0f2f5}
        .cp-modal-btn-cancel:focus-visible{outline:2px solid #1cb97a;outline-offset:2px}
        .cp-modal-btn-save{padding:7px 18px;border-radius:6px;border:none;background:#1cb97a;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;transition:opacity 0.12s;min-height:36px}
        .cp-modal-btn-save:hover{opacity:0.87}
        .cp-modal-btn-save:focus-visible{outline:2px solid #1cb97a;outline-offset:2px}
        .cp-modal-btn-danger{padding:7px 18px;border-radius:6px;border:none;background:#dc2626;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;transition:opacity 0.12s;min-height:36px}
        .cp-modal-btn-danger:hover{opacity:0.87}
        .cp-modal-btn-danger:focus-visible{outline:2px solid #dc2626;outline-offset:2px}
        .cp-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(max-width:480px){.cp-form-grid{grid-template-columns:1fr}}
        .cp-form-group{display:flex;flex-direction:column;gap:5px}
        .cp-form-label{font-size:10.5px;font-weight:800;color:#4a5568;text-transform:uppercase;letter-spacing:0.06em}
        .cp-form-input{padding:8px 10px;border:1px solid #dde1e7;border-radius:6px;font-size:12.5px;font-weight:600;color:#1a1e25;background:#f7f8fa;font-family:inherit;outline:none;transition:border-color 0.15s;min-height:40px}
        .cp-form-input:focus{border-color:#1cb97a;background:#fff}
        .cp-form-input:focus-visible{outline:2px solid #1cb97a;outline-offset:1px}
        .cp-form-input.error{border-color:#ef4444}
        .cp-form-select{padding:8px 10px;border:1px solid #dde1e7;border-radius:6px;font-size:12.5px;font-weight:600;color:#1a1e25;background:#f7f8fa;font-family:inherit;outline:none;appearance:none;cursor:pointer;transition:border-color 0.15s;min-height:40px}
        .cp-form-select:focus{border-color:#1cb97a;background:#fff}
        .cp-form-select:focus-visible{outline:2px solid #1cb97a;outline-offset:1px}
        .cp-form-textarea{padding:8px 10px;border:1px solid #dde1e7;border-radius:6px;font-size:12.5px;font-weight:500;color:#1a1e25;background:#f7f8fa;font-family:inherit;outline:none;resize:none;transition:border-color 0.15s}
        .cp-form-textarea:focus{border-color:#1cb97a;background:#fff}
        .cp-form-textarea:focus-visible{outline:2px solid #1cb97a;outline-offset:1px}
        @media(max-width:640px){
          .cp-form-input,.cp-form-select,.cp-form-textarea{font-size:16px}
        }
        .cp-form-error{font-size:10.5px;color:#dc2626;font-weight:600}
        .cp-form-section{font-size:10.5px;font-weight:800;color:#4a5568;text-transform:uppercase;letter-spacing:0.07em;padding-bottom:6px;border-bottom:1px solid #eef0f3;margin-bottom:12px;margin-top:4px}
        .cp-btn-save-inline{display:inline-flex;align-items:center;gap:6px;background:#1cb97a;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:0.02em;transition:opacity 0.12s;min-height:36px}
        .cp-btn-save-inline:hover{opacity:0.87}
        .cp-btn-save-inline:focus-visible{outline:2px solid #1cb97a;outline-offset:2px}
        .cp-btn-save-inline:disabled{background:#a0cfbc;cursor:not-allowed;opacity:1}
      `}</style>

      {/* ── Add collector modal ──────────────────────────────────────────────── */}
      {showForm && (
        <div
          className="cp-overlay"
          onClick={() => setShowForm(false)}
          aria-hidden="true"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cp-add-modal-title"
            className="cp-modal"
            style={{
              width: 540,
              maxWidth: "calc(100vw - 32px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cp-modal-header">
              <div>
                <div
                  id="cp-add-modal-title"
                  className="cp-modal-title"
                >
                  Add New Collector
                </div>
                <div className="cp-modal-subtitle">
                  Register a new team member
                </div>
              </div>
              <button
                type="button"
                className="cp-modal-close"
                aria-label="Close add collector dialog"
                onClick={() => setShowForm(false)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="cp-modal-body">
              <fieldset
                style={{
                  border: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                <legend className="cp-form-section">
                  Personal Information
                </legend>
                <div className="cp-form-grid">
                  <div className="cp-form-group">
                    <label
                      className="cp-form-label"
                      htmlFor="cp-name"
                    >
                      Full Name{" "}
                      <span
                        style={{ color: "var(--red, #e53e3e)" }}
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>
                    <input
                      id="cp-name"
                      className={`cp-form-input${formErrors.name ? " error" : ""}`}
                      placeholder="e.g. Pierre Ngouabi"
                      value={form.name}
                      aria-required="true"
                      aria-describedby={
                        formErrors.name
                          ? "cp-err-name"
                          : undefined
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          name: e.target.value,
                        })
                      }
                    />
                    {formErrors.name && (
                      <span
                        id="cp-err-name"
                        className="cp-form-error"
                        role="alert"
                      >
                        {formErrors.name}
                      </span>
                    )}
                  </div>
                  <div className="cp-form-group">
                    <label
                      className="cp-form-label"
                      htmlFor="cp-nationalId"
                    >
                      National ID{" "}
                      <span
                        style={{ color: "var(--red, #e53e3e)" }}
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>
                    <input
                      id="cp-nationalId"
                      className={`cp-form-input${formErrors.nationalId ? " error" : ""}`}
                      placeholder="CG-YYYY-XXXX"
                      value={form.nationalId}
                      aria-required="true"
                      aria-describedby={
                        formErrors.nationalId
                          ? "cp-err-nationalId"
                          : undefined
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          nationalId: e.target.value,
                        })
                      }
                    />
                    {formErrors.nationalId && (
                      <span
                        id="cp-err-nationalId"
                        className="cp-form-error"
                        role="alert"
                      >
                        {formErrors.nationalId}
                      </span>
                    )}
                  </div>
                  <div className="cp-form-group">
                    <label
                      className="cp-form-label"
                      htmlFor="cp-phone"
                    >
                      Phone{" "}
                      <span
                        style={{ color: "var(--red, #e53e3e)" }}
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>
                    <input
                      id="cp-phone"
                      className={`cp-form-input${formErrors.phone ? " error" : ""}`}
                      placeholder="+242 0X XXX XXXX"
                      value={form.phone}
                      aria-required="true"
                      aria-describedby={
                        formErrors.phone
                          ? "cp-err-phone"
                          : undefined
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          phone: e.target.value,
                        })
                      }
                    />
                    {formErrors.phone && (
                      <span
                        id="cp-err-phone"
                        className="cp-form-error"
                        role="alert"
                      >
                        {formErrors.phone}
                      </span>
                    )}
                  </div>
                  <div className="cp-form-group">
                    <label
                      className="cp-form-label"
                      htmlFor="cp-email"
                    >
                      Email{" "}
                      <span
                        style={{ color: "var(--red, #e53e3e)" }}
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>
                    <input
                      id="cp-email"
                      className={`cp-form-input${formErrors.email ? " error" : ""}`}
                      placeholder="name@netprop.cg"
                      value={form.email}
                      aria-required="true"
                      aria-describedby={
                        formErrors.email
                          ? "cp-err-email"
                          : undefined
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          email: e.target.value,
                        })
                      }
                    />
                    {formErrors.email && (
                      <span
                        id="cp-err-email"
                        className="cp-form-error"
                        role="alert"
                      >
                        {formErrors.email}
                      </span>
                    )}
                  </div>
                </div>
              </fieldset>
              <fieldset
                style={{
                  border: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                <legend className="cp-form-section">
                  Assignment
                </legend>
                <div className="cp-form-grid">
                  <div className="cp-form-group">
                    <label
                      className="cp-form-label"
                      htmlFor="cp-district"
                    >
                      District{" "}
                      <span
                        style={{ color: "var(--red, #e53e3e)" }}
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>
                    <select
                      id="cp-district"
                      className={`cp-form-select${formErrors.district ? " error" : ""}`}
                      value={form.district}
                      aria-required="true"
                      aria-describedby={
                        formErrors.district
                          ? "cp-err-district"
                          : undefined
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          district: e.target.value,
                        })
                      }
                    >
                      <option value="">Select district</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    {formErrors.district && (
                      <span
                        id="cp-err-district"
                        className="cp-form-error"
                        role="alert"
                      >
                        {formErrors.district}
                      </span>
                    )}
                  </div>
                  <div className="cp-form-group">
                    <label
                      className="cp-form-label"
                      htmlFor="cp-vehicle"
                    >
                      Vehicle
                    </label>
                    <select
                      id="cp-vehicle"
                      className="cp-form-select"
                      value={form.vehicle}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          vehicle: e.target.value,
                        })
                      }
                    >
                      <option value="">Select vehicle</option>
                      {VEHICLES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="cp-form-group">
                    <label
                      className="cp-form-label"
                      htmlFor="cp-joined"
                    >
                      Start Date
                    </label>
                    <input
                      id="cp-joined"
                      type="date"
                      className="cp-form-input"
                      value={form.joined}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          joined: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </fieldset>
              <div className="cp-form-group">
                <label
                  className="cp-form-label"
                  htmlFor="cp-notes"
                >
                  Notes
                </label>
                <textarea
                  id="cp-notes"
                  className="cp-form-textarea"
                  rows={3}
                  placeholder="Optional notes…"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="cp-modal-footer">
              <button
                type="button"
                className="cp-modal-btn-cancel"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cp-modal-btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={12} aria-hidden="true" /> Add
                Collector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ────────────────────────────────────────── */}
      {deleteId && collectorToDelete && (
        <div
          className="cp-overlay"
          onClick={() => setDeleteId(null)}
          aria-hidden="true"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cp-delete-modal-title"
            className="cp-modal"
            style={{
              width: 400,
              maxWidth: "calc(100vw - 32px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cp-modal-header">
              <div>
                <div
                  id="cp-delete-modal-title"
                  className="cp-modal-title"
                >
                  Remove Collector
                </div>
                <div className="cp-modal-subtitle">
                  This action cannot be undone
                </div>
              </div>
              <button
                type="button"
                className="cp-modal-close"
                aria-label="Close remove collector dialog"
                onClick={() => setDeleteId(null)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="cp-modal-body">
              <div
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: 8,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <AlertTriangle
                  size={15}
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    marginTop: 1,
                    color: "var(--red, #dc2626)",
                  }}
                />
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: "#991b1b",
                    }}
                  >
                    Remove {collectorToDelete.name}?
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "#9f1239",
                      lineHeight: 1.5,
                    }}
                  >
                    This will permanently remove this collector
                    from the system. Any task assignments may be
                    affected.
                  </p>
                </div>
              </div>
              <div
                style={{
                  background: "#f7f8fa",
                  border: "1px solid #dde1e7",
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  className="cp-avatar"
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    fontSize: 11,
                  }}
                >
                  {initials(collectorToDelete.name)}
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#1a1e25",
                    }}
                  >
                    {collectorToDelete.name}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      color: "#aab0bb",
                      fontWeight: 600,
                    }}
                  >
                    {collectorToDelete.district} ·{" "}
                    {collectorToDelete.totalCompleted} total
                    collections
                  </p>
                </div>
              </div>
            </div>
            <div className="cp-modal-footer">
              <button
                type="button"
                className="cp-modal-btn-cancel"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cp-modal-btn-danger"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 size={12} aria-hidden="true" /> Remove
                Collector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail view ─────────────────────────────────────────────────────── */}
      {detailMerged && detail ? (
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
                className="cp-btn-back"
                type="button"
                onClick={closeDetail}
              >
                <ChevronLeft size={14} aria-hidden="true" />{" "}
                Back to collectors
              </button>
              {/* FIX #1: h1 for detail view title */}
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1a1e25",
                  letterSpacing: "-0.02em",
                }}
              >
                {detailMerged.name}
              </h1>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 12.5,
                  color: "#8a9099",
                  fontWeight: 500,
                }}
              >
                Waste Collector · {detailMerged.district} ·{" "}
                {detail.id}
              </p>
            </div>
            <button
              type="button"
              className="cp-action-btn cp-btn-delete"
              style={{ flex: "none" }}
              onClick={() => setDeleteId(detail.id)}
            >
              <Trash2 size={11} aria-hidden="true" /> Remove
            </button>
          </div>

          {/* FIX #31: success banner is a live region */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{ marginBottom: successMsg ? 8 : 0 }}
          >
            {successMsg && (
              <div className="cp-success">
                <CheckCircle2
                  size={15}
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    color: "var(--green, #1cb97a)",
                  }}
                />
                {successMsg}
              </div>
            )}
          </div>

          <div className="cp-detail-view">
            <div className="cp-hero-card">
              <div className="cp-hero-header">
                Collector Profile
              </div>
              <div className="cp-hero-body">
                <div
                  className="cp-hero-avatar"
                  aria-hidden="true"
                >
                  {initials(detailMerged.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="cp-hero-name">
                    {detailMerged.name}
                  </div>
                  <div className="cp-hero-role">
                    Waste Collector · {detailMerged.district}
                  </div>
                  <div className="cp-hero-meta">
                    <StatusLabel
                      todayTasks={detailMerged.todayTasks}
                    />
                    {detailMerged.vehicle && (
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#6b7a8f",
                        }}
                      >
                        {detailMerged.vehicle}
                      </span>
                    )}
                  </div>
                  <div className="cp-status-hint">
                    Status is automatic — Free (0) · Available
                    (1–10) · Active (11–19) · Busy (20+)
                  </div>
                </div>
              </div>
              {/* ── Perf row: Total > Today > Completed ── */}
              <div
                className="cp-perf-row"
                role="list"
                aria-label="Performance summary"
              >
                <div className="cp-perf-cell" role="listitem">
                  <span className="cp-perf-num cp-num-blue">
                    {detailMerged.totalCompleted}
                  </span>
                  <span className="cp-perf-label">Total</span>
                </div>
                <div className="cp-perf-cell" role="listitem">
                  <span className="cp-perf-num cp-num-amber">
                    {detailMerged.todayTasks}
                  </span>
                  <span className="cp-perf-label">Today</span>
                </div>
                <div className="cp-perf-cell" role="listitem">
                  <span className="cp-perf-num cp-num-green">
                    {getEffectiveCompleted(
                      detailMerged.todayTasks,
                      detailMerged.completedTasks,
                    )}
                  </span>
                  <span className="cp-perf-label">
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* ── Detail two-col info grid — responsive ── */}
            <div className="cp-detail-info-grid">
              <div
                className="cp-info-card"
                style={{ margin: 0 }}
              >
                <div className="cp-info-card-header">
                  Contact &amp; Identity
                </div>
                <div className="cp-info-body">
                  <div className="cp-info-row">
                    <span className="cp-info-key">
                      <Phone size={11} aria-hidden="true" />{" "}
                      Phone
                    </span>
                    <input
                      className="cp-inline-input"
                      aria-label="Phone number"
                      value={detailMerged.phone}
                      onChange={(e) =>
                        updateInline("phone", e.target.value)
                      }
                    />
                  </div>
                  <div className="cp-info-row">
                    <span className="cp-info-key">
                      <Mail size={11} aria-hidden="true" />{" "}
                      Email
                    </span>
                    <span className="cp-info-val">{detailMerged.email}</span>
                  </div>
                  <div className="cp-info-row">
                    <span className="cp-info-key">
                      <Award size={11} aria-hidden="true" />{" "}
                      National ID
                    </span>
                    <input
                      className="cp-inline-input"
                      aria-label="National ID"
                      value={detailMerged.nationalId}
                      onChange={(e) =>
                        updateInline(
                          "nationalId",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="cp-info-row">
                    <span className="cp-info-key">
                      <Calendar size={11} aria-hidden="true" />{" "}
                      Joined
                    </span>
                    <span className="cp-info-val">
                      {formatJoined(detailMerged.joined)}
                    </span>
                  </div>
                  <div className="cp-info-row">
                    <span className="cp-info-key">
                      <User size={11} aria-hidden="true" /> Full
                      Name
                    </span>
                    <input
                      className="cp-inline-input"
                      aria-label="Full name"
                      value={detailMerged.name}
                      onChange={(e) =>
                        updateInline("name", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
              <div
                className="cp-info-card"
                style={{ margin: 0 }}
              >
                <div className="cp-info-card-header">
                  Assignment Details
                </div>
                <div className="cp-info-body">
                  <div className="cp-info-row">
                    <span className="cp-info-key">
                      <MapPin size={11} aria-hidden="true" />{" "}
                      District
                    </span>
                    <select
                      className="cp-inline-select"
                      aria-label="District"
                      value={detailMerged.district}
                      onChange={(e) =>
                        updateInline("district", e.target.value)
                      }
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="cp-info-row">
                    <span className="cp-info-key">
                      <Truck size={11} aria-hidden="true" />{" "}
                      Vehicle
                    </span>
                    <select
                      className="cp-inline-select"
                      aria-label="Vehicle"
                      value={detailMerged.vehicle}
                      onChange={(e) =>
                        updateInline("vehicle", e.target.value)
                      }
                    >
                      <option value="">— None —</option>
                      {VEHICLES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="cp-info-row">
                    <span className="cp-info-key">
                      <CheckCircle2
                        size={11}
                        aria-hidden="true"
                      />{" "}
                      Status
                    </span>
                    <StatusLabel
                      todayTasks={detailMerged.todayTasks}
                    />
                  </div>
                  <div className="cp-info-row">
                    <span className="cp-info-key">
                      <Clock size={11} aria-hidden="true" />{" "}
                      Today (assigned)
                    </span>
                    <span className="cp-info-val">{detailMerged.todayTasks}</span>
                  </div>
                  <div className="cp-info-row">
                    <span className="cp-info-key">
                      <TrendingUp
                        size={11}
                        aria-hidden="true"
                      />{" "}
                      Completed
                    </span>
                    <span className="cp-info-val">
                      {getEffectiveCompleted(
                        detailMerged.todayTasks,
                        detailMerged.completedTasks,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="cp-info-card">
              <div className="cp-info-card-header">Notes</div>
              <div style={{ padding: "10px 16px" }}>
                <textarea
                  className="cp-inline-textarea"
                  rows={3}
                  aria-label="Collector notes"
                  placeholder="Add notes about this collector…"
                  value={detailMerged.notes}
                  onChange={(e) =>
                    updateInline("notes", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="cp-detail-footer">
              <span
                style={{
                  fontSize: 11.5,
                  color: "#8a9099",
                  fontWeight: 600,
                }}
              >
                {inlineDirty ? (
                  <span
                    style={{
                      color: "var(--amber, #f59e0b)",
                      fontWeight: 700,
                    }}
                  >
                    ● Unsaved changes
                  </span>
                ) : (
                  `Agent ${detail.id} · Member since ${formatJoined(detail.joined)}`
                )}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="cp-action-btn cp-btn-delete"
                  style={{ flex: "none" }}
                  onClick={() => setDeleteId(detail.id)}
                >
                  <Trash2 size={11} aria-hidden="true" /> Remove
                </button>
                <button
                  type="button"
                  className="cp-btn-save-inline"
                  onClick={handleInlineSave}
                  disabled={!inlineDirty || saving}
                >
                  <Save size={13} aria-hidden="true" /> Save
                  Changes
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ── List view ──────────────────────────────────────────────────────── */
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
              {/* FIX #1: h1 for list view title */}
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1a1e25",
                  letterSpacing: "-0.02em",
                }}
              >
                Collectors
              </h1>
              <p
                style={{
                  margin: "3px 0 0",
                  fontSize: 12.5,
                  color: "#8a9099",
                  fontWeight: 500,
                }}
              >
                Manage agents and their current workload
              </p>
            </div>
            <button
              type="button"
              className="cp-btn-add"
              onClick={openAdd}
            >
              <Plus size={14} aria-hidden="true" /> Add
              Collector
            </button>
          </div>

          <div className="cp-body">
            {error && (
              <div
                role="alert"
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#991b1b",
                }}
              >
                {error}
              </div>
            )}
            {/* FIX #31: live region for flash messages */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {successMsg && (
                <div className="cp-success">
                  <CheckCircle2
                    size={15}
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      color: "var(--green, #1cb97a)",
                    }}
                  />
                  {successMsg}
                </div>
              )}
            </div>

            {/* ── Summary stats: Total > Today > Completed ── */}
            {/* FIX #32: list semantics on stats grid */}
            <ul
              className="cp-stats-grid"
              role="list"
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
              {SUMMARY_STAT_DEFS.map((s) => {
                const Icon = s.icon;
                const grad = STAT_GRADIENTS[s.color];
                return (
                  <li
                    className="cp-stat-card"
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
                        className="cp-stat-icon"
                        aria-hidden="true"
                        style={{
                          background: `linear-gradient(135deg,${grad.from},${grad.to})`,
                        }}
                      >
                        <Icon
                          size={20}
                          color="#fff"
                          strokeWidth={2}
                        />
                      </div>
                      <div>
                        <div className="cp-stat-label">
                          {s.label}
                        </div>
                        <div className="cp-stat-value">
                          {statValues[s.key]}
                        </div>
                      </div>
                    </div>
                    <div className="cp-stat-trend">
                      {s.trend}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="cp-toolbar">
              <div className="cp-search-wrap">
                <Search
                  size={13}
                  className="cp-search-icon"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  className="cp-input"
                  placeholder="Search by name, phone or district…"
                  aria-label="Search collectors"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {/* FIX #25: aria-label on status filter select */}
              <select
                className="cp-select"
                aria-label="Filter by status"
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value as CollectorStatus | "all",
                  )
                }
              >
                <option value="all">All Statuses</option>
                <option value="free">Free</option>
                <option value="available">Available</option>
                <option value="active">Active</option>
                <option value="busy">Busy</option>
              </select>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #dde1e7",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div className="cp-section-header">
                <div>
                  <div className="cp-section-title">
                    All Collectors
                  </div>
                  <div className="cp-section-subtitle">
                    Agents registered in Brazzaville operations
                  </div>
                </div>
                {/* FIX #33: live region on count badge */}
                <span
                  className="cp-count"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {filtered.length} agent
                  {filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
              {filtered.length === 0 ? (
                /* FIX #34: status on empty message */
                <div className="cp-empty" role="status">
                  No collectors match your search.
                </div>
              ) : (
                <div style={{ padding: 12 }}>
                  {/* FIX #32: list semantics on collector grid */}
                  <ul
                    className="cp-grid"
                    role="list"
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    {filtered.map((c) => {
                      const s = getStatus(c.todayTasks);
                      const effectiveCompleted =
                        getEffectiveCompleted(
                          c.todayTasks,
                          c.completedTasks,
                        );
                      const loadPct =
                        c.todayTasks > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (effectiveCompleted /
                                  c.todayTasks) *
                                  100,
                              ),
                            )
                          : 0;
                      return (
                        <li
                          className="cp-card"
                          key={c.id}
                          role="listitem"
                        >
                          <div className="cp-card-top">
                            {/* FIX #36: avatar is presentational */}
                            <div
                              className="cp-avatar"
                              aria-hidden="true"
                            >
                              {initials(c.name)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="cp-name">
                                {c.name}
                              </div>
                              <div className="cp-meta">
                                <span className="cp-meta-item">
                                  <MapPin
                                    size={10}
                                    aria-hidden="true"
                                  />{" "}
                                  {c.district}
                                </span>
                                <span className="cp-meta-item">
                                  <Phone
                                    size={10}
                                    aria-hidden="true"
                                  />{" "}
                                  {c.phone}
                                </span>
                              </div>
                            </div>
                            <StatusLabel
                              todayTasks={c.todayTasks}
                            />
                          </div>
                          {/* ── Card stats: Total > Today > Completed ── */}
                          <div
                            className="cp-card-stats"
                            role="list"
                            aria-label={`${c.name} task summary`}
                          >
                            <div
                              className="cp-card-stat"
                              role="listitem"
                            >
                              <span className="cp-stat-num cp-num-blue">
                                {c.totalCompleted}
                              </span>
                              <span className="cp-stat-sublabel">
                                Total
                              </span>
                            </div>
                            <div
                              className="cp-card-stat"
                              role="listitem"
                            >
                              <span className="cp-stat-num cp-num-amber">
                                {c.todayTasks}
                              </span>
                              <span className="cp-stat-sublabel">
                                Today
                              </span>
                            </div>
                            <div
                              className="cp-card-stat"
                              role="listitem"
                            >
                              <span className="cp-stat-num cp-num-green">
                                {effectiveCompleted}
                              </span>
                              <span className="cp-stat-sublabel">
                                Completed
                              </span>
                            </div>
                          </div>
                          <div className="cp-card-footer">
                            <span className="cp-footer-text">
                              Since {formatJoined(c.joined)}
                            </span>
                            <div className="cp-bar-wrap">
                              <span
                                className="cp-bar-label"
                                aria-hidden="true"
                              >
                                Done
                              </span>
                              <LoadBar
                                pct={loadPct}
                                status={s}
                                label={`${c.name} completion rate: ${loadPct}%`}
                              />
                              <span
                                className="cp-bar-label"
                                aria-hidden="true"
                              >
                                {loadPct}%
                              </span>
                            </div>
                          </div>
                          <div className="cp-card-actions">
                            <button
                              type="button"
                              className="cp-action-btn cp-btn-view"
                              aria-label={`View ${c.name}'s profile`}
                              onClick={() => openDetail(c.id)}
                            >
                              <Eye
                                size={11}
                                aria-hidden="true"
                              />{" "}
                              View
                            </button>
                            <button
                              type="button"
                              className="cp-action-btn cp-btn-delete"
                              aria-label={`Remove ${c.name} from the team`}
                              onClick={() => setDeleteId(c.id)}
                            >
                              <Trash2
                                size={11}
                                aria-hidden="true"
                              />{" "}
                              Remove
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}