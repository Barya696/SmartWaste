/**
 * AssignCollector Service
 * API client for fetching waste collector assignments from the backend
 */

export type AssignmentStatus = "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "PENDING_CITIZEN_APPROVAL" | "RECYCLED";

export interface AssignCollectorData {
  id: number;
  reportId: number;
  collectorId: number;
  supervisorId: number;
  assignmentStatus: AssignmentStatus;
  assignmentDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = 'http://localhost:8080/api/assignments';

export const AssignCollectorService = {
  /**
   * Get all completed assignments
   */
  getCompletedAssignments: async (): Promise<AssignCollectorData[]> => {
    try {
      console.log('[AssignCollectorService.getCompletedAssignments] Fetching completed assignments');
      const response = await fetch(`${BASE_URL}/status/COMPLETED`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch completed assignments: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AssignCollectorService.getCompletedAssignments] Success:', data);
      return data;
    } catch (error) {
      console.error('[AssignCollectorService.getCompletedAssignments] Error:', error);
      throw error;
    }
  },

  /**
   * Get assignments by status
   */
  getAssignmentsByStatus: async (status: AssignmentStatus): Promise<AssignCollectorData[]> => {
    try {
      console.log('[AssignCollectorService.getAssignmentsByStatus] Fetching assignments with status:', status);
      const response = await fetch(`${BASE_URL}/status/${status}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AssignCollectorService.getAssignmentsByStatus] Success:', data);
      return data;
    } catch (error) {
      console.error('[AssignCollectorService.getAssignmentsByStatus] Error:', error);
      throw error;
    }
  },

  /**
   * Get all assignments for a collector
   */
  getAssignmentsByCollector: async (collectorId: number): Promise<AssignCollectorData[]> => {
    try {
      console.log('[AssignCollectorService.getAssignmentsByCollector] Fetching assignments for collector:', collectorId);
      const response = await fetch(`${BASE_URL}/collector/${collectorId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AssignCollectorService.getAssignmentsByCollector] Success:', data);
      return data;
    } catch (error) {
      console.error('[AssignCollectorService.getAssignmentsByCollector] Error:', error);
      throw error;
    }
  },

  /**
   * Get all assignments for a supervisor
   */
  getAssignmentsBySupervisor: async (supervisorId: number): Promise<AssignCollectorData[]> => {
    try {
      console.log('[AssignCollectorService.getAssignmentsBySupervisor] Fetching assignments for supervisor:', supervisorId);
      const response = await fetch(`${BASE_URL}/supervisor/${supervisorId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AssignCollectorService.getAssignmentsBySupervisor] Success:', data);
      return data;
    } catch (error) {
      console.error('[AssignCollectorService.getAssignmentsBySupervisor] Error:', error);
      throw error;
    }
  },

  /**
   * Get single assignment by ID
   */
  getAssignmentById: async (id: number): Promise<AssignCollectorData> => {
    try {
      console.log('[AssignCollectorService.getAssignmentById] Fetching assignment:', id);
      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignment: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AssignCollectorService.getAssignmentById] Success:', data);
      return data;
    } catch (error) {
      console.error('[AssignCollectorService.getAssignmentById] Error:', error);
      throw error;
    }
  },

  /**
   * Get all assignments
   */
  getAllAssignments: async (): Promise<AssignCollectorData[]> => {
    try {
      console.log('[AssignCollectorService.getAllAssignments] Fetching all assignments');
      const response = await fetch(`${BASE_URL}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AssignCollectorService.getAllAssignments] Success:', data);
      return data;
    } catch (error) {
      console.error('[AssignCollectorService.getAllAssignments] Error:', error);
      throw error;
    }
  },
};
