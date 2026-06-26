import { WasteService, type WasteReport } from "./wasteService";
import { UserService, type User } from "./userService";
import {
  AssignCollectorService,
  type AssignCollectorData,
} from "./assignCollectorService";
import compensationConfigService from "./compensationConfigService";

const API_BASE = "http://localhost:8080/api";

export const BRAZZAVILLE_DISTRICTS = [
  "Poto-Poto",
  "Moungali",
  "Bacongo",
  "Makélékélé",
  "Plateau des 15 Ans",
  "Ouenzé",
  "Mfilou",
  "Talangaï",
] as const;

export interface CompensationRecord {
  id: number;
  assignmentId: number;
  citizenId: number;
  collectorId: number;
  materialType: string;
  weightKg: number;
  citizenAmount: number;
  createdAt?: string;
  compensatedAt?: string;
}

export interface AdminReportRow {
  id: string;
  reportId: number;
  citizenName: string;
  district: string;
  wasteType: string;
  quantity: string;
  location: string;
  priority: string;
  status: string;
  assignedCollector: string | null;
  reportedDate: string;
}

export interface DistrictSummary {
  name: string;
  reportCount: number;
  completedCount: number;
  collectorsAssigned: number;
  supervisors: string[];
  completionRate: number;
}

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  compensatedReports: number;
  completedReports: number;
  rejectedReports: number;
  reportsToday: number;
  totalUsers: number;
  citizens: number;
  collectors: number;
  supervisors: number;
  admins: number;
  collectionRate: number;
  districtProgress: { name: string; pct: number }[];
  recentActivity: {
    action: string;
    actor: string;
    time: string;
    status: string;
  }[];
  trendData: { t: number; v: number }[];
}

export interface AnalyticsData {
  monthlyTrends: {
    month: string;
    reported: number;
    collected: number;
    recycled: number;
  }[];
  wasteByCategory: { name: string; value: number; color: string }[];
  districtPerformance: {
    district: string;
    collection: number;
    recycling: number;
    efficiency: number;
  }[];
  kpis: {
    label: string;
    value: string;
    pct: number;
    color: string;
  }[];
}

export interface SecurityEvent {
  id: number;
  eventType: string;
  message: string;
  email: string;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Plastic: "#3b82f6",
  Organic: "#1cb97a",
  Paper: "#f59e0b",
  Glass: "#8b5cf6",
  Metal: "#ef4444",
  Electronic: "#06b6d4",
  Electronics: "#06b6d4",
  Hazardous: "#dc2626",
  Other: "#9aa0ac",
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function displayStatus(status: string): string {
  return status.replace(/_/g, "-");
}

export function backendStatus(status: string): string {
  return status.replace(/-/g, "_");
}

/** Completed = assignment COMPLETED + RECYCLED + compensation table */
export const COMPLETED_LIFECYCLE_STATUSES = [
  "completed",
  "recycled",
  "compensated",
] as const;

export function isCompletedLifecycleStatus(status: string): boolean {
  return (COMPLETED_LIFECYCLE_STATUSES as readonly string[]).includes(status);
}

/** Report IDs that have a row in the compensation table */
export function buildCompensatedReportIds(
  compensations: CompensationRecord[],
  assignments: AssignCollectorData[],
): Set<number> {
  const assignmentToReport = new Map<number, number>();
  for (const a of assignments) {
    assignmentToReport.set(a.id, a.reportId);
  }
  const reportIds = new Set<number>();
  for (const c of compensations) {
    const reportId = assignmentToReport.get(c.assignmentId);
    if (reportId != null) reportIds.add(reportId);
  }
  return reportIds;
}

function resolveReportStatus(
  report: WasteReport,
  assignment: AssignCollectorData | undefined,
  compensatedReportIds: Set<number>,
): string {
  if (compensatedReportIds.has(report.id)) return "compensated";
  if (assignment?.assignmentStatus === "RECYCLED") return "recycled";
  if (assignment?.assignmentStatus === "COMPLETED") return "completed";
  return displayStatus(report.status);
}

export function resolveReportsLifecycle(
  reports: WasteReport[],
  assignments: AssignCollectorData[],
  compensations: CompensationRecord[],
) {
  const assignmentMap = buildAssignmentMap(assignments);
  const compensatedReportIds = buildCompensatedReportIds(
    compensations,
    assignments,
  );
  const statusByReportId = new Map<number, string>();
  for (const r of reports) {
    statusByReportId.set(
      r.id,
      resolveReportStatus(r, assignmentMap.get(r.id), compensatedReportIds),
    );
  }
  return { assignmentMap, compensatedReportIds, statusByReportId };
}

export function countCompletedLifecycleReports(
  reports: WasteReport[],
  assignments: AssignCollectorData[],
  compensations: CompensationRecord[],
): number {
  const { statusByReportId } = resolveReportsLifecycle(
    reports,
    assignments,
    compensations,
  );
  return reports.filter((r) =>
    isCompletedLifecycleStatus(statusByReportId.get(r.id) ?? ""),
  ).length;
}

export function derivePriority(quantity: string): string {
  const map: Record<string, string> = {
    small: "low",
    medium: "medium",
    large: "high",
  };
  return map[quantity?.toLowerCase()] ?? "medium";
}

export function formatQuantity(quantity: string): string {
  const labels: Record<string, string> = {
    small: "Small",
    medium: "Medium",
    large: "Large",
  };
  return labels[quantity?.toLowerCase()] ?? quantity;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function getDisplayName(user?: User): string {
  if (!user) return "Unknown";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.username;
}

function buildUserMap(users: User[]): Map<number, User> {
  const map = new Map<number, User>();
  for (const u of users) {
    if (u.id != null) map.set(u.id, u);
  }
  return map;
}

function buildAssignmentMap(
  assignments: AssignCollectorData[],
): Map<number, AssignCollectorData> {
  const map = new Map<number, AssignCollectorData>();
  for (const a of assignments) {
    const existing = map.get(a.reportId);
    if (!existing || new Date(a.createdAt) > new Date(existing.createdAt)) {
      map.set(a.reportId, a);
    }
  }
  return map;
}

export function mapReportsToRows(
  reports: WasteReport[],
  users: User[],
  assignments: AssignCollectorData[],
  compensations: CompensationRecord[] = [],
): AdminReportRow[] {
  const userMap = buildUserMap(users);
  const { assignmentMap, statusByReportId } = resolveReportsLifecycle(
    reports,
    assignments,
    compensations,
  );

  return [...reports]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((r) => {
      const citizen = userMap.get(r.userId);
      const assignment = assignmentMap.get(r.id);
      const collector = assignment
        ? userMap.get(assignment.collectorId)
        : undefined;

      return {
        id: r.trackingNumber,
        reportId: r.id,
        citizenName: getDisplayName(citizen),
        district: r.district,
        wasteType: r.category,
        quantity: formatQuantity(r.quantity),
        location: r.location,
        priority: derivePriority(r.quantity),
        status: statusByReportId.get(r.id) ?? displayStatus(r.status),
        assignedCollector: collector ? getDisplayName(collector) : null,
        reportedDate: formatDateTime(r.createdAt),
      };
    });
}

export function computeDistrictSummaries(
  reports: WasteReport[],
  users: User[],
  assignments: AssignCollectorData[] = [],
  compensations: CompensationRecord[] = [],
): DistrictSummary[] {
  const { statusByReportId } = resolveReportsLifecycle(
    reports,
    assignments,
    compensations,
  );
  const districtNames = new Set<string>(BRAZZAVILLE_DISTRICTS);
  for (const r of reports) districtNames.add(r.district);

  return Array.from(districtNames)
    .filter(Boolean)
    .sort()
    .map((name) => {
      const districtReports = reports.filter((r) => r.district === name);
      const completed = districtReports.filter((r) =>
        isCompletedLifecycleStatus(statusByReportId.get(r.id) ?? ""),
      ).length;
      const supervisors = users
        .filter(
          (u) =>
            u.role === "SUPERVISOR" &&
            (u.district === name || !u.district),
        )
        .map(getDisplayName);
      const collectorsAssigned = users.filter(
        (u) => u.role === "COLLECTOR" && u.district === name,
      ).length;

      return {
        name,
        reportCount: districtReports.length,
        completedCount: completed,
        collectorsAssigned,
        supervisors: [...new Set(supervisors)],
        completionRate:
          districtReports.length > 0
            ? Math.round((completed / districtReports.length) * 100)
            : 0,
      };
    });
}

export function computeDashboardStats(
  reports: WasteReport[],
  users: User[],
  assignments: AssignCollectorData[],
  compensations: CompensationRecord[] = [],
): DashboardStats {
  const { compensatedReportIds, statusByReportId } =
    resolveReportsLifecycle(reports, assignments, compensations);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pending = reports.filter((r) => {
    const status = statusByReportId.get(r.id) ?? displayStatus(r.status);
    return status === "pending" || status === "in-progress";
  }).length;
  const compensated = compensatedReportIds.size;
  const completed = countCompletedLifecycleReports(
    reports,
    assignments,
    compensations,
  );
  const rejected = reports.filter((r) => {
    const status = statusByReportId.get(r.id) ?? displayStatus(r.status);
    return status === "rejected";
  }).length;
  const reportsToday = reports.filter((r) => {
    const d = new Date(r.createdAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const citizens = users.filter((u) => u.role === "CITIZEN").length;
  const collectors = users.filter((u) => u.role === "COLLECTOR").length;
  const supervisors = users.filter((u) => u.role === "SUPERVISOR").length;
  const admins = users.filter((u) => u.role === "ADMIN").length;

  const collectionRate =
    reports.length > 0 ? Math.round((completed / reports.length) * 100) : 0;

  const districtProgress = computeDistrictSummaries(
    reports,
    users,
    assignments,
    compensations,
  )
    .filter((d) => d.reportCount > 0)
    .slice(0, 4)
    .map((d) => ({ name: d.name, pct: d.completionRate }));

  const userMap = buildUserMap(users);
  const compensationActivity = [...compensations]
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )
    .slice(0, 3)
    .map((c) => {
      const citizen = userMap.get(c.citizenId);
      return {
        action: "Compensation processed",
        actor: getDisplayName(citizen),
        time: formatRelativeTime(
          c.createdAt ?? c.compensatedAt ?? new Date().toISOString(),
        ),
        status: "recycled",
      };
    });

  const reportActivity = [...reports]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .filter((r) => {
      const status = statusByReportId.get(r.id) ?? displayStatus(r.status);
      return !isCompletedLifecycleStatus(status) && status !== "rejected";
    })
    .slice(0, 3)
    .map((r) => {
      const citizen = userMap.get(r.userId);
      const actionMap: Record<string, string> = {
        pending: "New waste reported",
        in_progress: "Collection in progress",
        completed: "Collection completed",
        rejected: "Report rejected",
      };
      return {
        action: actionMap[r.status] ?? "Report updated",
        actor: `${getDisplayName(citizen)} (${r.district})`,
        time: formatRelativeTime(r.updatedAt),
        status:
          r.status === "completed"
            ? "collected"
            : r.status === "rejected"
              ? "alert"
              : "pending",
      };
    });

  const recentActivity = [...compensationActivity, ...reportActivity].slice(
    0,
    5,
  );

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    d.setHours(0, 0, 0, 0);
    const count = reports.filter((r) => {
      const rd = new Date(r.createdAt);
      rd.setHours(0, 0, 0, 0);
      return rd.getTime() === d.getTime();
    }).length;
    return { t: i, v: count };
  });

  return {
    totalReports: reports.length,
    pendingReports: pending,
    compensatedReports: compensated,
    completedReports: completed,
    rejectedReports: rejected,
    reportsToday,
    totalUsers: users.length,
    citizens,
    collectors,
    supervisors,
    admins,
    collectionRate,
    districtProgress,
    recentActivity,
    trendData: last14,
  };
}

export function computeAnalyticsData(
  reports: WasteReport[],
  assignments: AssignCollectorData[],
  compensations: CompensationRecord[] = [],
): AnalyticsData {
  const { statusByReportId } = resolveReportsLifecycle(
    reports,
    assignments,
    compensations,
  );
  const now = new Date();
  const monthlyTrends = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthReports = reports.filter((r) => {
      const rd = new Date(r.createdAt);
      return rd.getMonth() === month && rd.getFullYear() === year;
    });
    const collected = monthReports.filter((r) =>
      isCompletedLifecycleStatus(statusByReportId.get(r.id) ?? ""),
    ).length;
    const recycled = compensations.filter((c) => {
      const raw = c.createdAt ?? c.compensatedAt ?? "";
      const d = new Date(raw);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;

    return {
      month: MONTH_NAMES[month],
      reported: monthReports.length,
      collected,
      recycled,
    };
  });

  const categoryCounts = new Map<string, number>();
  for (const r of reports) {
    const cat = r.category || "Other";
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }
  const wasteByCategory = Array.from(categoryCounts.entries())
    .map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] ?? CATEGORY_COLORS.Other,
    }))
    .sort((a, b) => b.value - a.value);

  const districtPerformance = computeDistrictSummaries(
    reports,
    [],
    assignments,
    compensations,
  ).map(
    (d) => ({
      district: d.name,
      collection: d.completionRate,
      recycling: Math.min(
        100,
        Math.round(d.completionRate * 0.85),
      ),
      efficiency: Math.round((d.completionRate + d.collectorsAssigned * 2) / 1.2),
    }),
  );

  const total = reports.length || 1;
  const completedCount = countCompletedLifecycleReports(
    reports,
    assignments,
    compensations,
  );
  const collectionRate = Math.round((completedCount / total) * 1000) / 10;

  return {
    monthlyTrends,
    wasteByCategory,
    districtPerformance: districtPerformance.slice(0, 6),
    kpis: [
      {
        label: "Collection Rate",
        value: `${collectionRate}%`,
        pct: collectionRate,
        color: "#1cb97a",
      },
      {
        label: "Completed",
        value: String(completedCount),
        pct: Math.min(100, Math.round((completedCount / total) * 100)),
        color: "#1cb97a",
      },
      {
        label: "Compensated",
        value: String(compensations.length),
        pct: Math.min(100, compensations.length),
        color: "#3b82f6",
      },
      {
        label: "Active Reports",
        value: String(total - completedCount),
        pct: Math.min(
          100,
          Math.round(((total - completedCount) / total) * 100),
        ),
        color: "#8b5cf6",
      },
      {
        label: "Total Reports",
        value: String(reports.length),
        pct: Math.min(100, reports.length),
        color: "#f97316",
      },
    ],
  };
}

export const AdminService = {
  async fetchCoreData() {
    const [reports, users, assignments, compensations] = await Promise.all([
      WasteService.getAllWastes(),
      UserService.getAllUsers(),
      AssignCollectorService.getAllAssignments(),
      this.getCompensations().catch(() => [] as CompensationRecord[]),
    ]);
    return { reports, users, assignments, compensations };
  },

  async getSecurityEvents(): Promise<SecurityEvent[]> {
    const response = await fetch(`${API_BASE}/audit/security-events`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch security events: ${response.status}`);
    }
    return response.json();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const { reports, users, assignments, compensations } =
      await this.fetchCoreData();
    return computeDashboardStats(
      reports,
      users,
      assignments,
      compensations,
    );
  },

  async getReportRows(): Promise<AdminReportRow[]> {
    const { reports, users, assignments, compensations } =
      await this.fetchCoreData();
    return mapReportsToRows(
      reports,
      users,
      assignments,
      compensations,
    );
  },

  async getDistrictSummaries(): Promise<DistrictSummary[]> {
    const { reports, users, assignments, compensations } =
      await this.fetchCoreData();
    return computeDistrictSummaries(
      reports,
      users,
      assignments,
      compensations,
    );
  },

  async getAnalyticsData(): Promise<AnalyticsData> {
    const { reports, assignments, compensations } =
      await this.fetchCoreData();
    return computeAnalyticsData(reports, assignments, compensations);
  },

  async getCompensations(): Promise<CompensationRecord[]> {
    const response = await fetch(`${API_BASE}/compensations`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch compensations: ${response.status}`);
    }
    return response.json();
  },

  getMaterialPrices: compensationConfigService.getMaterialPrices,
  saveMaterialPrices: compensationConfigService.saveMaterialPrices,
  deleteMaterialPrice: compensationConfigService.deleteMaterialPrice,
  getTaxConfig: compensationConfigService.getTaxConfig,
  saveTaxConfig: compensationConfigService.saveTaxConfig,
  getShareConfig: compensationConfigService.getShareConfig,
  saveShareConfig: compensationConfigService.saveShareConfig,

  // ── Waste Categories (new waste_category table) ──────────────────────────
  getWasteCategories: compensationConfigService.getWasteCategories,
  saveWasteCategories: compensationConfigService.saveWasteCategories,
  deleteWasteCategory: compensationConfigService.deleteWasteCategory,
};
