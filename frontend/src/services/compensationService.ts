import { AssignCollectorService, type AssignCollectorData } from "./assignCollectorService";
import { WasteService, type WasteReport } from "./wasteService";
import { UserService } from "./userService";
import { getDisplayName } from "./adminService";

const API_BASE = "http://localhost:8080/api";

export type CitizenReportStatus =
  | "pending"
  | "in_progress"
  | "collected"
  | "recycled"
  | "compensated"
  | "empty";

export const RESUBMIT_HOURS_THRESHOLD = 48;

export interface EnrichedCitizenReport {
  id: string;
  backendId: number;
  type: string;
  location: string;
  district: string;
  status: CitizenReportStatus;
  date: string;
  createdAt: string;
  lastResubmittedAt?: string;
  assignmentDate?: string;
  quantity: string;
  photoUrl?: string;
  collectedDate?: string;
  recycledDate?: string;
  compensatedDate?: string;
  assignedCollector?: string;
  pendingApproval?: boolean;
  assignmentId?: number;
  backendStatus?: string;
  citizenAmount?: number;
  citizenPct?: number;
  ecoPointsAwarded?: boolean;
  canResubmit?: boolean;
  resubmitHoursRemaining?: number;
}

export interface CompensationData {
  id: number;
  assignmentId: number;
  assignPartnerId?: number | null;
  citizenId: number;
  collectorId: number;
  supervisorId?: number | null;
  partnerId?: number | null;
  materialType: string;
  weightKg: number;
  materialBreakdown?: string;
  pricePerKg?: number;
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
  compensatedAt?: string;
  createdAt?: string;
}

export interface CollectorCreditRow {
  id: string;
  reportId: string;
  material: string;
  weight: string;
  location: string;
  partner: string | null;
  status: "compensated" | "assigned" | "pending";
  collectorCredit: number | null;
  collectorPct: number | null;
  date: string;
}

export interface CitizenCreditRow {
  id: string;
  reportId: string;
  material: string;
  weight: string;
  location: string;
  partner: string | null;
  status: "compensated" | "assigned" | "pending";
  citizenCredit: number | null;
  citizenPct: number | null;
  date: string;
}

interface AssignPartnerRow {
  id: number;
  assignmentId: number;
  partnerId: number;
  materialType?: string;
  weightKg?: string;
}

interface PartnerRow {
  id: number;
  name: string;
}

interface AssignmentWithReport {
  id: number;
  reportId: number;
  assignmentStatus: string;
  assignmentDate: string;
  wasteReport?: {
    id: number;
    trackingNumber?: string;
    category?: string;
    location?: string;
    quantity?: string;
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatWeight(weightKg: number | string | undefined | null): string {
  if (weightKg == null || weightKg === "") return "—";
  const n = typeof weightKg === "number" ? weightKg : parseFloat(String(weightKg));
  if (Number.isNaN(n)) return String(weightKg);
  return `${n.toFixed(2)} kg`;
}

function resolveReportId(
  report: WasteReport | AssignmentWithReport["wasteReport"] | undefined,
  fallbackReportId: number,
): string {
  if (report?.trackingNumber) return report.trackingNumber;
  return `REP-${report?.id ?? fallbackReportId}`;
}

function formatDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.split("T")[0];
  return d.toISOString().split("T")[0];
}

function resolveCitizenReportStatus(
  report: WasteReport,
  assignment: AssignCollectorData | undefined,
  compensation: CompensationData | undefined,
): CitizenReportStatus {
  if (compensation) return "compensated";
  if (assignment?.assignmentStatus === "EMPTY") return "empty";
  if (assignment?.assignmentStatus === "RECYCLED") return "recycled";
  if (assignment?.assignmentStatus === "COMPLETED") return "collected";
  if (assignment?.assignmentStatus === "PENDING_CITIZEN_APPROVAL") {
    return "in_progress";
  }
  if (
    assignment?.assignmentStatus === "IN_PROGRESS" ||
    assignment?.assignmentStatus === "ACCEPTED" ||
    report.status === "in_progress" ||
    report.status === "in_approval"
  ) {
    return "in_progress";
  }
  return "pending";
}

function pickLatestAssignment(
  assignments: AssignCollectorData[],
): AssignCollectorData | undefined {
  if (assignments.length === 0) return undefined;
  return [...assignments].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )[0];
}

function findActiveAssignment(
  assignments: AssignCollectorData[],
): AssignCollectorData | undefined {
  const active = assignments.filter((a) => a.assignmentStatus !== "REJECTED");
  return pickLatestAssignment(active);
}

function hoursBetween(startIso: string | undefined, end = Date.now()): number {
  if (!startIso) return RESUBMIT_HOURS_THRESHOLD;
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return RESUBMIT_HOURS_THRESHOLD;
  return Math.max(0, (end - start) / (1000 * 60 * 60));
}

export function getResubmitEligibility(
  report: Pick<
    EnrichedCitizenReport,
    | "status"
    | "createdAt"
    | "lastResubmittedAt"
    | "assignmentDate"
    | "pendingApproval"
  >,
): { canResubmit: boolean; resubmitHoursRemaining: number } {
  if (
    report.pendingApproval ||
    report.status === "collected" ||
    report.status === "recycled" ||
    report.status === "compensated" ||
    report.status === "empty"
  ) {
    return { canResubmit: false, resubmitHoursRemaining: 0 };
  }

  if (report.status === "in_progress" && report.assignmentDate) {
    const elapsed = hoursBetween(report.assignmentDate);
    if (elapsed >= RESUBMIT_HOURS_THRESHOLD) {
      return { canResubmit: true, resubmitHoursRemaining: 0 };
    }
    return {
      canResubmit: false,
      resubmitHoursRemaining: Math.ceil(RESUBMIT_HOURS_THRESHOLD - elapsed),
    };
  }

  if (report.status === "pending") {
    const anchor = report.lastResubmittedAt ?? report.createdAt;
    const elapsed = hoursBetween(anchor);
    if (elapsed >= RESUBMIT_HOURS_THRESHOLD) {
      return { canResubmit: true, resubmitHoursRemaining: 0 };
    }
    return {
      canResubmit: false,
      resubmitHoursRemaining: Math.ceil(RESUBMIT_HOURS_THRESHOLD - elapsed),
    };
  }

  return { canResubmit: false, resubmitHoursRemaining: 0 };
}

async function fetchAssignmentsForReport(
  reportId: number,
): Promise<AssignCollectorData[]> {
  const data = await fetchJson<AssignCollectorData[]>(
    `${API_BASE}/assignments/report/${reportId}`,
  );
  return data ?? [];
}

async function loadUserName(userId: number | undefined): Promise<string | undefined> {
  if (userId == null) return undefined;
  try {
    const user = await UserService.getUserById(userId);
    return getDisplayName(user);
  } catch {
    return `User ${userId}`;
  }
}

export const CompensationService = {
  async getByCitizen(citizenId: number): Promise<CompensationData[]> {
    const data = await fetchJson<CompensationData[]>(
      `${API_BASE}/compensations/citizen/${citizenId}`,
    );
    return data ?? [];
  },

  async getCitizenReports(citizenId: number): Promise<EnrichedCitizenReport[]> {
    const reportsRes = await fetch(
      `${API_BASE}/reports/user/${citizenId}`,
      { credentials: "include" },
    );
    if (!reportsRes.ok) return [];
    const reports: WasteReport[] = await reportsRes.json();

    const compensations = await this.getByCitizen(citizenId);
    const compByAssignmentId = new Map(
      compensations.map((c) => [c.assignmentId, c]),
    );

    const collectorCache = new Map<number, string>();

    const enriched = await Promise.all(
      reports.map(async (report) => {
        const assignments = await fetchAssignmentsForReport(report.id);
        const activeAssignment = findActiveAssignment(assignments);
        const assignment =
          activeAssignment ?? pickLatestAssignment(assignments);
        const compensation = assignment
          ? compByAssignmentId.get(assignment.id)
          : undefined;

        const status = resolveCitizenReportStatus(
          report,
          activeAssignment,
          compensation,
        );

        let assignedCollector: string | undefined;
        if (activeAssignment?.collectorId != null) {
          if (!collectorCache.has(activeAssignment.collectorId)) {
            collectorCache.set(
              activeAssignment.collectorId,
              (await loadUserName(activeAssignment.collectorId)) ?? "",
            );
          }
          assignedCollector = collectorCache.get(activeAssignment.collectorId);
        }

        const createdAt = report.createdAt;
        const lastResubmittedAt = report.lastResubmittedAt ?? undefined;
        const assignmentDate =
          activeAssignment?.assignmentDate ?? activeAssignment?.createdAt;

        const baseReport = {
          id: report.trackingNumber,
          backendId: report.id,
          type: report.category,
          location: report.location,
          district: report.district,
          status,
          date: formatDate(report.createdAt) ?? "",
          createdAt,
          lastResubmittedAt,
          assignmentDate,
          quantity:
            report.quantity.charAt(0).toUpperCase() +
            report.quantity.slice(1),
          photoUrl: report.photoUrl || undefined,
          backendStatus: report.status,
          pendingApproval:
            activeAssignment?.assignmentStatus === "PENDING_CITIZEN_APPROVAL",
          assignmentId: activeAssignment?.id,
          assignedCollector,
          collectedDate:
            status === "collected" ||
            status === "recycled" ||
            status === "compensated" ||
            status === "empty"
              ? formatDate(activeAssignment?.updatedAt ?? assignment?.updatedAt)
              : undefined,
          recycledDate:
            status === "recycled" || status === "compensated"
              ? formatDate(activeAssignment?.updatedAt ?? assignment?.updatedAt)
              : undefined,
          compensatedDate: formatDate(
            compensation?.compensatedAt ?? compensation?.createdAt,
          ),
          citizenAmount: compensation?.citizenAmount,
          citizenPct: compensation?.citizenPct,
          ecoPointsAwarded: status === "compensated",
        } satisfies Omit<EnrichedCitizenReport, "canResubmit" | "resubmitHoursRemaining">;

        const eligibility = getResubmitEligibility(baseReport);

        return {
          ...baseReport,
          ...eligibility,
        } satisfies EnrichedCitizenReport;
      }),
    );

    return enriched.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },

  async getByCollector(collectorId: number): Promise<CompensationData[]> {
    const data = await fetchJson<CompensationData[]>(
      `${API_BASE}/compensations/collector/${collectorId}`,
    );
    return data ?? [];
  },

  async getCollectorCredits(collectorId: number): Promise<CollectorCreditRow[]> {
    const [compensations, assignmentsRaw, partners, reports] = await Promise.all([
      this.getByCollector(collectorId),
      AssignCollectorService.getAssignmentsByCollector(collectorId).catch(
        () => [] as AssignmentWithReport[],
      ),
      fetchJson<PartnerRow[]>(`${API_BASE}/partners`),
      WasteService.getAllWastes().catch(() => [] as WasteReport[]),
    ]);

    const assignments = assignmentsRaw as AssignmentWithReport[];
    const partnerMap = new Map((partners ?? []).map((p) => [p.id, p.name]));
    const reportMap = new Map(reports.map((r) => [r.id, r]));
    const assignmentMap = new Map(assignments.map((a) => [a.id, a]));
    const compensatedAssignmentIds = new Set(
      compensations.map((c) => c.assignmentId),
    );

    const rows: CollectorCreditRow[] = [];

    for (const comp of compensations) {
      const assignment = assignmentMap.get(comp.assignmentId);
      const report =
        assignment?.wasteReport ?? reportMap.get(assignment?.reportId ?? -1);

      let partnerName: string | null = null;
      if (comp.partnerId != null) {
        partnerName = partnerMap.get(comp.partnerId) ?? null;
      }
      if (!partnerName && comp.assignPartnerId != null) {
        const ap = await fetchJson<AssignPartnerRow>(
          `${API_BASE}/assign-partner/${comp.assignPartnerId}`,
        );
        if (ap?.partnerId) {
          partnerName = partnerMap.get(ap.partnerId) ?? null;
        }
      }

      rows.push({
        id: `comp-${comp.id}`,
        reportId: resolveReportId(report, assignment?.reportId ?? comp.assignmentId),
        material: comp.materialType || report?.category || "—",
        weight: formatWeight(comp.weightKg),
        location: report?.location ?? "—",
        partner: partnerName,
        status: "compensated",
        collectorCredit: comp.collectorAmount,
        collectorPct: comp.collectorPct,
        date: comp.compensatedAt ?? comp.createdAt ?? "",
      });
    }

    const pendingAssignments = assignments.filter(
      (a) =>
        a.assignmentStatus === "RECYCLED" &&
        !compensatedAssignmentIds.has(a.id),
    );

    await Promise.all(
      pendingAssignments.map(async (assignment) => {
        const report =
          assignment.wasteReport ?? reportMap.get(assignment.reportId);
        const ap = await fetchJson<AssignPartnerRow>(
          `${API_BASE}/assign-partner/assignment/${assignment.id}`,
        );

        let partnerName: string | null = null;
        if (ap?.partnerId) {
          partnerName = partnerMap.get(ap.partnerId) ?? null;
        }

        const material =
          ap?.materialType?.replace(/,/g, ", ") ||
          report?.category ||
          "—";
        const weight = ap?.weightKg
          ? ap.weightKg
              .split(",")
              .map((w) => formatWeight(w.trim()))
              .join(" + ")
          : formatWeight(report?.quantity);

        rows.push({
          id: `pending-${assignment.id}`,
          reportId: resolveReportId(report, assignment.reportId),
          material,
          weight,
          location: report?.location ?? "—",
          partner: partnerName,
          status: "assigned",
          collectorCredit: null,
          collectorPct: null,
          date: assignment.assignmentDate,
        });
      }),
    );

    rows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return rows;
  },

  async getCitizenCredits(citizenId: number): Promise<CitizenCreditRow[]> {
    const [compensations, assignmentsRaw, partners, reports] = await Promise.all([
      this.getByCitizen(citizenId),
      // We need to fetch all assignments for this citizen's reports
      (async () => {
        const userReports = await fetchJson<WasteReport[]>(
          `${API_BASE}/reports/user/${citizenId}`,
        );
        if (!userReports) return [] as AssignmentWithReport[];
        
        const allAssignments: AssignmentWithReport[] = [];
        for (const report of userReports) {
          const reportAssignments = await fetchJson<AssignCollectorData[]>(
            `${API_BASE}/assignments/report/${report.id}`,
          );
          if (reportAssignments) {
            for (const assignment of reportAssignments) {
              allAssignments.push({
                ...assignment,
                wasteReport: report,
              } as unknown as AssignmentWithReport);
            }
          }
        }
        return allAssignments;
      })(),
      fetchJson<PartnerRow[]>(`${API_BASE}/partners`),
      WasteService.getAllWastes().catch(() => [] as WasteReport[]),
    ]);

    const assignments = assignmentsRaw as AssignmentWithReport[];
    const partnerMap = new Map((partners ?? []).map((p) => [p.id, p.name]));
    const reportMap = new Map(reports.map((r) => [r.id, r]));
    const assignmentMap = new Map(assignments.map((a) => [a.id, a]));
    const compensatedAssignmentIds = new Set(
      compensations.map((c) => c.assignmentId),
    );

    const rows: CitizenCreditRow[] = [];

    for (const comp of compensations) {
      const assignment = assignmentMap.get(comp.assignmentId);
      const report =
        assignment?.wasteReport ?? reportMap.get(assignment?.reportId ?? -1);

      let partnerName: string | null = null;
      if (comp.partnerId != null) {
        partnerName = partnerMap.get(comp.partnerId) ?? null;
      }
      if (!partnerName && comp.assignPartnerId != null) {
        const ap = await fetchJson<AssignPartnerRow>(
          `${API_BASE}/assign-partner/${comp.assignPartnerId}`,
        );
        if (ap?.partnerId) {
          partnerName = partnerMap.get(ap.partnerId) ?? null;
        }
      }

      rows.push({
        id: `comp-${comp.id}`,
        reportId: resolveReportId(report, assignment?.reportId ?? comp.assignmentId),
        material: comp.materialType || report?.category || "—",
        weight: formatWeight(comp.weightKg),
        location: report?.location ?? "—",
        partner: partnerName,
        status: "compensated",
        citizenCredit: comp.citizenAmount,
        citizenPct: comp.citizenPct,
        date: comp.compensatedAt ?? comp.createdAt ?? "",
      });
    }

    const pendingAssignments = assignments.filter(
      (a) =>
        a.assignmentStatus === "RECYCLED" &&
        !compensatedAssignmentIds.has(a.id),
    );

    await Promise.all(
      pendingAssignments.map(async (assignment) => {
        const report =
          assignment.wasteReport ?? reportMap.get(assignment.reportId);
        const ap = await fetchJson<AssignPartnerRow>(
          `${API_BASE}/assign-partner/assignment/${assignment.id}`,
        );

        let partnerName: string | null = null;
        if (ap?.partnerId) {
          partnerName = partnerMap.get(ap.partnerId) ?? null;
        }

        const material =
          ap?.materialType?.replace(/,/g, ", ") ||
          report?.category ||
          "—";
        const weight = ap?.weightKg
          ? ap.weightKg
              .split(",")
              .map((w) => formatWeight(w.trim()))
              .join(" + ")
          : formatWeight(report?.quantity);

        rows.push({
          id: `pending-${assignment.id}`,
          reportId: resolveReportId(report, assignment.reportId),
          material,
          weight,
          location: report?.location ?? "—",
          partner: partnerName,
          status: "assigned",
          citizenCredit: null,
          citizenPct: null,
          date: assignment.assignmentDate,
        });
      }),
    );

    rows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return rows;
  },
};
