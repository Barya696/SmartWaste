import {
  CompensationService,
  type CompensationData,
} from "./compensationService";

const API_BASE = "http://localhost:8080/api";

export type BadgeCriteriaType =
  | "REPORTS_SUBMITTED"
  | "REPORTS_COMPENSATED"
  | "ECO_POINTS"
  | "WEIGHT_RECYCLED_KG"
  | "DISTRICTS_HELPED"
  | "ACTIVE_STREAK_DAYS";

export interface BadgeDefinition {
  id?: number;
  badgeKey: string;
  name: string;
  icon: string;
  description: string;
  criteriaLabel: string;
  criteriaType: BadgeCriteriaType;
  criteriaThreshold: number;
  pointsReward: number;
  color: string;
  active: boolean;
  sortOrder: number;
}

export interface BadgeSettings {
  pointsPerCompensation: number;
  badges: BadgeDefinition[];
}

export interface CitizenBadgeStatus extends BadgeDefinition {
  earned: boolean;
  progress: number;
  progressValue: number;
  progressTarget: number;
}

export interface CitizenEcoRewards {
  totalEcoPoints: number;
  baseEcoPoints: number;
  bonusEcoPoints: number;
  pointsPerCompensation: number;
  reportsSubmitted: number;
  reportsCompensated: number;
  weightRecycledKg: number;
  districtsHelped: number;
  activeStreakDays: number;
  badges: CitizenBadgeStatus[];
  nextBadge: { name: string; remaining: number; criteriaLabel: string } | null;
}

const CRITERIA_LABELS: Record<BadgeCriteriaType, string> = {
  REPORTS_SUBMITTED: "reports submitted",
  REPORTS_COMPENSATED: "compensations",
  ECO_POINTS: "eco points",
  WEIGHT_RECYCLED_KG: "kg recycled",
  DISTRICTS_HELPED: "neighborhoods",
  ACTIVE_STREAK_DAYS: "day streak",
};

function dayKey(iso: string): string {
  return iso.split("T")[0];
}

function computeActiveStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDays = [...new Set(dates.map(dayKey))].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 1) {
      current += 1;
      best = Math.max(best, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }
  return best;
}

function metricValue(
  type: BadgeCriteriaType,
  stats: {
    reportsSubmitted: number;
    reportsCompensated: number;
    weightRecycledKg: number;
    districtsHelped: number;
    activeStreakDays: number;
    totalEcoPoints: number;
  },
): number {
  switch (type) {
    case "REPORTS_SUBMITTED":
      return stats.reportsSubmitted;
    case "REPORTS_COMPENSATED":
      return stats.reportsCompensated;
    case "WEIGHT_RECYCLED_KG":
      return stats.weightRecycledKg;
    case "DISTRICTS_HELPED":
      return stats.districtsHelped;
    case "ACTIVE_STREAK_DAYS":
      return stats.activeStreakDays;
    case "ECO_POINTS":
      return stats.totalEcoPoints;
    default:
      return 0;
  }
}

function evaluateBadges(
  settings: BadgeSettings,
  stats: {
    reportsSubmitted: number;
    reportsCompensated: number;
    weightRecycledKg: number;
    districtsHelped: number;
    activeStreakDays: number;
  },
): CitizenEcoRewards {
  const activeBadges = settings.badges
    .filter((b) => b.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const baseEcoPoints =
    stats.reportsCompensated * settings.pointsPerCompensation;

  const nonEcoBadges = activeBadges.filter((b) => b.criteriaType !== "ECO_POINTS");
  const earnedNonEco = nonEcoBadges.filter((badge) => {
    const value = metricValue(badge.criteriaType, {
      ...stats,
      totalEcoPoints: baseEcoPoints,
    });
    return value >= badge.criteriaThreshold;
  });

  const bonusEcoPoints = earnedNonEco.reduce(
    (sum, badge) => sum + (badge.pointsReward ?? 0),
    0,
  );
  const totalEcoPoints = baseEcoPoints + bonusEcoPoints;

  const fullStats = { ...stats, totalEcoPoints };

  const badges: CitizenBadgeStatus[] = activeBadges.map((badge) => {
    const value = metricValue(badge.criteriaType, fullStats);
    const earned = value >= badge.criteriaThreshold;
    const progressTarget = Math.max(badge.criteriaThreshold, 1);
    const progressValue = Math.min(value, progressTarget);
    const progress = Math.min(100, Math.round((progressValue / progressTarget) * 100));
    return {
      ...badge,
      earned,
      progress,
      progressValue,
      progressTarget,
    };
  });

  const nextLocked = badges
    .filter((b) => !b.earned)
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];

  const nextBadge = nextLocked
    ? {
        name: nextLocked.name,
        remaining: Math.max(
          0,
          nextLocked.criteriaThreshold -
            metricValue(nextLocked.criteriaType, fullStats),
        ),
        criteriaLabel:
          nextLocked.criteriaLabel ||
          `${nextLocked.criteriaThreshold} ${CRITERIA_LABELS[nextLocked.criteriaType]}`,
      }
    : null;

  return {
    totalEcoPoints,
    baseEcoPoints,
    bonusEcoPoints,
    pointsPerCompensation: settings.pointsPerCompensation,
    ...stats,
    badges,
    nextBadge,
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const DEFAULT_BADGES: BadgeDefinition[] = [
  {
    badgeKey: "first-reporter",
    name: "First Reporter",
    icon: "🎯",
    description: "Submitted your first report",
    criteriaLabel: "1 report",
    criteriaType: "REPORTS_SUBMITTED",
    criteriaThreshold: 1,
    pointsReward: 10,
    color: "#1cb97a",
    active: true,
    sortOrder: 1,
  },
  {
    badgeKey: "eco-warrior",
    name: "Eco Warrior",
    icon: "🌍",
    description: "Submit 10 waste reports",
    criteriaLabel: "10 reports",
    criteriaType: "REPORTS_SUBMITTED",
    criteriaThreshold: 10,
    pointsReward: 25,
    color: "#10b981",
    active: true,
    sortOrder: 2,
  },
];

export const EcoPointsService = {
  async getBadgeSettings(): Promise<BadgeSettings> {
    const data = await fetchJson<{
      pointsPerCompensation: number;
      badges: BadgeDefinition[];
    }>(`${API_BASE}/badge-config`);
    if (!data) {
      return { pointsPerCompensation: 50, badges: DEFAULT_BADGES };
    }
    return {
      pointsPerCompensation: data.pointsPerCompensation ?? 50,
      badges: (data.badges ?? []).map((b) => ({
        ...b,
        criteriaType: b.criteriaType as BadgeCriteriaType,
      })),
    };
  },

  async saveBadgeSettings(settings: BadgeSettings): Promise<void> {
    const res = await fetch(`${API_BASE}/badge-config`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? "Failed to save badge settings");
    }
  },

  async getCitizenRewards(citizenId: number): Promise<CitizenEcoRewards> {
    const [settings, reports, compensations] = await Promise.all([
      this.getBadgeSettings(),
      CompensationService.getCitizenReports(citizenId),
      CompensationService.getByCitizen(citizenId),
    ]);

    const reportsSubmitted = reports.length;
    const reportsCompensated = reports.filter(
      (r) => r.status === "compensated",
    ).length;
    const weightRecycledKg = compensations.reduce(
      (sum, c) => sum + (c.weightKg ?? 0),
      0,
    );
    const districtsHelped = new Set(
      reports.map((r) => r.district).filter(Boolean),
    ).size;
    const activeStreakDays = computeActiveStreak(reports.map((r) => r.date));

    return evaluateBadges(settings, {
      reportsSubmitted,
      reportsCompensated,
      weightRecycledKg,
      districtsHelped,
      activeStreakDays,
    });
  },

  pointsForCompensatedReport(
    rewards: CitizenEcoRewards,
    reportCompensated: boolean,
  ): number {
    return reportCompensated ? rewards.pointsPerCompensation : 0;
  },
};

export type { CompensationData };
