/**
 * Waste Service
 * API client for fetching waste reports from the backend
 */

export interface WasteReport {
  id: number;
  userId: number;
  category: string;
  district: string;
  location: string;
  description: string;
  quantity: string; // "small", "medium", "large"
  photoUrl: string | null;
  trackingNumber: string;
  status: string; // "pending", "in_progress", "completed", "rejected"
  createdAt: string;
  updatedAt: string;
  lastResubmittedAt?: string | null;
}

const BASE_URL = 'http://localhost:8080/api/reports';

export interface CreateWasteReportRequest {
  userId: number;
  category: string;
  district: string;
  location: string;
  description: string;
  quantity: string;
  photoUrl: string | null;
}

export interface UpdateWasteReportRequest {
  category: string;
  district: string;
  location: string;
  description: string;
  quantity: string;
  photoUrl: string | null;
}

export const WasteService = {
  /**
   * Create a new waste report
   */
  createReport: async (data: CreateWasteReportRequest): Promise<WasteReport> => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
        }
      } catch {
        // use status-based message
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },

  /**
   * Get all waste reports by district
   */
  getWastesByDistrict: async (district: string): Promise<WasteReport[]> => {
    try {
      console.log('[WasteService.getWastesByDistrict] Fetching wastes for district:', district);
      const response = await fetch(`${BASE_URL}/district/${district}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wastes: ${response.status}`);
      }

      const data = await response.json();
      console.log('[WasteService.getWastesByDistrict] Success:', data);
      return data;
    } catch (error) {
      console.error('[WasteService.getWastesByDistrict] Error:', error);
      throw error;
    }
  },

  /**
   * Get all waste reports by status
   */
  getWastesByStatus: async (status: string): Promise<WasteReport[]> => {
    try {
      console.log('[WasteService.getWastesByStatus] Fetching wastes with status:', status);
      const response = await fetch(`${BASE_URL}/status/${status}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wastes: ${response.status}`);
      }

      const data = await response.json();
      console.log('[WasteService.getWastesByStatus] Success:', data);
      return data;
    } catch (error) {
      console.error('[WasteService.getWastesByStatus] Error:', error);
      throw error;
    }
  },

  /**
   * Get waste report by ID
   */
  getWasteById: async (id: number): Promise<WasteReport> => {
    try {
      console.log('[WasteService.getWasteById] Fetching waste:', id);
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch waste: ${response.status}`);
      }

      const data = await response.json();
      console.log('[WasteService.getWasteById] Success:', data);
      return data;
    } catch (error) {
      console.error('[WasteService.getWasteById] Error:', error);
      throw error;
    }
  },

  /**
   * Get waste report by tracking number
   */
  getWasteByTrackingNumber: async (trackingNumber: string): Promise<WasteReport> => {
    try {
      console.log('[WasteService.getWasteByTrackingNumber] Fetching waste:', trackingNumber);
      const response = await fetch(`${BASE_URL}/tracking/${trackingNumber}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch waste: ${response.status}`);
      }

      const data = await response.json();
      console.log('[WasteService.getWasteByTrackingNumber] Success:', data);
      return data;
    } catch (error) {
      console.error('[WasteService.getWasteByTrackingNumber] Error:', error);
      throw error;
    }
  },

  /**
   * Get all waste reports by user ID
   */
  getWastesByUserId: async (userId: number): Promise<WasteReport[]> => {
    try {
      console.log('[WasteService.getWastesByUserId] Fetching wastes for user:', userId);
      const response = await fetch(`${BASE_URL}/user/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wastes: ${response.status}`);
      }

      const data = await response.json();
      console.log('[WasteService.getWastesByUserId] Success:', data);
      return data;
    } catch (error) {
      console.error('[WasteService.getWastesByUserId] Error:', error);
      throw error;
    }
  },

  /**
   * Get ALL waste reports
   */
  getAllWastes: async (): Promise<WasteReport[]> => {
    try {
      console.log('[WasteService.getAllWastes] Fetching all waste reports');
      const response = await fetch(`${BASE_URL}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wastes: ${response.status}`);
      }

      const data = await response.json();
      console.log('[WasteService.getAllWastes] Success:', data.length, 'reports');
      return data;
    } catch (error) {
      console.error('[WasteService.getAllWastes] Error:', error);
      throw error;
    }
  },

  /**
   * Update waste report status
   */
  updateReportStatus: async (id: number, status: string): Promise<WasteReport> => {
    try {
      const response = await fetch(
        `${BASE_URL}/${id}/status?status=${encodeURIComponent(status)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to update report status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[WasteService.updateReportStatus] Error:', error);
      throw error;
    }
  },

  /**
   * Update a pending waste report
   */
  updateReport: async (
    id: number,
    data: UpdateWasteReportRequest,
  ): Promise<WasteReport> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        typeof body?.message === 'string'
          ? body.message
          : `Failed to update report: ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  },

  /**
   * Delete a pending waste report
   */
  deleteReport: async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        typeof body?.message === 'string'
          ? body.message
          : `Failed to delete report: ${response.status}`;
      throw new Error(message);
    }
  },

  /**
   * Resubmit a stale report to re-enter the assignment queue
   */
  resubmitReport: async (id: number): Promise<WasteReport> => {
    const response = await fetch(`${BASE_URL}/${id}/resubmit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        typeof body?.message === 'string'
          ? body.message
          : `Failed to resubmit report: ${response.status}`;
      throw new Error(message);
    }

    return response.json();
  },
};
