const API_BASE = "http://localhost:8080/api/receipts";

export interface DownloadedReceipt {
  id: number;
  receiptNo: string;
  partnerId: number;
  partnerName: string;
  supervisorId?: number | null;
  entriesCount: number;
  totalKg: number;
  grossAmount: number;
  netAmount: number;
  filterMonth?: number | null;
  filterYear?: number | null;
  issuedAt: string;
  createdAt?: string;
}

export interface CreateReceiptRequest {
  receiptNo: string;
  partnerId: number;
  partnerName: string;
  entriesCount: number;
  totalKg: number;
  grossAmount: number;
  netAmount: number;
  filterMonth?: number | null;
  filterYear?: number | null;
}

function normalizeReceipt(raw: Record<string, unknown>): DownloadedReceipt {
  const num = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  let issuedAt = raw.issuedAt ?? raw.issued_at ?? raw.createdAt ?? raw.created_at;
  if (Array.isArray(issuedAt)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = issuedAt as number[];
    issuedAt = new Date(year, month - 1, day, hour, minute, second).toISOString();
  } else if (issuedAt != null) {
    issuedAt = String(issuedAt);
  } else {
    issuedAt = new Date().toISOString();
  }

  return {
    id: num(raw.id),
    receiptNo: String(raw.receiptNo ?? raw.receipt_no ?? ""),
    partnerId: num(raw.partnerId ?? raw.partner_id),
    partnerName: String(raw.partnerName ?? raw.partner_name ?? "—"),
    supervisorId: raw.supervisorId != null || raw.supervisor_id != null
      ? num(raw.supervisorId ?? raw.supervisor_id)
      : null,
    entriesCount: num(raw.entriesCount ?? raw.entries_count),
    totalKg: num(raw.totalKg ?? raw.total_kg),
    grossAmount: num(raw.grossAmount ?? raw.gross_amount),
    netAmount: num(raw.netAmount ?? raw.net_amount),
    filterMonth: raw.filterMonth != null || raw.filter_month != null
      ? num(raw.filterMonth ?? raw.filter_month)
      : null,
    filterYear: raw.filterYear != null || raw.filter_year != null
      ? num(raw.filterYear ?? raw.filter_year)
      : null,
    issuedAt: issuedAt as string,
    createdAt: raw.createdAt != null || raw.created_at != null
      ? String(raw.createdAt ?? raw.created_at)
      : undefined,
  };
}

export const ReceiptService = {
  getAllReceipts: async (): Promise<DownloadedReceipt[]> => {
    const response = await fetch(API_BASE, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch receipts: ${response.status}`);
    }
    const data: Record<string, unknown>[] = await response.json();
    return data.map(normalizeReceipt);
  },

  getReceiptsByPartner: async (partnerId: number): Promise<DownloadedReceipt[]> => {
    const response = await fetch(`${API_BASE}/partner/${partnerId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch partner receipts: ${response.status}`);
    }
    const data: Record<string, unknown>[] = await response.json();
    return data.map(normalizeReceipt);
  },

  createReceipt: async (payload: CreateReceiptRequest): Promise<DownloadedReceipt> => {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        typeof body?.message === "string"
          ? body.message
          : `Failed to save receipt: ${response.status}`;
      throw new Error(message);
    }
    const data: Record<string, unknown> = await response.json();
    return normalizeReceipt(data);
  },
};
