import { useState, useEffect, useRef } from "react";

export interface PendingApproval {
  assignmentId: number;
  reportId: number;
  wasteType: string;
  location: string;
  district: string;
  collectedBy: string;
  collectorId: number;
}

interface UsePendingApprovalReturn {
  pendingApprovals: PendingApproval[];
  approveCollection: (assignmentId: number) => Promise<boolean>;
  dismissApproval: (assignmentId: number) => void;
}

export function usePendingApproval(
  citizenUserId: number | null | undefined
): UsePendingApprovalReturn {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const dismissedIdsRef = useRef<Set<number>>(new Set());
  const seenIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!citizenUserId) return;

    const pollPendingApprovals = async () => {
      try {
        const reportsRes = await fetch(
          `http://localhost:8080/api/reports/user/${citizenUserId}`,
          { credentials: 'include' }
        );
        if (!reportsRes.ok) return;
        const reports = await reportsRes.json();
        if (!Array.isArray(reports)) return;

        const newItems: PendingApproval[] = [];

        for (const report of reports) {
          try {
            const assignRes = await fetch(
              `http://localhost:8080/api/assignments/report/${report.id}`,
              { credentials: 'include' }
            );
            if (!assignRes.ok) continue;

            const raw = await assignRes.json();

            // Normalise: backend may return a single object or an array
            const assignments: any[] = Array.isArray(raw) ? raw : [raw];

            for (const assignment of assignments) {
              if (
                assignment.assignmentStatus === "PENDING_CITIZEN_APPROVAL" &&
                !dismissedIdsRef.current.has(assignment.id)
              ) {
                // Avoid re-fetching collector info we already have
                let collectedBy = `Collector ${assignment.collectorId}`;
                if (!seenIdsRef.current.has(assignment.id)) {
                  try {
                    const userRes = await fetch(
                      `http://localhost:8080/api/users/${assignment.collectorId}`,
                      { credentials: 'include' }
                    );
                    if (userRes.ok) {
                      const userData = await userRes.json();
                      collectedBy =
                        userData.firstName && userData.lastName
                          ? `${userData.firstName} ${userData.lastName}`
                          : userData.username || collectedBy;
                    }
                  } catch {
                    // silent fail – use default
                  }
                }

                newItems.push({
                  assignmentId: assignment.id,
                  reportId: report.id,
                  wasteType: report.category || "Unknown",
                  location: report.location || "Unknown location",
                  district: report.district || "",
                  collectedBy,
                  collectorId: assignment.collectorId,
                });

                seenIdsRef.current.add(assignment.id);
              }
            }
          } catch {
            // silent – skip this report
          }
        }

        if (newItems.length === 0) return;

        setPendingApprovals((prev) => {
          const existingIds = new Set(prev.map((p) => p.assignmentId));
          const toAdd = newItems.filter((n) => !existingIds.has(n.assignmentId));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });
      } catch {
        // silent – poll will retry
      }
    };

    // Run immediately, then every 8 s
    pollPendingApprovals();
    const interval = setInterval(pollPendingApprovals, 8000);
    return () => clearInterval(interval);
  }, [citizenUserId]);

  const approveCollection = async (assignmentId: number): Promise<boolean> => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/assignments/${assignmentId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED" }),          credentials: 'include',        }
      );
      if (res.ok) {
        dismissedIdsRef.current.add(assignmentId);
        setPendingApprovals((prev) =>
          prev.filter((item) => item.assignmentId !== assignmentId)
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const dismissApproval = (assignmentId: number) => {
    dismissedIdsRef.current.add(assignmentId);
    setPendingApprovals((prev) =>
      prev.filter((item) => item.assignmentId !== assignmentId)
    );
  };

  return { pendingApprovals, approveCollection, dismissApproval };
}