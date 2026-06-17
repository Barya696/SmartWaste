import { useState, useEffect, useCallback } from "react";
import { CheckCircle, X, MapPin, Clock } from "lucide-react";
import type { PendingApproval } from "../hooks/usePendingApproval";

interface CitizenApprovalToastProps {
  items: PendingApproval[];
  onApprove: (assignmentId: number) => Promise<boolean>;
  onDismiss: (assignmentId: number) => void;
}

interface ToastState {
  item: PendingApproval;
  mode: "toast" | "modal";
  approving: boolean;
  approved: boolean;
}

export function CitizenApprovalToast({
  items,
  onApprove,
  onDismiss,
}: CitizenApprovalToastProps) {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // Sync items → internal toasts
  useEffect(() => {
    setToasts((prev) => {
      const incoming = new Set(items.map((i) => i.assignmentId));
      const kept = prev.filter(
        (t) => incoming.has(t.item.assignmentId) || t.approved
      );
      const existing = new Set(kept.map((t) => t.item.assignmentId));
      const added: ToastState[] = items
        .filter((i) => !existing.has(i.assignmentId))
        .map((i) => ({
          item: i,
          mode: "toast",
          approving: false,
          approved: false,
        }));
      return added.length > 0 ? [...kept, ...added] : kept;
    });
  }, [items]);

  // Escape closes any open modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setToasts((prev) =>
          prev.map((t) => (t.mode === "modal" ? { ...t, mode: "toast" } : t))
        );
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ALL hooks above — early return AFTER
  const handleApprove = useCallback(
    async (assignmentId: number) => {
      setToasts((prev) =>
        prev.map((t) =>
          t.item.assignmentId === assignmentId ? { ...t, approving: true } : t
        )
      );

      const ok = await onApprove(assignmentId);

      if (ok) {
        setToasts((prev) =>
          prev.map((t) =>
            t.item.assignmentId === assignmentId
              ? { ...t, approving: false, approved: true, mode: "toast" }
              : t
          )
        );
        setTimeout(() => {
          setToasts((prev) =>
            prev.filter((t) => t.item.assignmentId !== assignmentId)
          );
        }, 1800);
      } else {
        setToasts((prev) =>
          prev.map((t) =>
            t.item.assignmentId === assignmentId
              ? { ...t, approving: false }
              : t
          )
        );
      }
    },
    [onApprove]
  );

  const openModal = (assignmentId: number) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.item.assignmentId === assignmentId ? { ...t, mode: "modal" } : t
      )
    );
  };

  const closeModal = (assignmentId: number) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.item.assignmentId === assignmentId ? { ...t, mode: "toast" } : t
      )
    );
  };

  // Safe early return AFTER all hooks
  if (toasts.length === 0) return null;

  const modalToast = toasts.find((t) => t.mode === "modal");

  return (
    <>
      <style>{`
        @keyframes cat-slide-in {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes cat-modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cat-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cat-pop {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }

        .cat-stack {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 8000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 340px;
          pointer-events: none;
        }

        .cat-toast {
          background: #fff;
          border: 1px solid #dde1e7;
          border-left: 4px solid #1cb97a;
          border-radius: 10px;
          box-shadow: 0 8px 28px rgba(0,0,0,0.13);
          padding: 14px 14px 12px 14px;
          animation: cat-slide-in 0.28s cubic-bezier(.22,.68,0,1.2) both;
          pointer-events: auto;
          font-family: 'Nunito Sans','DM Sans',-apple-system,sans-serif;
        }

        .cat-toast-top {
          display: grid;
          grid-template-columns: 36px 1fr 20px;
          gap: 10px;
          align-items: flex-start;
        }

        .cat-icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #34d9a0, #1cb97a);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cat-label {
          font-size: 10px;
          font-weight: 800;
          color: #1cb97a;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 2px;
        }

        .cat-title {
          font-size: 12.5px;
          font-weight: 800;
          color: #1a1e25;
          line-height: 1.3;
          margin-bottom: 4px;
        }

        .cat-meta {
          font-size: 11px;
          color: #8a9099;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 2px;
        }

        .cat-actions {
          display: flex;
          gap: 7px;
          margin-top: 10px;
        }

        .cat-btn {
          padding: 6px 13px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: inherit;
          transition: opacity 0.12s;
          min-height: 32px;
        }
        .cat-btn:hover:not(:disabled) { opacity: 0.82; }
        .cat-btn:focus-visible { outline: 2px solid #1cb97a; outline-offset: 2px; }

        .cat-btn-approve { background: #1cb97a; color: #fff; }
        .cat-btn-approve:disabled { opacity: 0.6; cursor: not-allowed; }
        .cat-btn-details { background: #f0f2f5; color: #4a5568; }

        .cat-dismiss {
          background: none;
          border: none;
          color: #c4c9d4;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          border-radius: 4px;
          transition: color 0.12s;
        }
        .cat-dismiss:hover { color: #8a9099; }
        .cat-dismiss:focus-visible { outline: 2px solid #1cb97a; }

        .cat-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: cat-spin 0.6s linear infinite;
          display: inline-block;
        }

        .cat-success-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cat-success-check { animation: cat-pop 0.35s cubic-bezier(.34,1.56,.64,1); }
        .cat-success-text { font-size: 13px; font-weight: 800; color: #1cb97a; }
        .cat-success-sub { font-size: 10.5px; color: #8a9099; font-weight: 600; margin-top: 1px; }

        .cat-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10,14,20,0.55);
          backdrop-filter: blur(3px);
          z-index: 9000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cat-modal {
          background: #fff;
          border-radius: 14px;
          width: 420px;
          max-width: 94vw;
          box-shadow: 0 24px 60px rgba(0,0,0,0.22);
          animation: cat-modal-in 0.22s ease both;
          font-family: 'Nunito Sans','DM Sans',-apple-system,sans-serif;
          overflow: hidden;
        }

        .cat-modal-header {
          background: #f0f2f5;
          border-bottom: 1px solid #dde1e7;
          padding: 13px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cat-modal-header-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .cat-modal-body { padding: 22px 20px 16px; }

        .cat-modal-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          text-align: center;
        }

        .cat-modal-hero-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #34d9a0, #1cb97a);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .cat-modal-heading { font-size: 17px; font-weight: 800; color: #1a1e25; margin: 0; }
        .cat-modal-sub { font-size: 12.5px; color: #6b7a8f; margin: 4px 0 0; line-height: 1.5; }

        .cat-detail-box {
          background: #f7f8fa;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .cat-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 9px 14px;
          border-bottom: 1px solid #eef0f3;
        }
        .cat-detail-row:last-child { border-bottom: none; }
        .cat-detail-key { font-size: 10.5px; font-weight: 700; color: #9aa0ac; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; }
        .cat-detail-val { font-size: 12.5px; font-weight: 700; color: #1a1e25; text-align: right; }

        .cat-notice {
          font-size: 11.5px;
          color: #8a9099;
          line-height: 1.5;
          background: #f0f2f5;
          border-radius: 6px;
          padding: 9px 12px;
          margin-bottom: 4px;
        }

        .cat-modal-footer {
          background: #f0f2f5;
          border-top: 1px solid #dde1e7;
          padding: 12px 18px;
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .cat-btn-ghost {
          background: transparent;
          border: 1px solid #dde1e7;
          color: #6b7a8f;
          border-radius: 6px;
          padding: 7px 16px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.12s;
        }
        .cat-btn-ghost:hover { background: #e4e7eb; }
        .cat-btn-ghost:focus-visible { outline: 2px solid #1cb97a; }

        .cat-btn-modal-approve {
          background: #1cb97a;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 7px 18px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.12s;
        }
        .cat-btn-modal-approve:hover:not(:disabled) { opacity: 0.84; }
        .cat-btn-modal-approve:disabled { opacity: 0.6; cursor: not-allowed; }
        .cat-btn-modal-approve:focus-visible { outline: 2px solid #1cb97a; outline-offset: 2px; }

        @media (max-width: 480px) {
          .cat-stack { left: 0; right: 0; bottom: 0; max-width: none; padding: 12px; align-items: stretch; }
        }
      `}</style>

      {/* Toast stack */}
      <div className="cat-stack" aria-live="polite" aria-label="Collection approval notifications">
        {toasts
          .filter((t) => t.mode !== "modal")
          .map((t) => (
            <div key={t.item.assignmentId} className="cat-toast" role="alert">
              {t.approved ? (
                <div className="cat-success-row">
                  <div className="cat-icon-circle cat-success-check">
                    <CheckCircle size={20} color="#fff" />
                  </div>
                  <div>
                    <div className="cat-success-text">Collection confirmed!</div>
                    <div className="cat-success-sub">Report #{t.item.reportId}</div>
                  </div>
                </div>
              ) : (
                <div className="cat-toast-top">
                  <div className="cat-icon-circle">
                    <CheckCircle size={18} color="#fff" />
                  </div>
                  <div>
                    <div className="cat-label">Waste Collected</div>
                    <div className="cat-title">Ready for your approval</div>
                    <div className="cat-meta">
                      <MapPin size={10} aria-hidden="true" />
                      {t.item.location}
                    </div>
                    <div className="cat-meta">
                      <Clock size={10} aria-hidden="true" />
                      {t.item.wasteType} · #{t.item.reportId}
                    </div>
                    <div className="cat-actions">
                      <button
                        className="cat-btn cat-btn-approve"
                        onClick={() => handleApprove(t.item.assignmentId)}
                        disabled={t.approving}
                      >
                        {t.approving ? (
                          <><span className="cat-spinner" /> Confirming…</>
                        ) : (
                          <><CheckCircle size={11} /> Approve</>
                        )}
                      </button>
                      <button
                        className="cat-btn cat-btn-details"
                        onClick={() => openModal(t.item.assignmentId)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  <button
                    className="cat-dismiss"
                    onClick={() => onDismiss(t.item.assignmentId)}
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Modal */}
      {modalToast && (
        <div
          className="cat-overlay"
          onClick={() => closeModal(modalToast.item.assignmentId)}
          role="dialog"
          aria-modal="true"
          aria-label="Citizen approval request"
        >
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cat-modal-header">
              <span className="cat-modal-header-title">
                <CheckCircle size={14} color="#1cb97a" />
                Citizen Approval Request
              </span>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8a9099", padding: 4, display: "flex" }}
                onClick={() => closeModal(modalToast.item.assignmentId)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="cat-modal-body">
              <div className="cat-modal-hero">
                <div className="cat-modal-hero-circle">
                  <CheckCircle size={28} color="#fff" />
                </div>
                <p className="cat-modal-heading">Collection completed!</p>
                <p className="cat-modal-sub">
                  Your waste at <strong>{modalToast.item.location}</strong> has been collected and is awaiting your confirmation.
                </p>
              </div>

              <div className="cat-detail-box">
                {[
                  ["Report ID", `#${modalToast.item.reportId}`],
                  ["Waste Type", modalToast.item.wasteType],
                  ["Location", modalToast.item.location],
                  ["District", modalToast.item.district],
                  ["Collected by", modalToast.item.collectedBy],
                ].map(([label, value]) => (
                  <div className="cat-detail-row" key={label}>
                    <span className="cat-detail-key">{label}</span>
                    <span className="cat-detail-val">{value}</span>
                  </div>
                ))}
              </div>

              <div className="cat-notice">
                By approving, you confirm the waste has been collected from your reported location.
              </div>
            </div>

            <div className="cat-modal-footer">
              <button className="cat-btn-ghost" onClick={() => closeModal(modalToast.item.assignmentId)}>
                Remind me later
              </button>
              <button
                className="cat-btn-modal-approve"
                onClick={() => handleApprove(modalToast.item.assignmentId)}
                disabled={modalToast.approving}
              >
                {modalToast.approving ? (
                  <><span className="cat-spinner" /> Confirming…</>
                ) : (
                  <><CheckCircle size={13} /> Approve Collection</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}