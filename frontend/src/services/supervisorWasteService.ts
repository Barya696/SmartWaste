import { WasteService, type WasteReport } from "./wasteService";
import {
  AssignCollectorService,
  type AssignCollectorData,
  type AssignmentStatus,
} from "./assignCollectorService";
import { UserService, type User } from "./userService";
import { getDisplayName } from "./adminService";

export type DashboardPriority = "critical" | "high" | "medium" | "low";
export type DashboardActivityStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed";

export interface DashboardStat {
  label: string;
  value: number;
  trend: string;
  color: "amber" | "green" | "blue" | "lime";
}

export interface RecentActivityRow {
  id: string;
  reportId: number;
  type: string;
  location: string;
  priority: DashboardPriority;
  assignedTo: string | null;
  status: DashboardActivityStatus;
  time: string;
}

export interface CollectorWorkload {
  id: number;
  name: string;
  active: number;
  completed: number;
  status: "available" | "busy";
}

export interface SupervisorDashboardData {
  stats: DashboardStat[];
  recentActivity: RecentActivityRow[];
  collectorLoad: CollectorWorkload[];
  criticalUnassigned: number;
  criticalMessage: string | null;
}

export interface CollectorRosterEntry {
  id: string;
  backendId: number;
  name: string;
  phone: string;
  district: string;
  todayTasks: number;
  completedTasks: number;
  totalCompleted: number;
  joined: string;
  email: string;
  nationalId: string;
  vehicle: string;
  notes: string;
}

const ACTIVE_STATUSES: AssignmentStatus[] = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "PENDING_CITIZEN_APPROVAL",
];

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-CG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function deriveCategoryPriority(category: string): DashboardPriority {
  const lower = category.toLowerCase();
  if (
    lower.includes("danger") ||
    lower.includes("hazard") ||
    lower.includes("medical")
  ) {
    return "critical";
  }
  if (
    lower.includes("electronic") ||
    lower.includes("construction") ||
    lower.includes("encombrant")
  ) {
    return "high";
  }
  if (lower.includes("organic") || lower.includes("market")) {
    return "medium";
  }
  return "medium";
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

function mapDashboardStatus(
  report: WasteReport,
  assignment?: AssignCollectorData,
): DashboardActivityStatus {
  if (assignment) {
    const s = assignment.assignmentStatus;
    if (s === "COMPLETED" || s === "RECYCLED") return "completed";
    if (s === "IN_PROGRESS" || s === "ACCEPTED") return "in_progress";
    if (s === "PENDING" || s === "PENDING_CITIZEN_APPROVAL") return "assigned";
  }
  if (report.status === "completed") return "completed";
  if (report.status === "in_progress") return "in_progress";
  return "pending";
}

function isUnassigned(report: WasteReport, assignment?: AssignCollectorData): boolean {
  if (!assignment) return report.status !== "completed";
  return (
    assignment.assignmentStatus === "REJECTED" && report.status !== "completed"
  );
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function computeCollectorStats(
  collectorId: number,
  assignments: AssignCollectorData[],
) {
  const mine = assignments.filter((a) => a.collectorId === collectorId);
  const todayTasks = mine.filter(
    (a) =>
      isToday(a.assignmentDate) &&
      ACTIVE_STATUSES.includes(a.assignmentStatus),
  ).length;
  const completedTasks = mine.filter(
    (a) => a.assignmentStatus === "COMPLETED" && isToday(a.updatedAt),
  ).length;
  const totalCompleted = mine.filter((a) =>
    ["COMPLETED", "RECYCLED"].includes(a.assignmentStatus),
  ).length;
  const active = mine.filter((a) =>
    ACTIVE_STATUSES.includes(a.assignmentStatus),
  ).length;

  return { todayTasks, completedTasks, totalCompleted, active };
}

export async function loadSupervisorDashboardData(): Promise<SupervisorDashboardData> {
  const [reports, assignments, users] = await Promise.all([
    WasteService.getAllWastes(),
    AssignCollectorService.getAllAssignments(),
    UserService.getAllUsers(),
  ]);

  const collectors = users.filter((u) => u.role === "COLLECTOR");
  const userMap = new Map<number, User>();
  for (const u of users) {
    if (u.id != null) userMap.set(u.id, u);
  }

  const assignmentMap = buildAssignmentMap(assignments);

  const pendingReports = reports.filter((r) =>
    isUnassigned(r, assignmentMap.get(r.id)),
  );
  const assignedToday = assignments.filter(
    (a) => isToday(a.createdAt) && a.assignmentStatus !== "REJECTED",
  );
  const recycled = assignments.filter(
    (a) => a.assignmentStatus === "RECYCLED",
  );
  const recycledToday = recycled.filter((a) => isToday(a.updatedAt));
  const completedToday = assignments.filter(
    (a) => a.assignmentStatus === "COMPLETED" && isToday(a.updatedAt),
  );

  const criticalPending = pendingReports.filter(
    (r) => deriveCategoryPriority(r.category) === "critical",
  );

  const stats: DashboardStat[] = [
    {
      label: "Pending Assignment",
      value: pendingReports.length,
      color: "amber",
      trend:
        criticalPending.length > 0
          ? `${criticalPending.length} critical`
          : "awaiting dispatch",
    },
    {
      label: "Assigned Today",
      value: assignedToday.length,
      color: "green",
      trend:
        assignedToday.length > 0
          ? `${assignedToday.length} assigned today`
          : "none yet today",
    },
    {
      label: "Recycled",
      value: recycled.length,
      color: "blue",
      trend:
        recycledToday.length > 0
          ? `${recycledToday.length} recycled today`
          : recycled.length > 0
            ? "sent to recycling partners"
            : "none yet",
    },
    {
      label: "Completed Today",
      value: completedToday.length,
      color: "lime",
      trend:
        completedToday.length > 0
          ? `${completedToday.length} finished today`
          : "No tasks completed today",
    },
  ];

  const recentActivity: RecentActivityRow[] = [...reports]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)
    .map((r) => {
      const assignment = assignmentMap.get(r.id);
      const collector = assignment
        ? userMap.get(assignment.collectorId)
        : undefined;
      return {
        id: r.trackingNumber,
        reportId: r.id,
        type: r.category,
        location: `${r.district}, ${r.location}`,
        priority: deriveCategoryPriority(r.category),
        assignedTo: collector ? getDisplayName(collector) : null,
        status: mapDashboardStatus(r, assignment),
        time: formatTime(r.createdAt),
      };
    });

  const collectorLoad: CollectorWorkload[] = collectors
    .filter((c) => c.id != null)
    .map((c) => {
      const { active, totalCompleted } = computeCollectorStats(
        c.id!,
        assignments,
      );
      return {
        id: c.id!,
        name: getDisplayName(c),
        active,
        completed: totalCompleted,
        status: (active >= 3 ? "busy" : "available") as "available" | "busy",
      };
    })
    .sort((a, b) => b.active - a.active)
    .slice(0, 5);

  const firstCritical = criticalPending[0];

  return {
    stats,
    recentActivity,
    collectorLoad,
    criticalUnassigned: criticalPending.length,
    criticalMessage: firstCritical
      ? `${firstCritical.category} near ${firstCritical.location} — requires immediate dispatch.`
      : null,
  };
}

export async function loadCollectorRoster(): Promise<CollectorRosterEntry[]> {
  const [users, assignments] = await Promise.all([
    UserService.getAllUsers(),
    AssignCollectorService.getAllAssignments(),
  ]);

  return users
    .filter((u) => u.role === "COLLECTOR" && u.id != null)
    .map((u) => {
      const stats = computeCollectorStats(u.id!, assignments);
      return {
        id: String(u.id),
        backendId: u.id!,
        name: getDisplayName(u),
        phone: u.phoneNumber ?? "",
        district: u.district ?? "",
        todayTasks: stats.todayTasks,
        completedTasks: stats.completedTasks,
        totalCompleted: stats.totalCompleted,
        joined: u.createdAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        email: u.email,
        nationalId: u.bankAccountNumber ?? "",
        vehicle: "",
        notes: "",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCollectorFromForm(data: {
  name: string;
  phone: string;
  district: string;
  email: string;
  nationalId: string;
}): Promise<User> {
  const { firstName, lastName } = splitName(data.name);
  const username =
    data.email.split("@")[0] ||
    data.name.toLowerCase().replace(/\s+/g, ".");

  return UserService.createUser({
    username,
    email: data.email,
    password: "ChangeMe123!",
    firstName,
    lastName,
    phoneNumber: data.phone,
    role: "COLLECTOR",
    department: "WASTE_COLLECTION_OPERATIONS",
    district: data.district,
    bankAccountNumber: data.nationalId || undefined,
  });
}

export async function updateCollectorFromForm(
  backendId: number,
  data: {
    name: string;
    phone: string;
    district: string;
    nationalId: string;
  },
): Promise<void> {
  const { firstName, lastName } = splitName(data.name);
  await UserService.updateUser(backendId, {
    firstName,
    lastName,
    phoneNumber: data.phone,
    role: "COLLECTOR",
    department: "WASTE_COLLECTION_OPERATIONS",
  });
  await UserService.updateProfile(backendId, {
    firstName,
    lastName,
    phoneNumber: data.phone,
    district: data.district,
    bankAccountNumber: data.nationalId || "PENDING",
  });
}

export async function deleteCollector(backendId: number): Promise<void> {
  await UserService.deleteUser(backendId);
}
