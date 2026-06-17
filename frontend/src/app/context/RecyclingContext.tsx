import { createContext, useContext, useState, ReactNode } from 'react';

export type AssignmentStatus = "pending" | "assigned" | "completed" | "recyclated" | "compensated";

export interface RecyclableAssignment {
  id: string;
  numericId: number; // Numeric ID from database for API calls
  reportId: string;
  citizen: string;
  collector?: string;
  material: string;
  weight: string;
  location: string;
  partner: string | null;
  compensation: string | null;
  status: AssignmentStatus;
  date: string;
}

export const DEFAULT_PRICES: Record<string, number> = {
  Plastic: 300,
  Metal: 500,
  Glass: 200,
  Paper: 150,
  Cardboard: 150,
  Electronics: 800,
  Batteries: 600,
  Organic: 100,
  Textile: 200,
};

export const DEFAULT_TAXES = { vatPct: 18, envLevyPct: 2 };
export const DEFAULT_SHARES = { citizenPct: 60, collectorPct: 25, systemPct: 15 };

export function calcCollectorShare(
  assignment: RecyclableAssignment,
  prices = DEFAULT_PRICES,
  taxes = DEFAULT_TAXES,
  shares = DEFAULT_SHARES,
): number {
  const weightKg = parseFloat(assignment.weight.replace(/[^0-9.]/g, "")) || 0;
  const matKey = Object.keys(prices).find((k) =>
    assignment.material.toLowerCase().includes(k.toLowerCase()),
  ) ?? Object.keys(prices)[0];
  const pricePerKg = prices[matKey] ?? 300;
  const gross = weightKg * pricePerKg;
  const net = gross - gross * (taxes.vatPct / 100) - gross * (taxes.envLevyPct / 100);
  return Math.round(net * (shares.collectorPct / 100));
}

const INITIAL_ASSIGNMENTS: RecyclableAssignment[] = [
  {
    id: "RA-001",
    numericId: 1,
    reportId: "SW-2026-0025",
    citizen: "Paul Nkounkou",
    collector: "Pierre Ngouabi",
    material: "Metal Cans",
    weight: "3.8kg",
    location: "Poto-Poto, Avenue de la Paix",
    partner: null,
    compensation: null,
    status: "pending",
    date: "2026-06-03",
  },
  {
    id: "RA-002",
    numericId: 2,
    reportId: "SW-2026-0026",
    citizen: "Sophie Ondongo",
    collector: "Thomas Bakala",
    material: "Plastic Bottles",
    weight: "6.2kg",
    location: "Bacongo, Rue Foch",
    partner: null,
    compensation: null,
    status: "pending",
    date: "2026-06-03",
  },
  {
    id: "RA-003",
    numericId: 3,
    reportId: "SW-2026-0024",
    citizen: "Marie Kouka",
    collector: "Pierre Ngouabi",
    material: "Cardboard",
    weight: "8.5kg",
    location: "Moungali, Rue Mbochi",
    partner: "Green Partners SA",
    compensation: "2,550 XAF",
    status: "assigned",
    date: "2026-06-02",
  },
  {
    id: "RA-004",
    numericId: 4,
    reportId: "SW-2026-0023",
    citizen: "Jean Mbemba",
    collector: "Pierre Ngouabi",
    material: "Plastic Bottles",
    weight: "5.2kg",
    location: "Poto-Poto",
    partner: "EcoRecycle Congo",
    compensation: "2,600 XAF",
    status: "compensated",
    date: "2026-06-01",
  },
  {
    id: "RA-005",
    numericId: 5,
    reportId: "SW-2026-0020",
    citizen: "Celine Mouamba",
    collector: "Pierre Ngouabi",
    material: "Glass Bottles",
    weight: "4.0kg",
    location: "Talangaï, Avenue Moungali",
    partner: "EcoRecycle Congo",
    compensation: "1,312 XAF",
    status: "compensated",
    date: "2026-05-29",
  },
];

interface RecyclingContextType {
  assignments: RecyclableAssignment[];
  compensate: (id: string) => void;
  assign: (id: string, partner: string) => void;
}

const RecyclingContext = createContext<RecyclingContextType | undefined>(undefined);

export function RecyclingProvider({ children }: { children: ReactNode }) {
  const [assignments, setAssignments] = useState<RecyclableAssignment[]>(INITIAL_ASSIGNMENTS);

  function compensate(id: string) {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "compensated" } : a)),
    );
  }

  function assign(id: string, partner: string) {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "assigned", partner, compensation: "2,500 XAF" } : a,
      ),
    );
  }

  return (
    <RecyclingContext.Provider value={{ assignments, compensate, assign }}>
      {children}
    </RecyclingContext.Provider>
  );
}

export function useRecycling() {
  const ctx = useContext(RecyclingContext);
  if (!ctx) throw new Error('useRecycling must be used within RecyclingProvider');
  return ctx;
}
