import { useState, useCallback, useEffect, useRef, Fragment } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  useRecycling,
  RecyclableAssignment,
  AssignmentStatus,
  DEFAULT_PRICES,
} from "../../../context/RecyclingContext";
import compensationConfigService from "../../../../services/compensationConfigService";
import { ReceiptService } from "../../../../services/receiptService";
import {
  Recycle,
  Building2,
  Users,
  Package,
  DollarSign,
  CheckCircle2,
  Search,
  Plus,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Truck,
  Receipt,
  X,
  Save,
  Trash2,
  ChevronLeft,
  AlertTriangle,
  Settings,
  FileText,
  Clock,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  MinusCircle,
  Scale,
  Lock,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type PartnerStatus = "active" | "inactive";
type Tab = "waste" | "compensation" | "partners";
type CompTab = "receipts" | "configure";

interface Partner {
  id: number;
  name: string;
  type: string;
  contact: string;
  email: string;
  location: string;
  materialsAccepted: string[];
  rate: string;
  status: PartnerStatus;
  totalCollected: string;
}

interface ReceiptRecord {
  id: string;
  receiptNo: string;
  partnerName: string;
  entriesCount: number;
  totalKg: number;
  grossAmount: number;
  netAmount: number;
  issuedAt: string;
}

function mapDownloadedReceipt(rec: {
  id: number;
  receiptNo: string;
  partnerName: string;
  entriesCount: number;
  totalKg: number;
  grossAmount: number;
  netAmount: number;
  issuedAt: string;
}): ReceiptRecord {
  return {
    id: String(rec.id),
    receiptNo: rec.receiptNo,
    partnerName: rec.partnerName,
    entriesCount: rec.entriesCount,
    totalKg: rec.totalKg,
    grossAmount: rec.grossAmount,
    netAmount: rec.netAmount,
    issuedAt: rec.issuedAt,
  };
}

// ── Material line item for the expanded editor ────────────────────────────────
interface MaterialLine {
  id: string;
  type: string;
  weightKg: string;
}

// ── Stored compensation record (from DB) ─────────────────────────────────────
interface CompensationRecord {
  id: number;
  assignmentId: number;
  citizenId: number | null;
  collectorId: number | null;
  partnerId: number | null;
  materialType: string;
  weightKg: number;
  materialBreakdown: string; // JSON string
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

// ── Assignment meta (IDs needed for compensation POST) ───────────────────────
interface AssignmentMeta {
  citizenId: number | null;
  collectorId: number | null;
}

const MATERIAL_OPTIONS = [
  "Metal", "Cans", "Plastic", "Bottles", "Glass", "Paper",
  "Cardboard", "Electronics", "Batteries", "Organic", "Textile", "Mixed",
];

const LOCATIONS = [
  "Poto-Poto", "Moungali", "Bacongo", "Ouenzé", "Talangaï",
  "Mfilou", "Makélékélé", "Plateau des 15 Ans",
];
const TYPES = [
  "Plastic & Metal", "Paper & Cardboard", "E-Waste", "Organic",
  "Glass", "Textile", "Mixed",
];
const ALL_MATERIALS = [
  "Plastic", "Metal", "Glass", "Paper", "Cardboard",
  "Electronics", "Batteries", "Organic", "Textile",
];

const EMPTY_FORM: Omit<Partner, "id"> = {
  name: "", type: "", contact: "", email: "", location: "",
  materialsAccepted: [], rate: "", status: "active", totalCollected: "0t",
};

const STAT_GRADIENTS: Record<string, { from: string; to: string }> = {
  violet: { from: "var(--violet-light, #9f86f7)", to: "var(--violet, #7c6be8)" },
  green:  { from: "var(--green-light, #34d9a0)",  to: "var(--green, #1cb97a)" },
  pink:   { from: "var(--pink-light, #ff8cb8)",   to: "var(--pink, #ff6b9d)" },
  cyan:   { from: "var(--cyan-light, #5de8ef)",   to: "var(--cyan, #34d9e0)" },
};

function buildTopStats(compensationMap: Record<number, CompensationRecord>) {
  // Count unique active partners
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
  const citizensCount = citizenIds.size;
  const totalCompensationLabel =
    totalCompensationXaf >= 1_000_000
      ? `${(totalCompensationXaf / 1_000_000).toFixed(1)}M XAF`
      : totalCompensationXaf >= 1_000
      ? `${Math.round(totalCompensationXaf / 1_000)}K XAF`
      : `${Math.round(totalCompensationXaf)} XAF`;

  return [
    { label: "Active Partners",      value: activePartnersCount.toString(),  icon: Building2,  color: "violet" },
    { label: "Waste Recycled",       value: wasteRecycledLabel,              icon: Recycle,    color: "green"  },
    { label: "Citizens Compensated", value: citizensCount.toString(),        icon: Users,      color: "pink"   },
    { label: "Total Compensation",   value: totalCompensationLabel,          icon: DollarSign, color: "cyan"   },
  ];
}

const INITIAL_PARTNERS: Partner[] = [
  {
    id: 1, name: "EcoRecycle Congo", type: "Plastic & Metal",
    contact: "+242 06 234 5678", email: "contact@ecorecycle.cg", location: "Poto-Poto",
    materialsAccepted: ["Plastic", "Metal", "Glass"], rate: "500 XAF/kg",
    status: "active", totalCollected: "2.5t",
  },
  {
    id: 2, name: "Green Partners SA", type: "Paper & Cardboard",
    contact: "+242 06 345 6789", email: "info@greenpartners.cg", location: "Bacongo",
    materialsAccepted: ["Paper", "Cardboard"], rate: "300 XAF/kg",
    status: "active", totalCollected: "1.8t",
  },
  {
    id: 3, name: "Electronic Waste Solutions", type: "E-Waste",
    contact: "+242 06 456 7890", email: "support@ewaste.cg", location: "Moungali",
    materialsAccepted: ["Electronics", "Batteries"], rate: "800 XAF/kg",
    status: "active", totalCollected: "0.9t",
  },
];

const TAB_DEFS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "waste",        label: "Recyclable Waste", icon: Package    },
  { id: "compensation", label: "Compensation",     icon: DollarSign },
  { id: "partners",     label: "Partners",         icon: Building2  },
];

const COMP_TAB_DEFS: { id: CompTab; label: string; icon: typeof Package }[] = [
  { id: "receipts",  label: "Receipts",  icon: FileText },
  { id: "configure", label: "Configure", icon: Settings },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function toggleMaterial(list: string[], m: string): string[] {
  return list.includes(m) ? list.filter((x) => x !== m) : [...list, m];
}
function fmt(n: number) {
  return (
    n.toLocaleString("fr-CG", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " XAF"
  );
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CG", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function newLine(): MaterialLine {
  return { id: Math.random().toString(36).slice(2), type: MATERIAL_OPTIONS[0], weightKg: "" };
}
function isExpandable(a: RecyclableAssignment) {
  return a.status === "completed";
}

// ── Safe JSON parse for materialBreakdown ────────────────────────────────────
function parseBreakdown(
  json: string,
): Array<{ type: string; weightKg: number; pricePerKg: number; gross: number }> {
  try { return JSON.parse(json) ?? []; } catch { return []; }
}

function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toIsoDate(value: unknown): string {
  if (value == null) return new Date().toISOString();
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value as number[];
    return new Date(year, month - 1, day, hour, minute, second).toISOString();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeCompensation(raw: Record<string, unknown>): CompensationRecord {
  return {
    id: toNumber(raw.id) ?? 0,
    assignmentId: toNumber(raw.assignmentId ?? raw.assignment_id) ?? 0,
    citizenId: toNumber(raw.citizenId ?? raw.citizen_id),
    collectorId: toNumber(raw.collectorId ?? raw.collector_id),
    partnerId: toNumber(raw.partnerId ?? raw.partner_id),
    assignPartnerId: toNumber(raw.assignPartnerId ?? raw.assign_partner_id),
    materialType: String(raw.materialType ?? raw.material_type ?? ""),
    weightKg: Number(raw.weightKg ?? raw.weight_kg ?? 0),
    materialBreakdown: String(raw.materialBreakdown ?? raw.material_breakdown ?? ""),
    pricePerKg: Number(raw.pricePerKg ?? raw.price_per_kg ?? 0),
    grossAmount: Number(raw.grossAmount ?? raw.gross_amount ?? 0),
    vatPct: Number(raw.vatPct ?? raw.vat_pct ?? 0),
    vatAmount: Number(raw.vatAmount ?? raw.vat_amount ?? 0),
    envLevyPct: Number(raw.envLevyPct ?? raw.env_levy_pct ?? 0),
    envLevyAmount: Number(raw.envLevyAmount ?? raw.env_levy_amount ?? 0),
    netAmount: Number(raw.netAmount ?? raw.net_amount ?? 0),
    citizenPct: Number(raw.citizenPct ?? raw.citizen_pct ?? 0),
    citizenAmount: Number(raw.citizenAmount ?? raw.citizen_amount ?? 0),
    collectorPct: Number(raw.collectorPct ?? raw.collector_pct ?? 0),
    collectorAmount: Number(raw.collectorAmount ?? raw.collector_amount ?? 0),
    systemPct: Number(raw.systemPct ?? raw.system_pct ?? 0),
    systemAmount: Number(raw.systemAmount ?? raw.system_amount ?? 0),
    compensatedAt: toIsoDate(raw.compensatedAt ?? raw.compensated_at),
  };
}

function resolveCompensationPartnerId(
  comp: CompensationRecord,
  assignPartnerToPartner: Record<number, number>,
): number | null {
  if (comp.partnerId != null) return Number(comp.partnerId);
  if (comp.assignPartnerId != null) {
    return assignPartnerToPartner[comp.assignPartnerId] ?? null;
  }
  return null;
}

async function fetchAssignPartnerPartnerId(
  assignPartnerId: number,
): Promise<number | null> {
  try {
    const res = await fetch(
      `http://localhost:8080/api/assign-partner/${assignPartnerId}`,
      { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" },
    );
    if (!res.ok) return null;
    const ap = await res.json();
    return toNumber(ap.partnerId ?? ap.partner_id);
  } catch {
    return null;
  }
}

async function hydrateCompensationPartnerIds(
  records: CompensationRecord[],
  assignPartnerToPartner: Record<number, number>,
): Promise<CompensationRecord[]> {
  const hydrated = [...records];

  for (const comp of hydrated) {
    if (comp.assignPartnerId != null && comp.partnerId == null) {
      const cached = assignPartnerToPartner[comp.assignPartnerId];
      if (cached != null) {
        comp.partnerId = cached;
        continue;
      }
      const fetched = await fetchAssignPartnerPartnerId(comp.assignPartnerId);
      if (fetched != null) {
        assignPartnerToPartner[comp.assignPartnerId] = fetched;
        comp.partnerId = fetched;
      }
    }
  }

  return hydrated;
}

// ── Material Editor Panel ────────────────────────────────────────────────────
interface MaterialEditorProps {
  assignment: RecyclableAssignment;
  lines: MaterialLine[];
  onLinesChange: (lines: MaterialLine[]) => void;
  partner: string;
  onPartnerChange: (p: string) => void;
  partnerNames: Array<{ id: number; name: string }>;
  onAssign: () => void;
  onClose: () => void;
}

function MaterialEditor({
  assignment, lines, onLinesChange, partner, onPartnerChange,
  partnerNames, onAssign, onClose,
}: MaterialEditorProps) {
  const totalKg = lines.reduce((s, l) => s + (parseFloat(l.weightKg) || 0), 0);

  function updateLine(id: string, field: keyof MaterialLine, value: string) {
    onLinesChange(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }
  function removeLine(id: string) {
    if (lines.length <= 1) return;
    onLinesChange(lines.filter((l) => l.id !== id));
  }
  function addLine() { onLinesChange([...lines, newLine()]); }

  const canAssign = partner && lines.every((l) => l.type && parseFloat(l.weightKg) > 0);

  return (
    <tr>
      <td colSpan={9} style={{ padding: 0, background: "transparent" }}>
        <div className="me-panel">
          <div className="me-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Scale size={13} color="#1cb97a" aria-hidden="true" />
              <span className="me-title">Edit Materials & Weights</span>
              <span className="me-sub">— {assignment.id} · {assignment.citizen}</span>
            </div>
            <button className="me-close-btn" onClick={onClose} aria-label="Close editor">
              <X size={13} />
            </button>
          </div>

          <div className="me-body">
            <div className="me-lines-wrap">
              <div className="me-lines-header">
                <span className="me-col-label" style={{ flex: "0 0 160px" }}>Material Type</span>
                <span className="me-col-label" style={{ flex: "0 0 120px" }}>Weight (kg)</span>
                <span className="me-col-label" style={{ flex: 1 }}></span>
              </div>
              {lines.map((line, idx) => (
                <div key={line.id} className="me-line-row">
                  <div className="me-line-index">{idx + 1}</div>
                  <div style={{ flex: "0 0 160px" }}>
                    <select
                      className="me-select"
                      value={line.type}
                      onChange={(e) => updateLine(line.id, "type", e.target.value)}
                      aria-label={`Material type for line ${idx + 1}`}
                    >
                      {MATERIAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "0 0 120px", position: "relative" }}>
                    <input
                      type="number"
                      className={`me-input ${!line.weightKg || parseFloat(line.weightKg) <= 0 ? "me-input-warn" : ""}`}
                      placeholder="0.00" min="0" step="0.01"
                      value={line.weightKg}
                      onChange={(e) => updateLine(line.id, "weightKg", e.target.value)}
                      aria-label={`Weight for line ${idx + 1}`}
                    />
                    <span className="me-input-unit">kg</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                    {parseFloat(line.weightKg) > 0 && (
                      <span className="me-weight-badge">{parseFloat(line.weightKg).toFixed(2)} kg</span>
                    )}
                    <button
                      className="me-remove-btn"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 1}
                      aria-label={`Remove line ${idx + 1}`}
                    >
                      <MinusCircle size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="me-add-btn" onClick={addLine}>
                <PlusCircle size={12} aria-hidden="true" /> Add Material
              </button>
            </div>

            <div className="me-sidebar">
              <div className="me-summary-card">
                <div className="me-summary-title">Summary</div>
                <div className="me-summary-row">
                  <span className="me-summary-label">Lines</span>
                  <span className="me-summary-val">{lines.length}</span>
                </div>
                <div className="me-summary-row">
                  <span className="me-summary-label">Total Weight</span>
                  <span className="me-summary-val" style={{ color: "#1cb97a", fontWeight: 800 }}>
                    {totalKg > 0 ? totalKg.toFixed(2) + " kg" : "—"}
                  </span>
                </div>
                {lines.map((l) =>
                  parseFloat(l.weightKg) > 0 && (
                    <div key={l.id} className="me-summary-line-item">
                      <span className="me-summary-mat">{l.type}</span>
                      <span className="me-summary-wt">{parseFloat(l.weightKg).toFixed(2)} kg</span>
                    </div>
                  ),
                )}
              </div>

              <div className="me-partner-group">
                <label className="me-partner-label" htmlFor={`me-partner-${assignment.id}`}>
                  Assign to Partner <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    id={`me-partner-${assignment.id}`}
                    className="me-partner-select"
                    value={partner}
                    onChange={(e) => onPartnerChange(e.target.value)}
                  >
                    <option value="">Select partner…</option>
                    {partnerNames.map(({ id, name }) => (
                      <option key={id} value={id.toString()}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12} color="#aab0bb" aria-hidden="true"
                    style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  />
                </div>
              </div>

              {!canAssign && (
                <div className="me-hint">
                  <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                  {!partner ? "Select a partner to continue." : "All lines must have a valid weight > 0."}
                </div>
              )}

              <button
                className="me-assign-btn"
                disabled={!canAssign}
                onClick={onAssign}
                aria-disabled={!canAssign}
              >
                <CheckCircle2 size={13} aria-hidden="true" /> Confirm & Assign
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── CompensationTab ───────────────────────────────────────────────────────────
interface CompensationTabProps {
  assignments: RecyclableAssignment[];
  partners: Partner[];
  compensationMap: Record<number, CompensationRecord>;
}

function CompensationTab({ assignments, partners, compensationMap }: CompensationTabProps) {
  const [compTab, setCompTab] = useState<CompTab>("receipts");
  const [prices, setPrices] = useState<Record<string, number>>({ ...DEFAULT_PRICES });
  const [taxes, setTaxes] = useState({ vatPct: 18, envLevyPct: 2 });
  const [shares, setShares] = useState({ citizenPct: 60, collectorPct: 25, systemPct: 15 });
  const [receiptHistory, setReceiptHistory] = useState<ReceiptRecord[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // ── Derive the list of partners that actually have compensation records ──────
  const partnersWithRecords = partners.filter((p) =>
    Object.values(compensationMap).some((c) => Number(c.partnerId) === p.id),
  );

  // ── Default selectedPartner to the first partner with records (no "All") ────
  const [selectedPartner, setSelectedPartner] = useState<string>(() =>
    partnersWithRecords.length > 0 ? String(partnersWithRecords[0].id) : "",
  );

  // ── Receipt date filters ──────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const [receiptFilterMonth, setReceiptFilterMonth] = useState<number | null>(null); // null = all months
  const [receiptFilterYear, setReceiptFilterYear] = useState<number>(currentYear);

  // Keep selectedPartner in sync when compensationMap loads after initial render
  useEffect(() => {
    if (partnersWithRecords.length === 0) {
      setSelectedPartner("");
      return;
    }
    if (
      !selectedPartner ||
      !partnersWithRecords.some((p) => String(p.id) === selectedPartner)
    ) {
      setSelectedPartner(String(partnersWithRecords[0].id));
    }
  }, [compensationMap, partners, partnersWithRecords, selectedPartner]);

  useEffect(() => {
    fetchMaterialPrices();
    fetchTaxConfig();
    fetchShareConfig();
    fetchReceiptHistory();
  }, []);

  async function fetchReceiptHistory() {
    try {
      setLoadingReceipts(true);
      setReceiptError(null);
      const receipts = await ReceiptService.getAllReceipts();
      setReceiptHistory(receipts.map(mapDownloadedReceipt));
    } catch (err) {
      console.error("[CompensationTab] Error fetching receipts:", err);
      setReceiptError("Failed to load downloaded receipts.");
    } finally {
      setLoadingReceipts(false);
    }
  }

  async function fetchMaterialPrices() {
    try {
      const data = await compensationConfigService.getMaterialPrices();
      setPrices(data);
    } catch (err) {
      console.error("[CompensationTab] Error fetching material prices:", err);
    }
  }

  async function fetchTaxConfig() {
    try {
      setLoadingConfig(true);
      setConfigError(null);
      const data = await compensationConfigService.getTaxConfig();
      setTaxes({ vatPct: data["VAT"] ?? 18, envLevyPct: data["Environmental Levy"] ?? 2 });
    } catch (err) {
      console.error("[CompensationTab] Error fetching tax config:", err);
      setConfigError(err instanceof Error ? err.message : "Failed to load tax configuration");
    } finally {
      setLoadingConfig(false);
    }
  }

  async function fetchShareConfig() {
    try {
      const data = await compensationConfigService.getShareConfig();
      setShares({
        citizenPct:   data["Citizen"]   ?? 60,
        collectorPct: data["Collector"] ?? 25,
        systemPct:    data["System"]    ?? 15,
      });
    } catch (err) {
      console.error("[CompensationTab] Error fetching share config:", err);
    }
  }

  async function saveCompensationConfig() {
    try {
      setSavingConfig(true);
      setConfigError(null);
      await compensationConfigService.saveMaterialPrices(prices);
      await compensationConfigService.saveTaxConfig({ "VAT": taxes.vatPct, "Environmental Levy": taxes.envLevyPct });
      await compensationConfigService.saveShareConfig({ "Citizen": shares.citizenPct, "Collector": shares.collectorPct, "System": shares.systemPct });
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSavingConfig(false);
    }
  }

  const shareTotal = shares.citizenPct + shares.collectorPct + shares.systemPct;
  const shareError = shareTotal !== 100;

  const filterPartnerId = selectedPartner ? parseInt(selectedPartner, 10) : null;

  // ── BUILD RECEIPT ROWS FROM PERSISTED COMPENSATION RECORDS ──────────────────
  const receiptRows = assignments
    .filter((w) => {
      const hasRecord = w.numericId != null && compensationMap[w.numericId!] != null;
      return (w.status === "compensated" || hasRecord) && w.numericId != null;
    })
    .filter((w) => {
      // filterPartnerId is always set (no "All" option), so always filter by partner
      if (!filterPartnerId) return false;
      const comp = compensationMap[w.numericId!];
      return comp?.partnerId != null && Number(comp.partnerId) === filterPartnerId;
    })
    .flatMap((w) => {
      const comp = compensationMap[w.numericId!];
      if (!comp) return [];

      const breakdown = parseBreakdown(comp.materialBreakdown);

      if (breakdown.length > 0) {
        const vatRatio = comp.grossAmount > 0 ? comp.vatAmount    / comp.grossAmount : 0;
        const envRatio = comp.grossAmount > 0 ? comp.envLevyAmount / comp.grossAmount : 0;
        return breakdown.map((b) => ({
          wasteId:        w.id,
          reportId:       w.reportId,
          citizen:        w.citizen,
          material:       b.type,
          weightKg:       b.weightKg,
          pricePerKg:     b.pricePerKg,
          grossAmount:    b.gross,
          vatAmount:      b.gross * vatRatio,
          envAmount:      b.gross * envRatio,
          netAmount:      b.gross * (1 - vatRatio - envRatio),
          citizenShare:   b.gross * (1 - vatRatio - envRatio) * (comp.citizenPct   / 100),
          collectorShare: b.gross * (1 - vatRatio - envRatio) * (comp.collectorPct / 100),
          systemShare:    b.gross * (1 - vatRatio - envRatio) * (comp.systemPct    / 100),
          vatPct:         comp.vatPct,
          envPct:         comp.envLevyPct,
          citizenPct:     comp.citizenPct,
          collectorPct:   comp.collectorPct,
          systemPct:      comp.systemPct,
          date:           comp.compensatedAt,
          partnerId:      comp.partnerId,
        }));
      }

      return [{
        wasteId:        w.id,
        reportId:       w.reportId,
        citizen:        w.citizen,
        material:       comp.materialType,
        weightKg:       comp.weightKg,
        pricePerKg:     comp.pricePerKg,
        grossAmount:    comp.grossAmount,
        vatAmount:      comp.vatAmount,
        envAmount:      comp.envLevyAmount,
        netAmount:      comp.netAmount,
        citizenShare:   comp.citizenAmount,
        collectorShare: comp.collectorAmount,
        systemShare:    comp.systemAmount,
        vatPct:         comp.vatPct,
        envPct:         comp.envLevyPct,
        citizenPct:     comp.citizenPct,
        collectorPct:   comp.collectorPct,
        systemPct:      comp.systemPct,
        date:           comp.compensatedAt,
        partnerId:      comp.partnerId,
      }];
    })
    .filter((row) => {
      // Apply date filtering
      if (!row.date) return true; // Include rows without date
      
      const date = new Date(row.date);
      const rowYear = date.getFullYear();
      const rowMonth = date.getMonth() + 1; // getMonth() is 0-indexed
      
      // Filter by year
      if (rowYear !== receiptFilterYear) return false;
      
      // Filter by month if specified
      if (receiptFilterMonth !== null && rowMonth !== receiptFilterMonth) return false;
      
      return true;
    });

  const totals = receiptRows.reduce(
    (acc, r) => ({
      gross:     acc.gross     + r.grossAmount,
      vat:       acc.vat       + r.vatAmount,
      env:       acc.env       + r.envAmount,
      net:       acc.net       + r.netAmount,
      citizen:   acc.citizen   + r.citizenShare,
      collector: acc.collector + r.collectorShare,
      system:    acc.system    + r.systemShare,
      weightKg:  acc.weightKg  + r.weightKg,
    }),
    { gross: 0, vat: 0, env: 0, net: 0, citizen: 0, collector: 0, system: 0, weightKg: 0 },
  );

  const displayVatPct       = receiptRows[0]?.vatPct       ?? taxes.vatPct;
  const displayEnvPct       = receiptRows[0]?.envPct       ?? taxes.envLevyPct;
  const displayCitizenPct   = receiptRows[0]?.citizenPct   ?? shares.citizenPct;
  const displayCollectorPct = receiptRows[0]?.collectorPct ?? shares.collectorPct;
  const displaySystemPct    = receiptRows[0]?.systemPct    ?? shares.systemPct;

  const partnerForReceipt = filterPartnerId
    ? partners.find((p) => p.id === filterPartnerId) ?? null
    : null;

  async function handlePrint() {
    if (!filterPartnerId || receiptRows.length === 0) return;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    const today = new Date().toLocaleDateString("fr-CG", { year: "numeric", month: "long", day: "numeric" });
    const receiptNo = "RCP-" + Date.now().toString().slice(-6);

    try {
      setSavingReceipt(true);
      setReceiptError(null);
      const saved = await ReceiptService.createReceipt({
        receiptNo,
        partnerId: filterPartnerId,
        partnerName: partnerForReceipt?.name ?? "—",
        entriesCount: receiptRows.length,
        totalKg: totals.weightKg,
        grossAmount: totals.gross,
        netAmount: totals.net,
        filterMonth: receiptFilterMonth,
        filterYear: receiptFilterYear,
      });
      setReceiptHistory((prev) => [mapDownloadedReceipt(saved), ...prev]);
    } catch (err) {
      console.error("[handlePrint] Failed to save receipt:", err);
      setReceiptError(
        err instanceof Error ? err.message : "Failed to save downloaded receipt.",
      );
      return;
    } finally {
      setSavingReceipt(false);
    }

    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Receipt ${receiptNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1e25; padding: 32px; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #1cb97a; }
  .brand { font-size: 22px; font-weight: 800; color: #1a1e25; letter-spacing: -0.02em; }
  .brand span { color: #1cb97a; }
  .brand-sub { font-size: 11px; color: #8a9099; margin-top: 2px; }
  .receipt-meta { text-align: right; }
  .receipt-no { font-size: 18px; font-weight: 800; color: #1a1e25; }
  .receipt-date { font-size: 11px; color: #8a9099; margin-top: 3px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #9aa0ac; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #eef0f3; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .info-block label { font-size: 9px; font-weight: 700; color: #aab0bb; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
  .info-block span { font-size: 12px; font-weight: 700; color: #1a1e25; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #f0f2f5; }
  th { padding: 7px 10px; text-align: left; font-size: 9px; font-weight: 800; color: #6b7a8f; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 8px 10px; border-bottom: 1px solid #f0f2f5; font-size: 11px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .num { text-align: right; font-weight: 700; }
  .totals-box { background: #f7f8fa; border: 1px solid #dde1e7; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
  .totals-row.divider { border-top: 1px solid #dde1e7; margin-top: 6px; padding-top: 10px; }
  .totals-row.total { font-size: 15px; font-weight: 800; color: #1cb97a; }
  .totals-label { color: #6b7a8f; font-weight: 600; }
  .totals-val { font-weight: 700; color: #1a1e25; }
  .shares-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 20px; }
  .share-card { background: #f7f8fa; border: 1px solid #dde1e7; border-radius: 6px; padding: 12px; text-align: center; }
  .share-label { font-size: 9px; font-weight: 800; color: #9aa0ac; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .share-pct { font-size: 11px; color: #8a9099; margin-bottom: 4px; }
  .share-amount { font-size: 16px; font-weight: 800; color: #1a1e25; }
  .footer { border-top: 1px solid #eef0f3; padding-top: 14px; display: flex; justify-content: space-between; font-size: 10px; color: #aab0bb; }
  @media print { body { padding: 16px; } }
</style>
</head><body>
<div class="header">
  <div>
    <div class="brand">Eco<span>Brazza</span></div>
    <div class="brand-sub">Recyclable Waste Management · Brazzaville</div>
  </div>
  <div class="receipt-meta">
    <div class="receipt-no">${receiptNo}</div>
    <div class="receipt-date">Issued: ${today}</div>
    <div class="receipt-date" style="margin-top:4px;font-weight:700;color:#1a1e25">Partner: ${partnerForReceipt?.name ?? "—"}</div>
  </div>
</div>
<div class="section">
  <div class="section-title">Pricing Configuration (from compensation records)</div>
  <div class="info-grid">
    <div class="info-block"><label>VAT Rate</label><span>${displayVatPct}%</span></div>
    <div class="info-block"><label>Environmental Levy</label><span>${displayEnvPct}%</span></div>
  </div>
</div>
<div class="section">
  <div class="section-title">Transaction Details (${receiptRows.length} entries · ${totals.weightKg.toFixed(2)} kg total)</div>
  <table>
    <thead>
      <tr><th>Report ID</th><th>Citizen</th><th>Material</th><th class="num">Weight (kg)</th><th class="num">Rate/kg</th><th class="num">Gross</th><th class="num">VAT</th><th class="num">Env.</th><th class="num">Net</th></tr>
    </thead>
    <tbody>
      ${receiptRows.map((r) => `
      <tr>
        <td style="color:#7c6be8;font-weight:800">${r.reportId}</td>
        <td style="font-weight:700">${r.citizen}</td>
        <td>${r.material}</td>
        <td class="num">${r.weightKg.toFixed(2)}</td>
        <td class="num">${r.pricePerKg.toLocaleString()} XAF</td>
        <td class="num">${r.grossAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</td>
        <td class="num" style="color:#d97706">${r.vatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</td>
        <td class="num" style="color:#d97706">${r.envAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</td>
        <td class="num" style="color:#1cb97a;font-weight:800">${r.netAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</td>
      </tr>`).join("")}
    </tbody>
  </table>
</div>
<div class="totals-box">
  <div class="totals-row"><span class="totals-label">Gross Total</span><span class="totals-val">${totals.gross.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</span></div>
  <div class="totals-row"><span class="totals-label">VAT (${displayVatPct}%)</span><span class="totals-val" style="color:#d97706">− ${totals.vat.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</span></div>
  <div class="totals-row"><span class="totals-label">Environmental Levy (${displayEnvPct}%)</span><span class="totals-val" style="color:#d97706">− ${totals.env.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</span></div>
  <div class="totals-row divider total"><span>Net Payable by Partner</span><span>${totals.net.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</span></div>
</div>
<div class="section">
  <div class="section-title">Distribution of Net Amount</div>
  <div class="shares-grid">
    <div class="share-card"><div class="share-label">Citizen</div><div class="share-pct">${displayCitizenPct}% of net</div><div class="share-amount">${totals.citizen.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</div></div>
    <div class="share-card"><div class="share-label">Collector</div><div class="share-pct">${displayCollectorPct}% of net</div><div class="share-amount">${totals.collector.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</div></div>
    <div class="share-card"><div class="share-label">System</div><div class="share-pct">${displaySystemPct}% of net</div><div class="share-amount">${totals.system.toLocaleString(undefined, { maximumFractionDigits: 0 })} XAF</div></div>
  </div>
</div>
<div class="footer">
  <span>Generated by EcoBrazza Waste Management System</span>
  <span>This receipt is valid for accounting purposes · ${receiptNo}</span>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
    win.document.close();
  }

  return (
    <div id="rm-panel-compensation" role="tabpanel" aria-label="Compensation">
      <style>{`
        .ctabs-bar { display: flex; border-bottom: 1px solid #dde1e7; background: #f7f8fa; padding: 0 14px; }
        .ctabs-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; background: none; border: none; border-bottom: 2px solid transparent; font-size: 12px; font-weight: 700; color: #8a9099; cursor: pointer; font-family: inherit; letter-spacing: 0.02em; transition: all 0.13s; min-height: 42px; }
        .ctabs-btn:hover { color: #1a1e25; }
        .ctabs-btn.active { color: #1cb97a; border-bottom-color: #1cb97a; }
        .ct-body { padding: 14px; display: flex; flex-direction: column; gap: 14px; }
        .ct-three-col { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; align-items: start; }
        @media(max-width:900px){ .ct-three-col { grid-template-columns: 1fr 1fr; } }
        @media(max-width:580px){ .ct-three-col { grid-template-columns: 1fr; } }
        .ct-config-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden; }
        .ct-config-header { background: #f0f2f5; border-bottom: 1px solid #dde1e7; padding: 10px 14px; display: flex; align-items: center; gap: 7px; }
        .ct-config-title { font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em; }
        .ct-config-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .ct-label { font-size: 10px; font-weight: 800; color: #6b7a8f; text-transform: uppercase; letter-spacing: 0.06em; }
        .ct-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 10px; background: #f7f8fa; border: 1px solid #eef0f3; border-radius: 6px; }
        .ct-row-label { font-size: 12px; font-weight: 700; color: #1a1e25; flex: 1; }
        .ct-input { width: 72px; padding: 5px 8px; border: 1px solid #dde1e7; border-radius: 5px; font-size: 12.5px; font-weight: 700; color: #1a1e25; font-family: inherit; outline: none; text-align: right; background: #fff; transition: border-color 0.12s; }
        .ct-input:focus { border-color: #1cb97a; }
        .ct-input-unit { font-size: 10.5px; color: #9aa0ac; font-weight: 700; flex-shrink: 0; min-width: 36px; }
        .ct-share-total { font-size: 11px; font-weight: 800; padding: 6px 10px; border-radius: 6px; text-align: center; }
        .ct-share-ok  { background: #d1fae5; color: #065f46; }
        .ct-share-bad { background: #fee2e2; color: #991b1b; }
        .ct-total-row { background: #f0faf5; border-color: #bbf7d0; }
        .ct-total-label { color: #065f46; }
        .rp-body { padding: 14px; display: flex; flex-direction: column; gap: 14px; }
        .rp-preview-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden; }
        .rp-preview-header { background: #f0f2f5; border-bottom: 1px solid #dde1e7; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; }
        .rp-preview-title { font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em; }
        .rp-partner-select { padding: 5px 10px; border: 1px solid #dde1e7; border-radius: 6px; font-size: 12px; font-weight: 600; color: #1a1e25; background: #fff; font-family: inherit; outline: none; cursor: pointer; min-height: 34px; }
        .rp-kpi-row { display: grid; grid-template-columns: repeat(4,1fr); border-bottom: 1px solid #eef0f3; }
        .rp-kpi { padding: 14px 0; display: flex; flex-direction: column; align-items: center; gap: 3px; border-right: 1px solid #eef0f3; }
        .rp-kpi:last-child { border-right: none; }
        .rp-kpi-num { font-size: 17px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
        .rp-kpi-label { font-size: 9.5px; font-weight: 800; color: #aab0bb; text-transform: uppercase; letter-spacing: 0.06em; }
        .rp-table-wrap { overflow-x: auto; }
        .rp-table { width: 100%; border-collapse: collapse; }
        .rp-th { padding: 7px 12px; text-align: left; font-size: 9.5px; font-weight: 800; color: #9aa0ac; letter-spacing: 0.06em; text-transform: uppercase; background: #f7f8fa; border-bottom: 1px solid #eef0f3; }
        .rp-th.num, .rp-td.num { text-align: right; }
        .rp-td { padding: 10px 12px; font-size: 11.5px; color: #1a1e25; border-bottom: 1px solid #eef0f3; vertical-align: middle; }
        .rp-tr:last-child .rp-td { border-bottom: none; }
        .rp-tr:hover .rp-td { background: #f7f8fa; }
        .rp-shares-strip { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid #eef0f3; }
        .rp-share-cell { padding: 12px 0; display: flex; flex-direction: column; align-items: center; gap: 3px; border-right: 1px solid #eef0f3; }
        .rp-share-cell:last-child { border-right: none; }
        .rp-share-num { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; }
        .rp-share-sub { font-size: 9.5px; font-weight: 800; color: #aab0bb; text-transform: uppercase; letter-spacing: 0.06em; }
        .rp-footer { padding: 10px 14px; background: #f7f8fa; border-top: 1px solid #eef0f3; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .rp-empty { text-align: center; padding: 40px 16px; font-size: 12.5px; color: #aab0bb; }
        .rp-btn-print { display: inline-flex; align-items: center; gap: 6px; background: #1cb97a; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; letter-spacing: 0.02em; min-height: 36px; transition: opacity 0.12s; }
        .rp-btn-print:hover { opacity: 0.87; }
        .rp-btn-print:disabled { background: #a0cfbc; cursor: not-allowed; opacity: 1; }
        .rh-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden; }
        .rh-header { background: #f0f2f5; border-bottom: 1px solid #dde1e7; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; }
        .rh-title { font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em; display: flex; align-items: center; gap: 6px; }
        .rh-badge { font-size: 10px; font-weight: 800; background: #1cb97a; color: #fff; padding: 2px 7px; border-radius: 4px; }
        .rh-empty { text-align: center; padding: 32px 16px; font-size: 12.5px; color: #aab0bb; }
        .rh-table { width: 100%; border-collapse: collapse; }
        .rh-th { padding: 7px 14px; text-align: left; font-size: 9.5px; font-weight: 800; color: #9aa0ac; letter-spacing: 0.06em; text-transform: uppercase; background: #f7f8fa; border-bottom: 1px solid #eef0f3; }
        .rh-td { padding: 10px 14px; font-size: 11.5px; color: #1a1e25; border-bottom: 1px solid #eef0f3; vertical-align: middle; }
        .rh-tr:last-child .rh-td { border-bottom: none; }
        .rh-tr:hover .rh-td { background: #f7f8fa; }
      `}</style>

      <div className="ctabs-bar" role="tablist">
        {COMP_TAB_DEFS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={compTab === t.id}
              className={`ctabs-btn${compTab === t.id ? " active" : ""}`}
              onClick={() => setCompTab(t.id)}
            >
              <Icon size={13} aria-hidden="true" /> {t.label}
            </button>
          );
        })}
      </div>

      {compTab === "configure" && (
        <div className="ct-body">
          {loadingConfig && (
            <div style={{ textAlign: "center", padding: "32px 16px", fontSize: "12.5px", color: "#aab0bb" }}>
              Loading configuration...
            </div>
          )}
          {!loadingConfig && (
            <div className="ct-three-col">
              <div className="ct-config-card">
                <div className="ct-config-header">
                  <Settings size={12} color="#6b7a8f" />
                  <span className="ct-config-title">Pricing</span>
                </div>
                <div className="ct-config-body">
                  <div className="ct-label">Price per kg by material</div>
                  {Object.entries(prices).map(([mat, val]) => (
                    <div className="ct-row" key={mat}>
                      <span className="ct-row-label">{mat}</span>
                      <input
                        type="number" className="ct-input" min={0} value={val}
                        onChange={(e) => setPrices({ ...prices, [mat]: Number(e.target.value) })}
                      />
                      <span className="ct-input-unit">XAF/kg</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ct-config-card">
                <div className="ct-config-header">
                  <DollarSign size={12} color="#6b7a8f" />
                  <span className="ct-config-title">Taxes</span>
                </div>
                <div className="ct-config-body">
                  <div className="ct-label">Deductions on gross amount</div>
                  <div className="ct-row">
                    <span className="ct-row-label">VAT (TVA)</span>
                    <input type="number" className="ct-input" min={0} max={100} value={taxes.vatPct}
                      onChange={(e) => setTaxes({ ...taxes, vatPct: Number(e.target.value) })} />
                    <span className="ct-input-unit">%</span>
                  </div>
                  <div className="ct-row">
                    <span className="ct-row-label">Environmental Levy</span>
                    <input type="number" className="ct-input" min={0} max={100} value={taxes.envLevyPct}
                      onChange={(e) => setTaxes({ ...taxes, envLevyPct: Number(e.target.value) })} />
                    <span className="ct-input-unit">%</span>
                  </div>
                  <div className="ct-row ct-total-row">
                    <span className="ct-row-label ct-total-label">Total deduction</span>
                    <span style={{ fontWeight: 800, color: "#1cb97a", fontSize: 13 }}>
                      {taxes.vatPct + taxes.envLevyPct}%
                    </span>
                    <span className="ct-input-unit"> </span>
                  </div>
                </div>
              </div>
              <div className="ct-config-card">
                <div className="ct-config-header">
                  <Users size={12} color="#6b7a8f" />
                  <span className="ct-config-title">Shares</span>
                </div>
                <div className="ct-config-body">
                  <div className="ct-label">Distribution of net (must total 100%)</div>
                  {([
                    { key: "citizenPct",   label: "Citizen"   },
                    { key: "collectorPct", label: "Collector" },
                    { key: "systemPct",    label: "System"    },
                  ] as const).map(({ key, label }) => (
                    <div className="ct-row" key={key}>
                      <span className="ct-row-label">{label}</span>
                      <input type="number" className="ct-input" min={0} max={100} value={shares[key]}
                        onChange={(e) => setShares({ ...shares, [key]: Number(e.target.value) })} />
                      <span className="ct-input-unit">%</span>
                    </div>
                  ))}
                  <div className={`ct-share-total ${shareError ? "ct-share-bad" : "ct-share-ok"}`}>
                    Total: {shareTotal}% {shareError ? `— needs ${100 - shareTotal > 0 ? "+" : ""}${100 - shareTotal}% adjustment` : "✓ balanced"}
                  </div>
                </div>
              </div>
            </div>
          )}
          {configError && (
            <div style={{ marginTop: "14px", padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "6px", fontSize: "12px", color: "#991b1b", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={14} /> {configError}
            </div>
          )}
          <div style={{ marginTop: "14px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={saveCompensationConfig}
              disabled={savingConfig || loadingConfig || shareError}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: shareError ? "#a0cfbc" : "#1cb97a", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12.5px", fontWeight: 700, cursor: shareError || savingConfig ? "not-allowed" : "pointer", opacity: savingConfig ? 0.7 : 1 }}
            >
              <Save size={14} /> {savingConfig ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      )}

      {compTab === "receipts" && (
        <div className="rp-body">
          <div className="rp-preview-card">
            <div className="rp-preview-header">
              <div className="rp-preview-title">
                Receipt Preview
                {partnerForReceipt && (
                  <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, color: "#1cb97a", textTransform: "none" }}>
                    — {partnerForReceipt.name}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {/* Partner selector — no "All Partners" option, only partners with records */}
                {partnersWithRecords.length > 0 ? (
                  <select
                    className="rp-partner-select"
                    value={selectedPartner}
                    onChange={(e) => setSelectedPartner(e.target.value)}
                    aria-label="Select partner for receipt"
                  >
                    {partnersWithRecords.map((p) => (
                      <option key={p.id} value={String(p.id)}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ fontSize: 11, color: "#aab0bb", fontWeight: 600 }}>
                    No compensated partners yet
                  </span>
                )}

                {/* Month filter */}
                <select
                  value={receiptFilterMonth === null ? "" : receiptFilterMonth}
                  onChange={(e) => setReceiptFilterMonth(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                  aria-label="Filter by month"
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: "1px solid #e2e8f0",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "#fff",
                  }}
                >
                  <option value="">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>

                {/* Year filter */}
                <select
                  value={receiptFilterYear}
                  onChange={(e) => setReceiptFilterYear(parseInt(e.target.value, 10))}
                  aria-label="Filter by year"
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: "1px solid #e2e8f0",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "#fff",
                  }}
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rp-kpi-row" role="list">
              <div className="rp-kpi" role="listitem">
                <span className="rp-kpi-num" style={{ color: "#7c6be8" }}>{receiptRows.length}</span>
                <span className="rp-kpi-label">Entries</span>
              </div>
              <div className="rp-kpi" role="listitem">
                <span className="rp-kpi-num">{totals.weightKg.toFixed(1)} kg</span>
                <span className="rp-kpi-label">Total Weight</span>
              </div>
              <div className="rp-kpi" role="listitem">
                <span className="rp-kpi-num" style={{ color: "#d97706" }}>
                  {(displayVatPct + displayEnvPct).toFixed(0)}%
                </span>
                <span className="rp-kpi-label">Deductions</span>
              </div>
              <div className="rp-kpi" role="listitem">
                <span className="rp-kpi-num" style={{ color: "#1cb97a" }}>{fmt(totals.net)}</span>
                <span className="rp-kpi-label">Net Payable</span>
              </div>
            </div>

            {receiptRows.length === 0 ? (
              <div className="rp-empty">
                {partnersWithRecords.length === 0
                  ? "No compensated entries yet. Mark assignments as compensated first."
                  : `No entries found for ${partnerForReceipt?.name ?? "this partner"}.`}
              </div>
            ) : (
              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th className="rp-th">Report</th>
                      <th className="rp-th">Citizen</th>
                      <th className="rp-th">Material</th>
                      <th className="rp-th num">kg</th>
                      <th className="rp-th num">Rate</th>
                      <th className="rp-th num">Gross</th>
                      <th className="rp-th num">Tax</th>
                      <th className="rp-th num">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptRows.map((r, i) => (
                      <tr key={`${r.wasteId}-${i}`} className="rp-tr">
                        <td className="rp-td" style={{ fontWeight: 800, color: "#7c6be8", fontSize: 10.5 }}>{r.reportId}</td>
                        <td className="rp-td" style={{ fontWeight: 700 }}>{r.citizen}</td>
                        <td className="rp-td" style={{ fontSize: 11 }}>{r.material}</td>
                        <td className="rp-td num">{r.weightKg.toFixed(2)}</td>
                        <td className="rp-td num" style={{ fontSize: 10.5 }}>{r.pricePerKg.toLocaleString()}</td>
                        <td className="rp-td num">{r.grossAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="rp-td num" style={{ color: "#d97706" }}>
                          −{(r.vatAmount + r.envAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="rp-td num" style={{ fontWeight: 800, color: "#1cb97a" }}>
                          {r.netAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {receiptRows.length > 0 && (
              <div className="rp-shares-strip" role="list">
                <div className="rp-share-cell" role="listitem">
                  <span className="rp-share-num" style={{ color: "#3b82f6" }}>{fmt(totals.citizen)}</span>
                  <span className="rp-share-sub">Citizen ({displayCitizenPct}%)</span>
                </div>
                <div className="rp-share-cell" role="listitem">
                  <span className="rp-share-num" style={{ color: "#7c6be8" }}>{fmt(totals.collector)}</span>
                  <span className="rp-share-sub">Collector ({displayCollectorPct}%)</span>
                </div>
                <div className="rp-share-cell" role="listitem">
                  <span className="rp-share-num" style={{ color: "#f97316" }}>{fmt(totals.system)}</span>
                  <span className="rp-share-sub">System ({displaySystemPct}%)</span>
                </div>
              </div>
            )}

            <div className="rp-footer">
              <span style={{ fontSize: 11, color: "#8a9099", fontWeight: 600 }}>
                Gross: {fmt(totals.gross)} · VAT: {fmt(totals.vat)} · Env: {fmt(totals.env)}
              </span>
              <button
                className="rp-btn-print"
                disabled={receiptRows.length === 0 || savingReceipt || !filterPartnerId}
                onClick={handlePrint}
              >
                <Receipt size={13} aria-hidden="true" /> {savingReceipt ? "Saving..." : "Print / Download Receipt"}
              </button>
            </div>
          </div>

          <div className="rh-card">
            <div className="rh-header">
              <div className="rh-title">
                <Clock size={13} />
                Downloaded Receipts
                {receiptHistory.length > 0 && <span className="rh-badge">{receiptHistory.length}</span>}
              </div>
            </div>
            {receiptError && (
              <div style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: "#991b1b", background: "#fff1f2", borderBottom: "1px solid #fecdd3" }}>
                {receiptError}
              </div>
            )}
            {loadingReceipts ? (
              <div className="rh-empty">Loading downloaded receipts…</div>
            ) : receiptHistory.length === 0 ? (
              <div className="rh-empty">No receipts generated yet.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="rh-table">
                  <thead>
                    <tr>
                      <th className="rh-th">Receipt No.</th>
                      <th className="rh-th">Partner</th>
                      <th className="rh-th" style={{ textAlign: "right" }}>Entries</th>
                      <th className="rh-th" style={{ textAlign: "right" }}>Total kg</th>
                      <th className="rh-th" style={{ textAlign: "right" }}>Gross</th>
                      <th className="rh-th" style={{ textAlign: "right" }}>Net Payable</th>
                      <th className="rh-th">Issued At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptHistory.map((rec) => (
                      <tr key={rec.id} className="rh-tr">
                        <td className="rh-td" style={{ fontWeight: 800, color: "#7c6be8" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Download size={11} color="#7c6be8" /> {rec.receiptNo}
                          </div>
                        </td>
                        <td className="rh-td" style={{ fontWeight: 700 }}>{rec.partnerName}</td>
                        <td className="rh-td" style={{ textAlign: "right" }}>{rec.entriesCount}</td>
                        <td className="rh-td" style={{ textAlign: "right" }}>{rec.totalKg.toFixed(2)}</td>
                        <td className="rh-td" style={{ textAlign: "right" }}>{fmt(rec.grossAmount)}</td>
                        <td className="rh-td" style={{ textAlign: "right", fontWeight: 800, color: "#1cb97a" }}>{fmt(rec.netAmount)}</td>
                        <td className="rh-td">
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8a9099" }}>
                            <Calendar size={10} color="#aab0bb" /> {fmtDateTime(rec.issuedAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function RecyclingManagementPage() {
  const { user } = useAuth();
  const { assignments, compensate: ctxCompensate, assign: ctxAssign } = useRecycling();

  const [activeTab, setActiveTab] = useState<Tab>("waste");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [materialLines, setMaterialLines] = useState<Record<string, MaterialLine[]>>({});
  const [selectedPartners, setSelectedPartners] = useState<Record<string, string>>({});

  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partner | null>(null);
  const [editDirty, setEditDirty] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<Omit<Partner, "id">>(EMPTY_FORM);
  const [addErrors, setAddErrors] = useState<Partial<Record<keyof Omit<Partner, "id">, string>>>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasteAssignments, setWasteAssignments] = useState<RecyclableAssignment[]>([]);

  const assignmentMetaRef = useRef<Record<number, AssignmentMeta>>({});
  // Maps an assign_partner row's id -> the real partners.id it points to.
  // Needed because compensation.partner_id can be null/NaN on some legacy rows;
  // compensation.assign_partner_id always references a valid assign_partner row,
  // and that row reliably carries the correct partnerId.
  const assignPartnerToPartnerRef = useRef<Record<number, number>>({});
  const [compensationMap, setCompensationMap] = useState<Record<number, CompensationRecord>>({});

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (expandedId) { setExpandedId(null); return; }
      if (showAdd)    { setShowAdd(false);   return; }
      if (editId)     { setEditId(null); setEditForm(null); setEditDirty(false); return; }
      if (deleteId)   { setDeleteId(null);   return; }
    },
    [expandedId, showAdd, editId, deleteId],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  // ── Fetch partners ───────────────────────────────────────────────────────────
  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8080/api/partners", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed to fetch partners: ${response.status}`);
      const data = await response.json();
      const mappedPartners = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.category,
        contact: p.phone,
        email: p.email,
        location: p.address,
        materialsAccepted: [],
        rate: "0 XAF/kg",
        status: p.status === "active" ? "active" : "inactive",
        totalCollected: "0t",
      }));
      setPartners(mappedPartners);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load partners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  // ── Fetch assignments ────────────────────────────────────────────────────────
  const fetchWastes = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("http://localhost:8080/api/assignments", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) return;
      const rawAssignments: any[] = await response.json();

      const uniqueUserIds = new Set<number>();
      rawAssignments.forEach((a: any) => {
        const collectorId = a.collectorId || a.collector_id;
        if (collectorId) uniqueUserIds.add(collectorId);
        if (a.wasteReport?.userId) uniqueUserIds.add(a.wasteReport.userId);
      });

      const userDataMap: Record<number, any> = {};
      for (const userId of uniqueUserIds) {
        try {
          const userResponse = await fetch(`http://localhost:8080/api/users/${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          if (userResponse.ok) userDataMap[userId] = await userResponse.json();
        } catch { /* skip */ }
      }

      const metaMap: Record<number, AssignmentMeta> = {};
      rawAssignments.forEach((a: any) => {
        metaMap[a.id] = {
          citizenId:   a.wasteReport?.userId ?? null,
          collectorId: a.collectorId ?? a.collector_id ?? null,
        };
      });
      assignmentMetaRef.current = metaMap;

      const transformed: RecyclableAssignment[] = rawAssignments.map((assignment: any) => {
        const collectorId   = assignment.collectorId || assignment.collector_id;
        const wasteReport   = assignment.wasteReport;
        const collectorUser = userDataMap[collectorId];
        const collectorName = collectorUser?.firstName
          ? `${collectorUser.firstName} ${collectorUser.lastName || ""}`.trim()
          : collectorId ? `Collector ${collectorId}` : "Unknown Collector";
        const citizenUser  = wasteReport?.userId ? userDataMap[wasteReport.userId] : null;
        const citizenName  = citizenUser?.firstName
          ? `${citizenUser.firstName} ${citizenUser.lastName || ""}`.trim()
          : wasteReport?.userId ? `Citizen ${wasteReport.userId}` : "Unknown Citizen";

        const backendStatus: string = assignment.assignmentStatus ?? "";
        const status: AssignmentStatus =
          backendStatus === "COMPLETED"   ? "completed"   :
          backendStatus === "PENDING"     ? "pending"     :
          backendStatus === "ACCEPTED"    ? "assigned"    :
          backendStatus === "IN_PROGRESS" ? "assigned"    :
          backendStatus === "RECYCLED"    ? "recyclated"  :
          backendStatus === "COMPENSATED" ? "compensated" :
          "pending";

        return {
          id:        `AC-${assignment.id}`,
          numericId: assignment.id,
          reportId:  wasteReport?.id ? `REP-${wasteReport.id}` : `REP-${assignment.reportId}`,
          citizen:   citizenName,
          collector: collectorName,
          material:  wasteReport?.category || "Unknown Material",
          weight:    wasteReport?.quantity  ? `${wasteReport.quantity}` : "0kg",
          location:  wasteReport?.location  || "Unknown Location",
          partner:   null,
          compensation: null,
          status,
          date: new Date(assignment.assignmentDate).toLocaleDateString("fr-CG"),
        };
      });

      const needsOverlay = transformed.filter(
        (a) => (a.status === "recyclated" || a.status === "compensated" || a.status === "assigned") && a.numericId != null,
      );

      const newCompMap: Record<number, CompensationRecord> = {};

      await Promise.all(
        needsOverlay.map(async (a) => {
          try {
            const apRes = await fetch(
              `http://localhost:8080/api/assign-partner/assignment/${a.numericId}`,
              { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" },
            );
            if (apRes.ok) {
              const ap: any = await apRes.json();
              const apPartnerId = toNumber(ap.partnerId ?? ap.partner_id);
              const apId = toNumber(ap.id);

              if (apId != null && apPartnerId != null) {
                assignPartnerToPartnerRef.current[apId] = apPartnerId;
              }

              const partnerName = apPartnerId
                ? (await fetch(`http://localhost:8080/api/partners/${apPartnerId}`, {
                    method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
                  }).then((r) => r.ok ? r.json() : null).then((p) => p?.name ?? null).catch(() => null))
                : null;

              const types        = (ap.materialType ?? ap.material_type ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
              const weights      = (ap.weightKg ?? ap.weight_kg ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
              const materialLabel = types.join(", ") || a.material;
              const weightLabel   = weights.map((w: string) => `${parseFloat(w).toFixed(2)} kg`).join(" + ")
                || (types.length === 0 ? a.weight : "");

              const idx = transformed.findIndex((x) => x.id === a.id);
              if (idx !== -1) {
                transformed[idx] = {
                  ...transformed[idx],
                  material: materialLabel,
                  weight:   weightLabel,
                  partner:  partnerName ?? (apPartnerId != null ? String(apPartnerId) : ""),
                };
              }
            }
          } catch { /* leave as-is */ }
        }),
      );

      try {
        const compRes = await fetch(
          "http://localhost:8080/api/compensations",
          { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" },
        );
        if (compRes.ok) {
          const rawComps: Record<string, unknown>[] = await compRes.json();
          const normalized = rawComps.map((raw) => normalizeCompensation(raw));
          const hydrated = await hydrateCompensationPartnerIds(
            normalized,
            assignPartnerToPartnerRef.current,
          );

          for (const comp of hydrated) {
            const resolvedPartnerId = resolveCompensationPartnerId(
              comp,
              assignPartnerToPartnerRef.current,
            );
            const compResolved: CompensationRecord = {
              ...comp,
              partnerId: resolvedPartnerId,
            };
            if (!compResolved.assignmentId) continue;

            newCompMap[compResolved.assignmentId] = compResolved;

            const idx = transformed.findIndex(
              (x) => x.numericId === compResolved.assignmentId,
            );
            if (idx !== -1) {
              transformed[idx] = {
                ...transformed[idx],
                status: "compensated" as const,
                compensation: `${compResolved.netAmount.toLocaleString("fr-CG", { maximumFractionDigits: 0 })} XAF`,
              };
            }
          }
        }
      } catch (err) {
        console.error("[fetchWastes] Error loading compensations:", err);
      }

      setWasteAssignments(transformed);
      setCompensationMap(newCompMap);
    } catch (err) {
      console.error("[fetchWastes] Error:", err);
    }
  }, []);

  useEffect(() => { fetchWastes(); }, [fetchWastes]);

  const totalCompensationXaf = Object.values(compensationMap).reduce(
    (sum, c) => sum + (c.netAmount ?? 0), 0,
  );

  // ── Calculate partner stats from compensation data ─────────────────────────────
  function getPartnerStats(partnerId: number) {
    let totalWeightKg = 0;
    let totalGross = 0;
    const materialsSet = new Set<string>();

    // Aggregate compensation data for this partner
    Object.values(compensationMap).forEach((comp) => {
      if (Number(comp.partnerId) === partnerId) {
        totalWeightKg += comp.weightKg || 0;
        totalGross += comp.grossAmount || 0;

        // Extract materials from breakdown
        try {
          const breakdown = parseBreakdown(comp.materialBreakdown);
          breakdown.forEach((b) => materialsSet.add(b.type));
        } catch {
          // Fallback to materialType if breakdown parsing fails
          if (comp.materialType) {
            comp.materialType.split(",").forEach((m) => materialsSet.add(m.trim()));
          }
        }
      }
    });

    // Calculate average rate (XAF/kg)
    const avgRate = totalWeightKg > 0 ? Math.round(totalGross / totalWeightKg) : 0;

    // Format collected weight
    const collectedLabel =
      totalWeightKg >= 1000
        ? (totalWeightKg / 1000).toFixed(1) + "t"
        : totalWeightKg.toFixed(1) + " kg";

    // Format total gross (XAF)
    const totalXafLabel = totalGross.toLocaleString("fr-CG", { maximumFractionDigits: 0 }) + " XAF";

    return {
      avgRate,
      totalWeightKg,
      collectedLabel,
      totalXafLabel,
      materials: Array.from(materialsSet),
    };
  }

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }
  function openEdit(p: Partner) { setEditId(p.id); setEditForm({ ...p }); setEditDirty(false); }
  function closeEdit() { setEditId(null); setEditForm(null); setEditDirty(false); }

  async function handleEditSave() {
    if (!editForm) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:8080/api/partners/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editForm.name, email: editForm.email, phone: editForm.contact,
          address: editForm.location, category: editForm.type, status: editForm.status,
          department: user?.department,
        }),
      });
      if (!response.ok) throw new Error(`Failed to update partner: ${response.status}`);
      setPartners((prev) => prev.map((p) => (p.id === editForm.id ? editForm : p)));
      flash(`${editForm.name} updated.`);
      closeEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update partner");
    } finally {
      setLoading(false);
    }
  }

  function validateAdd() {
    const errors: typeof addErrors = {};
    if (!addForm.name.trim())    errors.name     = "Name is required";
    if (!addForm.type)           errors.type     = "Type is required";
    if (!addForm.contact.trim()) errors.contact  = "Contact is required";
    if (!addForm.email.trim())   errors.email    = "Email is required";
    if (!addForm.location)       errors.location = "Location is required";
    if (!addForm.rate.trim())    errors.rate     = "Rate is required";
    return errors;
  }

  async function handleAddSave() {
    const errors = validateAdd();
    if (Object.keys(errors).length > 0) { setAddErrors(errors); return; }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("http://localhost:8080/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: addForm.name, email: addForm.email, phone: addForm.contact,
          address: addForm.location, category: addForm.type, status: addForm.status,
          department: user?.department, description: "",
        }),
      });
      if (!response.ok) throw new Error(`Failed to add partner: ${response.status}`);
      const createdPartner = await response.json();
      setPartners((prev) => [...prev, {
        id: createdPartner.id, name: createdPartner.name, type: createdPartner.category,
        contact: createdPartner.phone, email: createdPartner.email, location: createdPartner.address,
        materialsAccepted: [], rate: "0 XAF/kg",
        status: createdPartner.status === "active" ? "active" : "inactive", totalCollected: "0t",
      }]);
      flash(`${addForm.name} added as a partner.`);
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add partner");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId || !deleteTarget) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:8080/api/partners/${deleteId}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include",
      });
      if (!response.ok) throw new Error(`Failed to delete partner: ${response.status}`);
      const wasViewing = detailId === deleteId;
      setPartners((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
      if (wasViewing) setDetailId(null);
      flash(`${deleteTarget.name} removed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete partner");
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(a: RecyclableAssignment) {
    if (!isExpandable(a)) return;
    if (expandedId === a.id) { setExpandedId(null); return; }
    setExpandedId(a.id);
    if (!materialLines[a.id]) {
      const parts = a.material.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
      const lines: MaterialLine[] = parts.map((mat) => ({
        id: Math.random().toString(36).slice(2),
        type: MATERIAL_OPTIONS.includes(mat) ? mat : MATERIAL_OPTIONS[0],
        weightKg: "",
      }));
      setMaterialLines((prev) => ({ ...prev, [a.id]: lines.length ? lines : [newLine()] }));
    }
    if (a.status === "assigned" && a.partner && !selectedPartners[a.id]) {
      setSelectedPartners((prev) => ({ ...prev, [a.id]: a.partner! }));
    }
  }

  async function handleAssign(id: string) {
    const partner = selectedPartners[id];
    const a = wasteAssignments.find((x) => x.id === id);
    if (!a) return;
    const lines = materialLines[id] ?? [];
    if (!partner || lines.length === 0) return;

    const materialStr = lines.map((l) => l.type).join(", ");
    const weightStr   = lines.map((l) => (parseFloat(l.weightKg) || 0).toFixed(2)).join(", ");

    const meta = a.numericId != null ? assignmentMetaRef.current[a.numericId] : null;
    const citizenId   = meta?.citizenId   ?? null;
    const collectorId = meta?.collectorId ?? null;

    if (a.status === "completed") {
      try {
        const apResponse = await fetch("http://localhost:8080/api/assign-partner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            assignmentId:      a.numericId,
            partnerId:         parseInt(partner),
            materialType:      materialStr,
            weightKg:          weightStr,
            citizenId,
            collectorId,
            materialBreakdown: JSON.stringify(
              lines.map((l) => ({ type: l.type, weightKg: parseFloat(l.weightKg) || 0 })),
            ),
            supervisorId: user?.id ?? 1,
          }),
        });

        if (!apResponse.ok) {
          const err = await apResponse.json();
          setError(err.message ?? "Failed to create assign_partner record");
          return;
        }

        const apResult = await apResponse.json();
        console.log("[handleAssign] assign_partner created:", apResult);

        const apId = toNumber(apResult.id);
        const apPartnerId = toNumber(apResult.partnerId ?? apResult.partner_id);
        if (apId != null && apPartnerId != null) {
          assignPartnerToPartnerRef.current[apId] = apPartnerId;
        }
        if (apPartnerId != null) {
          setSelectedPartners((prev) => ({ ...prev, [id]: String(apPartnerId) }));
        }

        setWasteAssignments((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, material: materialStr, weight: weightStr, partner, status: "recyclated" as const }
              : item,
          ),
        );
        setMaterialLines((prev) => ({ ...prev, [id]: lines }));
        setExpandedId(null);
        flash(`${id} assigned to partner — ${materialStr} · ${weightStr} · Ready to compensate`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to assign");
      }
      return;
    }

    ctxAssign(id, partner);
    setExpandedId(null);
    flash(`${id} assigned to ${partner} — ${materialStr} · ${weightStr}`);
  }

  async function handleCompensate(id: string) {
    const wasteItem = wasteAssignments.find((x) => x.id === id);
    if (!wasteItem) return;

    try {
      let materials = materialLines[id] ?? [];
      // Start from the dropdown selection only. wasteItem.partner can be a
      // partner NAME string (set during the assign-partner overlay), not an ID,
      // so it must never be used as a numeric partner id source.
      let partner = selectedPartners[id] ?? "";

      let assignPartnerId: number | null = null;
      let citizenId:   number | null = null;
      let collectorId: number | null = null;

      const meta = wasteItem.numericId != null ? assignmentMetaRef.current[wasteItem.numericId] : null;
      citizenId   = meta?.citizenId   ?? null;
      collectorId = meta?.collectorId ?? null;

      try {
        const apRes = await fetch(
          `http://localhost:8080/api/assign-partner/assignment/${wasteItem.numericId}`,
          { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" },
        );
        if (apRes.ok) {
          const apData = await apRes.json();
          assignPartnerId = toNumber(apData.id);
          if (!citizenId)   citizenId   = toNumber(apData.citizenId ?? apData.citizen_id);
          if (!collectorId) collectorId = toNumber(apData.collectorId ?? apData.collector_id);

          if (materials.length === 0) {
            if (apData.materials?.length > 0) {
              materials = apData.materials.map((m: { type: string; weightKg: number }) => ({
                id: Math.random().toString(36).slice(2),
                type: m.type,
                weightKg: String(m.weightKg),
              }));
            } else if ((apData.materialType ?? apData.material_type) && (apData.weightKg ?? apData.weight_kg)) {
              const types   = String(apData.materialType ?? apData.material_type).split(",").map((s: string) => s.trim());
              const weights = String(apData.weightKg ?? apData.weight_kg).split(",").map((s: string) => s.trim());
              materials = types.map((type: string, i: number) => ({
                id: Math.random().toString(36).slice(2),
                type,
                weightKg: weights[i] ?? "0",
              }));
            }
          }

          const apPartnerId = toNumber(apData.partnerId ?? apData.partner_id);
          if (assignPartnerId != null && apPartnerId != null) {
            assignPartnerToPartnerRef.current[assignPartnerId] = apPartnerId;
          }
          if (apPartnerId != null) {
            partner = String(apPartnerId);
          }
        }
      } catch (e) {
        console.warn("[handleCompensate] Could not fetch assign_partner:", e);
      }

      // Last-resort fallback: only accept wasteItem.partner if it's actually numeric.
      if (!partner && wasteItem.partner && /^\d+$/.test(wasteItem.partner)) {
        partner = wasteItem.partner;
      }

      if (!citizenId || !collectorId) {
        try {
          const aRes = await fetch(
            `http://localhost:8080/api/assignments/${wasteItem.numericId}`,
            { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" },
          );
          if (aRes.ok) {
            const aData = await aRes.json();
            if (!citizenId)   citizenId   = aData.wasteReport?.userId ?? null;
            if (!collectorId) collectorId = aData.collectorId ?? aData.collector_id ?? null;
          }
        } catch { /* give up */ }
      }

      const partnerIdNum = parseInt(partner, 10);

      if (!partner || Number.isNaN(partnerIdNum) || materials.length === 0) {
        setError("Could not resolve a valid partner for this assignment. Please refresh and try again.");
        return;
      }

      const compResponse = await fetch("http://localhost:8080/api/compensations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          assignmentId:   wasteItem.numericId,
          assignPartnerId,
          citizenId,
          collectorId,
          supervisorId: user?.id ?? 1,
          partnerId:    partnerIdNum,
          materials: materials.map((l) => ({
            type: l.type,
            weightKg: parseFloat(l.weightKg) || 0,
          })),
        }),
      });

      if (!compResponse.ok) {
        const err = await compResponse.json();
        setError(err.message ?? "Failed to compensate");
        return;
      }

      const result = normalizeCompensation(await compResponse.json());
      const resolvedPartnerId =
        partnerIdNum ??
        resolveCompensationPartnerId(result, assignPartnerToPartnerRef.current);

      if (assignPartnerId != null && resolvedPartnerId != null) {
        assignPartnerToPartnerRef.current[assignPartnerId] = resolvedPartnerId;
      }

      const storedComp: CompensationRecord = {
        ...result,
        partnerId: resolvedPartnerId,
        assignPartnerId: result.assignPartnerId ?? assignPartnerId,
      };
      console.log("[handleCompensate] Compensation created:", storedComp);

      if (wasteItem.numericId != null) {
        setCompensationMap((prev) => ({ ...prev, [wasteItem.numericId!]: storedComp }));
      }

      ctxCompensate(id);
      setWasteAssignments((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "compensated" as const,
                compensation: `${result.netAmount.toLocaleString("fr-CG", { maximumFractionDigits: 0 })} XAF`,
              }
            : item,
        ),
      );

      flash(
        `${id} compensated — Net: ${result.netAmount?.toLocaleString("fr-CG", { maximumFractionDigits: 0 })} XAF · Citizen: ${result.citizenAmount?.toLocaleString("fr-CG", { maximumFractionDigits: 0 })} XAF`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compensate");
    }
  }

  const filteredPartners = partners.filter((p) => {
    const q = searchTerm.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
  });

  const activeAssignments = wasteAssignments.length > 0 ? wasteAssignments : assignments;
  const filteredAssignments = activeAssignments.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchQ =
      !q ||
      a.id.toLowerCase().includes(q) ||
      a.citizen.toLowerCase().includes(q) ||
      (a.collector ?? "").toLowerCase().includes(q) ||
      a.material.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q);
    return matchQ && (filterStatus === "all" || a.status === filterStatus);
  });

  const detail       = detailId !== null ? partners.find((p) => p.id === detailId) ?? null : null;
  const deleteTarget = deleteId !== null ? partners.find((p) => p.id === deleteId) ?? null : null;
  const partnerNames = partners.map((p) => ({ id: p.id, name: p.name }));

  const topStats = buildTopStats(compensationMap);

  return (
    <div style={{ fontFamily: "'Nunito Sans','DM Sans',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');
        .pp-num-blue  { color: var(--blue,  #3b82f6) }
        .pp-num-amber { color: var(--amber, #f59e0b) }
        .pp-num-green { color: var(--green, #1cb97a) }
        .rm-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px }
        @media(max-width:700px){ .rm-stats-grid { grid-template-columns: repeat(2,1fr) } }
        .rm-stat-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; padding: 10px 16px; display: flex; flex-direction: column; }
        .rm-stat-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 6px 16px rgba(0,0,0,0.13); }
        .rm-stat-label { font-size: 12px; font-weight: 600; color: #9aa0ac; margin-bottom: 2px }
        .rm-stat-value { font-size: 28px; font-weight: 800; color: #1a1e25; letter-spacing: -0.04em; line-height: 1 }
        .rm-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden }
        .rm-tabs { display: flex; border-bottom: 1px solid #dde1e7; background: #f0f2f5 }
        .rm-tab { flex: 1; padding: 11px 16px; background: transparent; border: none; border-bottom: 2px solid transparent; font-size: 12.5px; font-weight: 700; color: #8a9099; cursor: pointer; font-family: inherit; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; letter-spacing: 0.01em; }
        .rm-tab:hover { color: #1a1e25; background: rgba(255,255,255,0.6) }
        .rm-tab.active { color: var(--green,#1cb97a); background: #fff; border-bottom-color: var(--green,#1cb97a) }
        .rm-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 12px 16px; border-bottom: 1px solid #dde1e7; background: #fafbfc; }
        .rm-search-wrap { position: relative; flex: 1 1 180px }
        .rm-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #aab0bb; pointer-events: none }
        .rm-input { width: 100%; padding: 8px 12px 8px 34px; border: 1px solid #dde1e7; border-radius: 6px; font-size: 12.5px; font-weight: 600; color: #1a1e25; background: #fff; font-family: inherit; outline: none; transition: border-color 0.15s; box-sizing: border-box; min-height: 40px; }
        .rm-input:focus { border-color: var(--green,#1cb97a) }
        .rm-input::placeholder { color: #aab0bb; font-weight: 500 }
        .rm-count { font-size: 10.5px; font-weight: 800; background: #f0f2f5; color: #6b7a8f; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.03em; white-space: nowrap; flex-shrink: 0; }
        .rm-select-wrap { position: relative; }
        .rm-select-icon { position: absolute; top: 50%; transform: translateY(-50%); color: #aab0bb; pointer-events: none; }
        .rm-select { padding: 8px 28px 8px 34px; border: 1px solid #dde1e7; border-radius: 6px; font-size: 12.5px; font-weight: 600; color: #1a1e25; background: #fff; font-family: inherit; appearance: none; cursor: pointer; outline: none; transition: border-color 0.15s; min-height: 40px; }
        .rm-select:focus { border-color: var(--green,#1cb97a); }
        .rm-table-wrap { overflow-x: auto }
        .rm-table { width: 100%; border-collapse: collapse }
        .rm-th { padding: 8px 14px; text-align: left; font-size: 10.5px; font-weight: 800; color: #9aa0ac; letter-spacing: 0.06em; text-transform: uppercase; background: #f7f8fa; border-bottom: 1px solid #eef0f3; }
        .rm-td { padding: 12px 14px; font-size: 12.5px; color: #1a1e25; border-bottom: 1px solid #eef0f3; vertical-align: middle }
        .rm-tr:last-child .rm-td { border-bottom: none }
        .rm-tr:hover .rm-td { background: #f7f8fa }
        .rm-tr.rm-tr-expanded .rm-td { background: #f0faf5; border-bottom: none; }
        .rm-tr.rm-tr-clickable { cursor: pointer; }
        .rm-tr.rm-tr-clickable:hover .rm-td { background: #edf9f4; }
        .rm-tr.rm-tr-expanded.rm-tr-clickable:hover .rm-td { background: #e6f7f0; }
        .rm-cta-btn { background: var(--green,#1cb97a); color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; letter-spacing: 0.02em; min-height: 40px; }
        .rm-cta-btn:hover { opacity: 0.9 }
        .rm-action-btn-violet { display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px; border-radius: 5px; border: 1px solid #c4b5fd; background: #ede9fe; color: var(--violet,#7c6be8); font-size: 11px; font-weight: 700; font-family: inherit; cursor: pointer; transition: opacity 0.12s; min-height: 32px; }
        .rm-action-btn-violet:hover { opacity: 0.85 }
        .rm-locked-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; color: #9aa0ac; background: #f0f2f5; border: 1px solid #dde1e7; border-radius: 4px; padding: 3px 8px; }
        .me-panel { background: #f0faf5; border-top: 2px solid #1cb97a; border-bottom: 1px solid #bbf7d0; padding: 0; animation: me-slide-in 0.18s ease; }
        @keyframes me-slide-in { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .me-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #e6f7f0; border-bottom: 1px solid #bbf7d0; }
        .me-title { font-size: 12px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 0.06em; }
        .me-sub { font-size: 11.5px; font-weight: 600; color: #6b7a8f; }
        .me-close-btn { width: 26px; height: 26px; border-radius: 5px; border: 1px solid #bbf7d0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6b7a8f; }
        .me-close-btn:hover { background: #f0f2f5; }
        .me-body { display: flex; gap: 0; align-items: stretch; }
        .me-lines-wrap { flex: 1; padding: 14px 16px; border-right: 1px solid #bbf7d0; display: flex; flex-direction: column; gap: 8px; }
        .me-lines-header { display: flex; align-items: center; gap: 8px; padding-bottom: 4px; border-bottom: 1px solid #d1fae5; margin-bottom: 2px; }
        .me-col-label { font-size: 9.5px; font-weight: 800; color: #6b7a8f; text-transform: uppercase; letter-spacing: 0.07em; }
        .me-line-row { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #d1fae5; border-radius: 7px; padding: 8px 10px; transition: border-color 0.12s; }
        .me-line-row:hover { border-color: #1cb97a; }
        .me-line-index { width: 20px; height: 20px; border-radius: 50%; background: #e6f7f0; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #065f46; flex-shrink: 0; }
        .me-select { width: 100%; padding: 6px 8px; border: 1px solid #d1fae5; border-radius: 6px; font-size: 12px; font-weight: 600; color: #1a1e25; background: #f7fffe; font-family: inherit; appearance: none; cursor: pointer; outline: none; min-height: 34px; transition: border-color 0.12s; }
        .me-select:focus { border-color: #1cb97a; }
        .me-input { width: 100%; padding: 6px 36px 6px 8px; border: 1px solid #d1fae5; border-radius: 6px; font-size: 12px; font-weight: 700; color: #1a1e25; background: #f7fffe; font-family: inherit; outline: none; min-height: 34px; box-sizing: border-box; transition: border-color 0.12s; }
        .me-input:focus { border-color: #1cb97a; background: #fff; }
        .me-input-warn { border-color: #fca5a5 !important; background: #fff5f5 !important; }
        .me-input-unit { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 10px; font-weight: 800; color: #9aa0ac; pointer-events: none; }
        .me-weight-badge { font-size: 10.5px; font-weight: 800; background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; border-radius: 4px; padding: 2px 7px; }
        .me-remove-btn { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 5px; border: 1px solid #fca5a5; background: #fff5f5; color: #ef4444; cursor: pointer; transition: all 0.1s; flex-shrink: 0; }
        .me-remove-btn:hover:not(:disabled) { background: #fee2e2; }
        .me-remove-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .me-add-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; border: 1px dashed #6ee7b7; background: #f0faf5; color: #059669; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.12s; align-self: flex-start; margin-top: 2px; }
        .me-add-btn:hover { background: #d1fae5; border-color: #1cb97a; }
        .me-sidebar { width: 240px; flex-shrink: 0; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; background: #e6f7f0; }
        .me-summary-card { background: #fff; border: 1px solid #d1fae5; border-radius: 7px; padding: 10px 12px; display: flex; flex-direction: column; gap: 5px; }
        .me-summary-title { font-size: 9.5px; font-weight: 800; color: #6b7a8f; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 2px; }
        .me-summary-row { display: flex; justify-content: space-between; align-items: center; }
        .me-summary-label { font-size: 11px; font-weight: 600; color: #8a9099; }
        .me-summary-val { font-size: 12px; font-weight: 800; color: #1a1e25; }
        .me-summary-line-item { display: flex; justify-content: space-between; align-items: center; padding: 2px 0 2px 8px; border-left: 2px solid #6ee7b7; }
        .me-summary-mat { font-size: 10.5px; font-weight: 700; color: #4a5568; }
        .me-summary-wt { font-size: 10.5px; font-weight: 800; color: #1cb97a; }
        .me-partner-group { display: flex; flex-direction: column; gap: 5px; }
        .me-partner-label { font-size: 10px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.06em; }
        .me-partner-select { width: 100%; padding: 7px 28px 7px 10px; border: 1px solid #d1fae5; border-radius: 6px; font-size: 12px; font-weight: 600; color: #1a1e25; background: #fff; font-family: inherit; appearance: none; cursor: pointer; outline: none; min-height: 36px; transition: border-color 0.12s; }
        .me-partner-select:focus { border-color: #1cb97a; }
        .me-hint { display: flex; align-items: flex-start; gap: 6px; font-size: 11px; font-weight: 600; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 7px 10px; }
        .me-assign-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 14px; border-radius: 6px; border: none; background: #1cb97a; color: #fff; font-size: 12.5px; font-weight: 800; cursor: pointer; font-family: inherit; transition: opacity 0.12s; letter-spacing: 0.02em; min-height: 38px; }
        .me-assign-btn:hover:not(:disabled) { opacity: 0.87; }
        .me-assign-btn:disabled { background: #a7f3d0; color: #6ee7b7; cursor: not-allowed; }
        .pp-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px }
        @media(max-width:580px){ .pp-grid { grid-template-columns: 1fr } }
        .pp-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column }
        .pp-card-top { padding: 14px 16px; display: flex; align-items: flex-start; gap: 12px; border-bottom: 1px solid #eef0f3 }
        .pp-avatar { width: 42px; height: 42px; border-radius: 50%; background: #f0f2f5; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #4a5568; flex-shrink: 0 }
        .pp-name { font-size: 13.5px; font-weight: 800; color: #1a1e25; margin-bottom: 4px }
        .pp-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 11px; font-weight: 600; color: #aab0bb }
        .pp-meta-item { display: flex; align-items: center; gap: 3px }
        .pp-card-stats { display: grid; grid-template-columns: repeat(3,1fr); border-bottom: 1px solid #eef0f3 }
        .pp-card-stat { padding: 12px 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; border-right: 1px solid #eef0f3 }
        .pp-card-stat:last-child { border-right: none }
        .pp-stat-num { font-size: 18px; font-weight: 800; letter-spacing: -0.03em; line-height: 1 }
        .pp-stat-sublabel { font-size: 10px; font-weight: 800; color: #aab0bb; text-transform: uppercase; letter-spacing: 0.06em }
        .pp-materials { padding: 10px 16px; display: flex; flex-wrap: wrap; gap: 5px; border-bottom: 1px solid #eef0f3 }
        .pp-material-tag { display: inline-flex; padding: 3px 8px; background: #f0f2f5; border-radius: 4px; font-size: 10.5px; font-weight: 700; color: #4a5568; border: 1px solid #dde1e7 }
        .pp-card-footer { padding: 9px 16px; display: flex; align-items: center; justify-content: space-between; background: #f7f8fa }
        .pp-footer-text { font-size: 10.5px; font-weight: 700; color: #aab0bb }
        .pp-badge-active   { font-size: 11px; font-weight: 800; color: var(--green,#1cb97a); letter-spacing: 0.02em }
        .pp-badge-inactive { font-size: 11px; font-weight: 800; color: #9aa0ac; letter-spacing: 0.02em }
        .pp-card-actions { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-top: 1px solid #eef0f3; background: #fff }
        .pp-action-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px; border-radius: 5px; font-size: 11px; font-weight: 700; font-family: inherit; cursor: pointer; letter-spacing: 0.02em; transition: opacity 0.12s; border: 1px solid transparent; flex: 1; justify-content: center; min-height: 32px; }
        .pp-action-btn:hover { opacity: 0.8 }
        .pp-btn-view   { background: #f0f2f5; color: #4a5568; border-color: #dde1e7 }
        .pp-btn-edit   { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe }
        .pp-btn-delete { background: #fee2e2; color: #b91c1c; border-color: #fca5a5 }
        .pp-btn-add { display: inline-flex; align-items: center; gap: 6px; background: #1cb97a; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; letter-spacing: 0.02em; transition: opacity 0.12s; min-height: 40px; }
        .pp-btn-back { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 700; color: #6b7a8f; font-family: inherit; padding: 0; margin-bottom: 6px; }
        .pp-btn-back:hover { color: #1a1e25 }
        .pp-success { background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 10px 16px; display: flex; align-items: center; gap: 10px; font-size: 12.5px; font-weight: 700; color: #065f46; }
        .pp-empty { text-align: center; padding: 48px 16px; font-size: 13px; color: #aab0bb }
        .pp-detail-view { display: flex; flex-direction: column; gap: 0; animation: pp-fade-in 0.18s ease }
        @keyframes pp-fade-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .pp-hero-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden; margin-bottom: 8px }
        .pp-hero-header { background: #f0f2f5; border-bottom: 1px solid #dde1e7; padding: 10px 16px; font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em }
        .pp-hero-body { padding: 20px 20px 16px; display: flex; align-items: center; gap: 20px }
        .pp-hero-avatar { width: 72px; height: 72px; border-radius: 50%; background: #f0f2f5; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: #4a5568; flex-shrink: 0 }
        .pp-hero-name { font-size: 18px; font-weight: 800; color: #1a1e25; margin-bottom: 3px; letter-spacing: -0.01em }
        .pp-hero-sub  { font-size: 12.5px; color: #8a9099; font-weight: 500; margin-bottom: 6px }
        .pp-perf-row  { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid #eef0f3 }
        .pp-perf-cell { padding: 14px 0; display: flex; flex-direction: column; align-items: center; gap: 3px; border-right: 1px solid #eef0f3 }
        .pp-perf-cell:last-child { border-right: none }
        .pp-perf-num  { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; line-height: 1 }
        .pp-perf-label{ font-size: 10px; font-weight: 800; color: #aab0bb; text-transform: uppercase; letter-spacing: 0.06em }
        .pp-info-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden; margin-bottom: 8px }
        .pp-info-card-header { background: #f0f2f5; border-bottom: 1px solid #dde1e7; padding: 10px 16px; font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em }
        .pp-info-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 8px 16px; border-bottom: 1px solid #f0f2f5 }
        .pp-info-row:last-child { border-bottom: none }
        .pp-info-key  { font-size: 11px; font-weight: 700; color: #9aa0ac; flex-shrink: 0; display: flex; align-items: center; gap: 5px; min-width: 110px }
        .pp-info-val  { font-size: 12.5px; font-weight: 700; color: #1a1e25; text-align: right }
        .pp-detail-footer { background: #f0f2f5; border: 1px solid #dde1e7; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between }
        .pp-detail-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px }
        .pp-btn-save-inline { display: inline-flex; align-items: center; gap: 6px; background: #1cb97a; color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; min-height: 36px; }
        .pp-overlay { position: fixed; inset: 0; background: rgba(10,14,20,0.55); z-index: 200; backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center }
        .pp-modal { background: #fff; border: 1px solid #dde1e7; border-radius: 10px; box-shadow: 0 24px 64px rgba(0,0,0,0.18); overflow: hidden; display: flex; flex-direction: column; max-height: calc(100vh - 64px); animation: pp-modal-in 0.18s ease; }
        @keyframes pp-modal-in { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        .pp-modal-header { background: #f0f2f5; border-bottom: 1px solid #dde1e7; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0 }
        .pp-modal-title { font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em }
        .pp-modal-subtitle { font-size: 11px; color: #9aa0ac; margin-top: 1px }
        .pp-modal-close { width: 26px; height: 26px; border-radius: 5px; border: 1px solid #dde1e7; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6b7a8f }
        .pp-modal-close:hover { background: #f0f2f5 }
        .pp-modal-body { padding: 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px }
        .pp-modal-footer { background: #f0f2f5; border-top: 1px solid #dde1e7; padding: 10px 16px; display: flex; gap: 8px; justify-content: flex-end; flex-shrink: 0 }
        .pp-modal-btn-cancel { padding: 7px 16px; border-radius: 6px; border: 1px solid #dde1e7; background: #fff; font-size: 12.5px; font-weight: 700; color: #4a5568; cursor: pointer; font-family: inherit; min-height: 36px }
        .pp-modal-btn-save { padding: 7px 18px; border-radius: 6px; border: none; background: #1cb97a; color: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; min-height: 36px }
        .pp-modal-btn-danger { padding: 7px 18px; border-radius: 6px; border: none; background: #dc2626; color: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; min-height: 36px }
        .pp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
        @media(max-width:480px){ .pp-form-grid { grid-template-columns: 1fr } }
        .pp-form-group { display: flex; flex-direction: column; gap: 5px }
        .pp-form-label { font-size: 10.5px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.06em }
        .pp-form-input { padding: 8px 10px; border: 1px solid #dde1e7; border-radius: 6px; font-size: 12.5px; font-weight: 600; color: #1a1e25; background: #f7f8fa; font-family: inherit; outline: none; min-height: 40px; transition: border-color 0.15s }
        .pp-form-input:focus { border-color: #1cb97a; background: #fff }
        .pp-form-input.error { border-color: #ef4444 }
        .pp-form-select { padding: 8px 10px; border: 1px solid #dde1e7; border-radius: 6px; font-size: 12.5px; font-weight: 600; color: #1a1e25; background: #f7f8fa; font-family: inherit; outline: none; appearance: none; cursor: pointer; min-height: 40px; transition: border-color 0.15s }
        .pp-form-select:focus { border-color: #1cb97a; background: #fff }
        .pp-form-section { font-size: 10.5px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em; padding-bottom: 6px; border-bottom: 1px solid #eef0f3; margin-bottom: 4px }
        .pp-form-error { font-size: 10.5px; color: #dc2626; font-weight: 600 }
        .pp-material-toggle { display: flex; flex-wrap: wrap; gap: 6px }
        .pp-mat-btn { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1px solid #dde1e7; background: #f0f2f5; color: #4a5568; transition: all 0.1s }
        .pp-mat-btn.selected { background: #1cb97a; color: #fff; border-color: #1cb97a }
      `}</style>

      {/* ── Add Partner Modal ── */}
      {showAdd && (
        <div className="pp-overlay" onClick={() => setShowAdd(false)} aria-hidden="true">
          <div role="dialog" aria-modal="true" aria-labelledby="pp-add-title"
            className="pp-modal" style={{ width: 540, maxWidth: "calc(100vw - 32px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pp-modal-header">
              <div>
                <div id="pp-add-title" className="pp-modal-title">Add New Partner</div>
                <div className="pp-modal-subtitle">Register a recycling company</div>
              </div>
              <button type="button" className="pp-modal-close" aria-label="Close" onClick={() => setShowAdd(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="pp-modal-body">
              <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                <legend className="pp-form-section">Company Details</legend>
                <div className="pp-form-grid" style={{ marginTop: 10 }}>
                  {[
                    { id: "pp-name",    label: "Name",          field: "name",    placeholder: "e.g. EcoRecycle Congo" },
                    { id: "pp-contact", label: "Phone",         field: "contact", placeholder: "+242 0X XXX XXXX" },
                    { id: "pp-email",   label: "Email",         field: "email",   placeholder: "name@company.cg" },
                    { id: "pp-rate",    label: "Rate (XAF/kg)", field: "rate",    placeholder: "e.g. 500 XAF/kg" },
                  ].map(({ id, label, field, placeholder }) => (
                    <div className="pp-form-group" key={id}>
                      <label className="pp-form-label" htmlFor={id}>
                        {label} <span style={{ color: "#e53e3e" }} aria-hidden="true">*</span>
                      </label>
                      <input
                        id={id}
                        className={`pp-form-input${addErrors[field as keyof typeof addErrors] ? " error" : ""}`}
                        placeholder={placeholder}
                        value={(addForm as any)[field]}
                        onChange={(e) => setAddForm({ ...addForm, [field]: e.target.value })}
                      />
                      {addErrors[field as keyof typeof addErrors] && (
                        <span className="pp-form-error" role="alert">{addErrors[field as keyof typeof addErrors]}</span>
                      )}
                    </div>
                  ))}
                  <div className="pp-form-group">
                    <label className="pp-form-label" htmlFor="pp-type">Type <span style={{ color: "#e53e3e" }}>*</span></label>
                    <select id="pp-type" className={`pp-form-select${addErrors.type ? " error" : ""}`}
                      value={addForm.type} onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}>
                      <option value="">Select type</option>
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {addErrors.type && <span className="pp-form-error" role="alert">{addErrors.type}</span>}
                  </div>
                  <div className="pp-form-group">
                    <label className="pp-form-label" htmlFor="pp-location">Location <span style={{ color: "#e53e3e" }}>*</span></label>
                    <select id="pp-location" className={`pp-form-select${addErrors.location ? " error" : ""}`}
                      value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}>
                      <option value="">Select location</option>
                      {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    {addErrors.location && <span className="pp-form-error" role="alert">{addErrors.location}</span>}
                  </div>
                </div>
              </fieldset>
              <div>
                <div className="pp-form-section" style={{ marginBottom: 10 }}>Materials Accepted</div>
                <div className="pp-material-toggle">
                  {ALL_MATERIALS.map((m) => (
                    <button key={m} type="button"
                      className={`pp-mat-btn${addForm.materialsAccepted.includes(m) ? " selected" : ""}`}
                      onClick={() => setAddForm({ ...addForm, materialsAccepted: toggleMaterial(addForm.materialsAccepted, m) })}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pp-form-group">
                <label className="pp-form-label" htmlFor="pp-status">Status</label>
                <select id="pp-status" className="pp-form-select" value={addForm.status}
                  onChange={(e) => setAddForm({ ...addForm, status: e.target.value as PartnerStatus })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="pp-modal-footer">
              <button type="button" className="pp-modal-btn-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="button" className="pp-modal-btn-save" onClick={handleAddSave}><Save size={12} /> Add Partner</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Partner Modal ── */}
      {editId && editForm && (
        <div className="pp-overlay" onClick={closeEdit} aria-hidden="true">
          <div role="dialog" aria-modal="true" aria-labelledby="pp-edit-title"
            className="pp-modal" style={{ width: 540, maxWidth: "calc(100vw - 32px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pp-modal-header">
              <div>
                <div id="pp-edit-title" className="pp-modal-title">Edit Partner</div>
                <div className="pp-modal-subtitle">{editForm.name}</div>
              </div>
              <button type="button" className="pp-modal-close" aria-label="Close" onClick={closeEdit}><X size={14} /></button>
            </div>
            <div className="pp-modal-body">
              <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                <legend className="pp-form-section">Company Details</legend>
                <div className="pp-form-grid" style={{ marginTop: 10 }}>
                  {[
                    { id: "pp-edit-name",      label: "Name",            field: "name"           },
                    { id: "pp-edit-contact",   label: "Phone",           field: "contact"        },
                    { id: "pp-edit-email",     label: "Email",           field: "email"          },
                    { id: "pp-edit-rate",      label: "Rate",            field: "rate"           },
                    { id: "pp-edit-collected", label: "Total Collected", field: "totalCollected" },
                  ].map(({ id, label, field }) => (
                    <div className="pp-form-group" key={id}>
                      <label className="pp-form-label" htmlFor={id}>{label}</label>
                      <input id={id} className="pp-form-input" value={(editForm as any)[field]}
                        onChange={(e) => { setEditForm({ ...editForm, [field]: e.target.value }); setEditDirty(true); }} />
                    </div>
                  ))}
                  <div className="pp-form-group">
                    <label className="pp-form-label" htmlFor="pp-edit-type">Type</label>
                    <select id="pp-edit-type" className="pp-form-select" value={editForm.type}
                      onChange={(e) => { setEditForm({ ...editForm, type: e.target.value }); setEditDirty(true); }}>
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="pp-form-group">
                    <label className="pp-form-label" htmlFor="pp-edit-location">Location</label>
                    <select id="pp-edit-location" className="pp-form-select" value={editForm.location}
                      onChange={(e) => { setEditForm({ ...editForm, location: e.target.value }); setEditDirty(true); }}>
                      {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="pp-form-group">
                    <label className="pp-form-label" htmlFor="pp-edit-status">Status</label>
                    <select id="pp-edit-status" className="pp-form-select" value={editForm.status}
                      onChange={(e) => { setEditForm({ ...editForm, status: e.target.value as PartnerStatus }); setEditDirty(true); }}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </fieldset>
              <div>
                <div className="pp-form-section" style={{ marginBottom: 10 }}>Materials Accepted</div>
                <div className="pp-material-toggle">
                  {ALL_MATERIALS.map((m) => (
                    <button key={m} type="button"
                      className={`pp-mat-btn${editForm.materialsAccepted.includes(m) ? " selected" : ""}`}
                      onClick={() => { setEditForm({ ...editForm, materialsAccepted: toggleMaterial(editForm.materialsAccepted, m) }); setEditDirty(true); }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pp-modal-footer">
              <button type="button" className="pp-modal-btn-cancel" onClick={closeEdit}>Cancel</button>
              <button type="button" className="pp-modal-btn-save" onClick={handleEditSave}
                disabled={!editDirty} style={!editDirty ? { background: "#a0cfbc", cursor: "not-allowed" } : {}}>
                <Save size={12} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteId && deleteTarget && (
        <div className="pp-overlay" onClick={() => setDeleteId(null)} aria-hidden="true">
          <div role="dialog" aria-modal="true" aria-labelledby="pp-delete-title"
            className="pp-modal" style={{ width: 400, maxWidth: "calc(100vw - 32px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pp-modal-header">
              <div>
                <div id="pp-delete-title" className="pp-modal-title">Remove Partner</div>
                <div className="pp-modal-subtitle">This action cannot be undone</div>
              </div>
              <button type="button" className="pp-modal-close" aria-label="Close" onClick={() => setDeleteId(null)}><X size={14} /></button>
            </div>
            <div className="pp-modal-body">
              <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1, color: "#dc2626" }} />
                <div>
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: "#991b1b" }}>Remove {deleteTarget.name}?</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9f1239", lineHeight: 1.5 }}>
                    This will permanently remove this partner from the system.
                  </p>
                </div>
              </div>
              <div style={{ background: "#f7f8fa", border: "1px solid #dde1e7", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div className="pp-avatar" aria-hidden="true" style={{ width: 36, height: 36, fontSize: 11 }}>{initials(deleteTarget.name)}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#1a1e25" }}>{deleteTarget.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#aab0bb", fontWeight: 600 }}>
                    {deleteTarget.location} · {deleteTarget.totalCollected} collected
                  </p>
                </div>
              </div>
            </div>
            <div className="pp-modal-footer">
              <button type="button" className="pp-modal-btn-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button type="button" className="pp-modal-btn-danger" onClick={handleDelete}><Trash2 size={12} /> Remove Partner</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail View ── */}
      {detail ? (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <button className="pp-btn-back" type="button" onClick={() => setDetailId(null)}>
                <ChevronLeft size={14} /> Back to Recycling Management
              </button>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1e25", letterSpacing: "-0.02em" }}>{detail.name}</h1>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#8a9099", fontWeight: 500 }}>
                Recycling Partner · {detail.location} · {detail.id}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="pp-action-btn pp-btn-edit" style={{ flex: "none" }} onClick={() => openEdit(detail)}><Edit size={11} /> Edit</button>
              <button type="button" className="pp-action-btn pp-btn-delete" style={{ flex: "none" }} onClick={() => setDeleteId(detail.id)}><Trash2 size={11} /> Remove</button>
            </div>
          </div>
          <div role="status" aria-live="polite" aria-atomic="true" style={{ marginBottom: successMsg ? 8 : 0 }}>
            {successMsg && <div className="pp-success"><CheckCircle2 size={15} style={{ flexShrink: 0, color: "#1cb97a" }} />{successMsg}</div>}
          </div>
          <div className="pp-detail-view">
            <div className="pp-hero-card">
              <div className="pp-hero-header">Partner Profile</div>
              <div className="pp-hero-body">
                <div className="pp-hero-avatar" aria-hidden="true">{initials(detail.name)}</div>
                <div style={{ flex: 1 }}>
                  <div className="pp-hero-name">{detail.name}</div>
                  <div className="pp-hero-sub">{detail.type} · {detail.location}</div>
                  <span className={detail.status === "active" ? "pp-badge-active" : "pp-badge-inactive"}>
                    {detail.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="pp-perf-row" role="list">
                <div className="pp-perf-cell" role="listitem"><span className="pp-perf-num pp-num-green">{(() => { const stats = getPartnerStats(detail.id); return stats.totalXafLabel; })()}</span><span className="pp-perf-label">Total XAF</span></div>
                <div className="pp-perf-cell" role="listitem"><span className="pp-perf-num pp-num-amber">{(() => { const stats = getPartnerStats(detail.id); return stats.collectedLabel; })()}</span><span className="pp-perf-label">Collected</span></div>
                <div className="pp-perf-cell" role="listitem"><span className="pp-perf-num pp-num-blue">{(() => { const stats = getPartnerStats(detail.id); return stats.materials.length; })()}</span><span className="pp-perf-label">Materials</span></div>
              </div>
            </div>
            <div className="pp-detail-info-grid">
              <div className="pp-info-card" style={{ margin: 0 }}>
                <div className="pp-info-card-header">Contact</div>
                <div className="pp-info-row"><span className="pp-info-key"><Phone size={11} /> Phone</span><span className="pp-info-val">{detail.contact}</span></div>
                <div className="pp-info-row"><span className="pp-info-key"><Mail size={11} /> Email</span><span className="pp-info-val">{detail.email}</span></div>
                <div className="pp-info-row"><span className="pp-info-key"><MapPin size={11} /> Location</span><span className="pp-info-val">{detail.location}</span></div>
              </div>
              <div className="pp-info-card" style={{ margin: 0 }}>
                <div className="pp-info-card-header">Operations</div>
                <div className="pp-info-row"><span className="pp-info-key"><Building2 size={11} /> Type</span><span className="pp-info-val">{detail.type}</span></div>
                <div className="pp-info-row"><span className="pp-info-key"><Package size={11} /> Rate</span><span className="pp-info-val" style={{ color: "#1cb97a" }}>{detail.rate}</span></div>
                <div className="pp-info-row">
                  <span className="pp-info-key"><CheckCircle2 size={11} /> Status</span>
                  <span className={detail.status === "active" ? "pp-badge-active" : "pp-badge-inactive"}>{detail.status === "active" ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
            <div className="pp-info-card">
              <div className="pp-info-card-header">Materials Accepted</div>
              <div style={{ padding: "10px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                {detail.materialsAccepted.length > 0
                  ? detail.materialsAccepted.map((m) => <span key={m} className="pp-material-tag">{m}</span>)
                  : <span style={{ fontSize: 12.5, color: "#aab0bb", fontWeight: 600 }}>No materials listed</span>}
              </div>
            </div>
            <div className="pp-detail-footer">
              <span style={{ fontSize: 11.5, color: "#8a9099", fontWeight: 600 }}>Partner {detail.id}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="pp-action-btn pp-btn-delete" style={{ flex: "none" }} onClick={() => setDeleteId(detail.id)}><Trash2 size={11} /> Remove</button>
                <button type="button" className="pp-btn-save-inline" onClick={() => openEdit(detail)}><Edit size={13} /> Edit Partner</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1e25", letterSpacing: "-0.02em" }}>Recycling Management</h1>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#8a9099", fontWeight: 500 }}>
                Manage partners, recyclable waste assignments, and citizen compensation
              </p>
            </div>
            <button className="rm-cta-btn" onClick={() => { setAddForm(EMPTY_FORM); setAddErrors({}); setShowAdd(true); }}>
              <Plus size={13} /> Add Partner
            </button>
          </div>

          <div role="status" aria-live="polite" aria-atomic="true" style={{ marginBottom: successMsg || error ? 8 : 0 }}>
            {error && (
              <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 8, color: "#991b1b" }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
                <button type="button" onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#991b1b", fontSize: 16 }}>×</button>
              </div>
            )}
            {successMsg && <div className="pp-success"><CheckCircle2 size={15} style={{ flexShrink: 0, color: "#1cb97a" }} />{successMsg}</div>}
          </div>

          <div style={{ background: "#f7f8fa", border: "1px solid #dde1e7", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="rm-stats-grid" role="list">
              {topStats.map((s) => {
                const Icon = s.icon;
                const grad = STAT_GRADIENTS[s.color];
                return (
                  <div className="rm-stat-card" key={s.label} role="listitem">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div className="rm-stat-icon" aria-hidden="true" style={{ background: `linear-gradient(135deg,${grad.from},${grad.to})` }}>
                        <Icon size={20} color="#fff" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="rm-stat-label">{s.label}</div>
                        <div className="rm-stat-value">{s.value}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rm-card">
              <div className="rm-tabs" role="tablist">
                {TAB_DEFS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} role="tab" aria-selected={activeTab === t.id}
                      className={`rm-tab${activeTab === t.id ? " active" : ""}`}
                      onClick={() => { setActiveTab(t.id); setSearchTerm(""); setDetailId(null); setFilterStatus("all"); setExpandedId(null); }}>
                      <Icon size={13} /> {t.label}
                    </button>
                  );
                })}
              </div>

              {activeTab !== "compensation" && (
                <div className="rm-toolbar">
                  <div className="rm-search-wrap">
                    <Search size={13} className="rm-search-icon" />
                    <input type="text" className="rm-input"
                      placeholder={activeTab === "waste" ? "Search by ID, citizen, material…" : `Search ${activeTab}…`}
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  {activeTab === "waste" && (
                    <div className="rm-select-wrap">
                      <Filter size={13} style={{ left: 11 }} className="rm-select-icon" />
                      <select className="rm-select" value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as AssignmentStatus | "all")}>
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="completed">Completed</option>
                        <option value="recyclated">Recycled</option>
                        <option value="compensated">Compensated</option>
                      </select>
                      <ChevronDown size={12} style={{ right: 9 }} className="rm-select-icon" />
                    </div>
                  )}
                  <span className="rm-count" aria-live="polite">
                    {activeTab === "partners"
                      ? `${filteredPartners.length} partner${filteredPartners.length !== 1 ? "s" : ""}`
                      : `${filteredAssignments.length} result${filteredAssignments.length !== 1 ? "s" : ""}`}
                  </span>
                </div>
              )}

              {/* ── Partners tab ── */}
              {activeTab === "partners" && (
                <div id="rm-panel-partners" role="tabpanel">
                  {filteredPartners.length === 0 ? (
                    <div className="pp-empty" role="status">No partners match your search.</div>
                  ) : (
                    <div style={{ padding: 12 }}>
                      <ul className="pp-grid" role="list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {filteredPartners.map((p) => {
                          const stats = getPartnerStats(p.id);
                          return (
                          <li className="pp-card" key={p.id} role="listitem">
                            <div className="pp-card-top">
                              <div className="pp-avatar" aria-hidden="true">{initials(p.name)}</div>
                              <div style={{ flex: 1 }}>
                                <div className="pp-name">{p.name}</div>
                                <div className="pp-meta">
                                  <span className="pp-meta-item"><MapPin size={10} /> {p.location}</span>
                                  <span className="pp-meta-item"><Phone size={10} /> {p.contact}</span>
                                </div>
                              </div>
                              <span className={p.status === "active" ? "pp-badge-active" : "pp-badge-inactive"}>
                                {p.status === "active" ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <div className="pp-card-stats" role="list">
                              <div className="pp-card-stat" role="listitem">
                                <span className="pp-stat-num pp-num-blue" style={{ fontSize: 12, textAlign: "center", padding: "0 4px" }}>{p.type}</span>
                                <span className="pp-stat-sublabel">Type</span>
                              </div>
                              <div className="pp-card-stat" role="listitem">
                                <span className="pp-stat-num pp-num-green">{stats.totalXafLabel}</span>
                                <span className="pp-stat-sublabel">Total XAF</span>
                              </div>
                              <div className="pp-card-stat" role="listitem">
                                <span className="pp-stat-num pp-num-amber">{stats.collectedLabel}</span>
                                <span className="pp-stat-sublabel">Collected</span>
                              </div>
                            </div>
                            <div className="pp-materials">
                              {stats.materials.length > 0
                                ? stats.materials.map((m) => <span key={m} className="pp-material-tag">{m}</span>)
                                : p.materialsAccepted.map((m) => <span key={m} className="pp-material-tag">{m}</span>)}
                            </div>
                            <div className="pp-card-footer">
                              <span className="pp-footer-text"><Mail size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />{p.email}</span>
                              <span className="pp-footer-text">{p.id}</span>
                            </div>
                            <div className="pp-card-actions">
                              <button type="button" className="pp-action-btn pp-btn-view" onClick={() => setDetailId(p.id)}><Eye size={11} /> View</button>
                              <button type="button" className="pp-action-btn pp-btn-edit" onClick={() => openEdit(p)}><Edit size={11} /> Edit</button>
                              <button type="button" className="pp-action-btn pp-btn-delete" onClick={() => setDeleteId(p.id)}><Trash2 size={11} /> Remove</button>
                            </div>
                          </li>
                        );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* ── Waste tab ── */}
              {activeTab === "waste" && (
                <div id="rm-panel-waste" role="tabpanel" aria-label="Recyclable waste assignments">
                  {filteredAssignments.length === 0 ? (
                    <div className="pp-empty" role="status">
                      <Package size={40} color="#aab0bb" style={{ margin: "0 auto 10px", display: "block", opacity: 0.4 }} />
                      No assignments match your filters.
                    </div>
                  ) : (
                    <div className="rm-table-wrap">
                      <table className="rm-table" aria-label="Recyclable waste assignments">
                        <thead>
                          <tr>
                            {["ID", "Citizen", "Collector", "Material & Weight", "Location", "Partner", "Compensation", "Actions"].map((h) => (
                              <th key={h} className="rm-th" scope="col">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAssignments.map((a) => {
                            const isExpanded = expandedId === a.id;
                            const lines      = materialLines[a.id] ?? [];
                            const selPartner = selectedPartners[a.id] ?? "";
                            const canExpand  = isExpandable(a);

                            const isCompensated =
                              a.status === "compensated" ||
                              (a.numericId != null && compensationMap[a.numericId] != null);

                            const compRecord = a.numericId != null ? compensationMap[a.numericId] : null;
                            const compensationDisplay = compRecord
                              ? `${compRecord.netAmount.toLocaleString("fr-CG", { maximumFractionDigits: 0 })} XAF`
                              : a.compensation;

                            return (
                              <Fragment key={a.id}>
                                <tr
                                  className={`rm-tr${isExpanded ? " rm-tr-expanded" : ""}${canExpand ? " rm-tr-clickable" : ""}`}
                                  onClick={canExpand ? () => toggleExpand(a) : undefined}
                                  title={canExpand ? (isExpanded ? "Click to close editor" : "Click row to edit materials & assign") : undefined}
                                >
                                  <td className="rm-td" style={{ fontWeight: 800, color: "#7c6be8" }}>{a.id}</td>
                                  <td className="rm-td" style={{ fontWeight: 700 }}>{a.citizen}</td>
                                  <td className="rm-td" style={{ fontWeight: 600, color: a.collector ? "#1a1e25" : "#aab0bb", fontSize: 12 }}>
                                    {a.collector
                                      ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Truck size={11} color="#aab0bb" />{a.collector}</span>
                                      : "—"}
                                  </td>
                                  <td className="rm-td">
                                    {canExpand && isExpanded ? (
                                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                        {lines.filter((l) => parseFloat(l.weightKg) > 0).map((l) => (
                                          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <span style={{ fontSize: 10.5, fontWeight: 700, background: "#d1fae5", color: "#065f46", borderRadius: 3, padding: "1px 5px" }}>{l.type}</span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: "#1cb97a" }}>{parseFloat(l.weightKg).toFixed(2)} kg</span>
                                          </div>
                                        ))}
                                        {lines.filter((l) => parseFloat(l.weightKg) > 0).length === 0 && (
                                          <span style={{ fontSize: 11, color: "#aab0bb" }}>Editing…</span>
                                        )}
                                      </div>
                                    ) : (
                                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        <span style={{ fontWeight: 700, fontSize: 12.5 }}>{a.material}</span>
                                        <span style={{ fontSize: 11, color: "#8a9099", fontWeight: 600 }}>{a.weight}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="rm-td">
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#8a9099" }}>
                                      <MapPin size={10} color="#aab0bb" />{a.location}
                                    </div>
                                  </td>
                                  <td className="rm-td">
                                    {a.status !== "pending" && a.partner ? (
                                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: "#1a1e25" }}>
                                        <Building2 size={12} color="#aab0bb" />{a.partner}
                                      </span>
                                    ) : isExpanded ? (
                                      <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>Set in editor ↓</span>
                                    ) : (
                                      <span style={{ fontSize: 11, color: "#aab0bb" }}>—</span>
                                    )}
                                  </td>
                                  <td className="rm-td" style={{ fontWeight: 700, color: compensationDisplay ? "var(--green,#1cb97a)" : "#aab0bb" }}>
                                    {compensationDisplay ?? "—"}
                                  </td>
                                  <td className="rm-td">
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                      {!isCompensated && (a.status === "assigned" || a.status === "recyclated") && (
                                        <button className="rm-action-btn-violet"
                                          onClick={(e) => { e.stopPropagation(); handleCompensate(a.id); }}>
                                          <DollarSign size={11} /> Compensate
                                        </button>
                                      )}
                                      {isCompensated && (
                                        <>
                                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--violet,#7c6be8)", display: "flex", alignItems: "center", gap: 4 }}>
                                            <CheckCircle2 size={13} /> Compensated
                                          </span>
                                          <span className="rm-locked-chip" title="Locked after compensation">
                                            <Lock size={9} /> Locked
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {canExpand && isExpanded && (
                                  <MaterialEditor
                                    key={`editor-${a.id}`}
                                    assignment={a}
                                    lines={lines.length > 0 ? lines : [newLine()]}
                                    onLinesChange={(updated) => setMaterialLines((prev) => ({ ...prev, [a.id]: updated }))}
                                    partner={selPartner}
                                    onPartnerChange={(p) => setSelectedPartners((prev) => ({ ...prev, [a.id]: p }))}
                                    partnerNames={partnerNames}
                                    onAssign={() => handleAssign(a.id)}
                                    onClose={() => setExpandedId(null)}
                                  />
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Compensation tab ── */}
              {activeTab === "compensation" && (
                <CompensationTab
                  assignments={activeAssignments}
                  partners={partners}
                  compensationMap={compensationMap}
                />
              )}
            </div>
          </div>
        </>
      )}

      {loading && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 24, textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #e4e7eb", borderTop: "3px solid #1cb97a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1e25" }}>Processing...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}
    </div>
  );
}