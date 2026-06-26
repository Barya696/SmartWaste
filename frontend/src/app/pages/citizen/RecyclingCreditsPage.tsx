import { useState, useEffect } from "react";
import {
  Recycle,
  DollarSign,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  Package,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  CompensationService,
  type CitizenCreditRow,
} from "../../../services/compensationService";

type ViewFilter = "all" | "compensated" | "pending";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RecyclingCreditsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [rows, setRows] = useState<CitizenCreditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setLoading(false);
        setError("User not authenticated");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const credits = await CompensationService.getCitizenCredits(user.id);
        setRows(credits);
      } catch (err) {
        console.error("Failed to load recycling credits:", err);
        setError("Failed to load your compensation records");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const compensated = rows.filter((a) => a.status === "compensated");
  const totalEarned = compensated.reduce(
    (sum, a) => sum + (a.citizenCredit ?? 0),
    0,
  );
  const citizenPctLabel =
    compensated.find((a) => a.citizenPct != null)?.citizenPct ?? 70;

  const displayed = rows
    .filter((a) => {
      if (filter === "compensated")
        return a.status === "compensated";
      if (filter === "pending")
        return a.status !== "compensated";
      return true;
    })
    .filter((a) => {
      const q = search.toLowerCase();
      return (
        !q ||
        a.reportId.toLowerCase().includes(q) ||
        a.material.toLowerCase().includes(q) ||
        (a.partner ?? "").toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
      );
    });

  return (
    <div
      style={{
        fontFamily:
          "'Nunito Sans','DM Sans',-apple-system,sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        /* ── Page header ── */
        .rc-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .rc-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #1a1e25;
          letter-spacing: -0.02em;
        }
        .rc-subtitle {
          margin: 3px 0 0;
          font-size: 12.5px;
          color: #8a9099;
          font-weight: 500;
        }

        /* Total earned badge */
        .rc-earned-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 8px 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .rc-earned-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--green-light, #34d9a0), var(--green, #1cb97a));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(28,185,122,0.22);
        }
        .rc-earned-label {
          font-size: 10px;
          font-weight: 800;
          color: #9aa0ac;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 1px;
        }
        .rc-earned-amount {
          font-size: 17px;
          font-weight: 800;
          color: var(--green, #1cb97a);
          letter-spacing: -0.02em;
          line-height: 1;
        }

        /* ── Body shell ── */
        .rc-body {
          background: #f7f8fa;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* ── Main card ── */
        .rc-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .rc-card-header {
          background: #f0f2f5;
          border-bottom: 1px solid #dde1e7;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .rc-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rc-count {
          font-size: 10px;
          font-weight: 800;
          background: var(--green, #1cb97a);
          color: #fff;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 0.03em;
        }

        /* ── Toolbar ── */
        .rc-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: 10px 14px;
          border-bottom: 1px solid #eef0f3;
          background: #fafbfc;
        }
        .rc-search-wrap { position: relative; flex: 1 1 180px; }
        .rc-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #aab0bb;
          pointer-events: none;
        }
        .rc-input {
          width: 100%;
          padding: 8px 12px 8px 32px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1e25;
          background: #fff;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          min-height: 40px;
          transition: border-color 0.15s;
        }
        .rc-input:focus { border-color: var(--green, #1cb97a); }
        .rc-input::placeholder { color: #aab0bb; font-weight: 500; }
        @media (max-width: 640px) { .rc-input { font-size: 16px; } }

        .rc-filter-wrap { position: relative; }
        .rc-filter-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #aab0bb;
          pointer-events: none;
          z-index: 1;
        }
        .rc-chevron-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #aab0bb;
          pointer-events: none;
        }
        .rc-select {
          padding: 8px 32px 8px 32px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1e25;
          background: #fff;
          font-family: inherit;
          outline: none;
          cursor: pointer;
          appearance: none;
          min-height: 40px;
          min-width: 150px;
          transition: border-color 0.15s;
        }
        .rc-select:focus { border-color: var(--green, #1cb97a); }
        @media (max-width: 640px) { .rc-select { font-size: 16px; } }

        /* ── Table ── */
        .rc-table-wrap { overflow-x: auto; }
        .rc-table { width: 100%; border-collapse: collapse; }
        .rc-th {
          padding: 8px 14px;
          text-align: left;
          font-size: 9.5px;
          font-weight: 800;
          color: #9aa0ac;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: #f7f8fa;
          border-bottom: 1px solid #eef0f3;
        }
        .rc-th.num, .rc-td.num { text-align: right; }
        .rc-td {
          padding: 12px 14px;
          font-size: 12.5px;
          color: #1a1e25;
          border-bottom: 1px solid #eef0f3;
          vertical-align: middle;
        }
        .rc-tr:last-child .rc-td { border-bottom: none; }
        .rc-tr:hover .rc-td { background: #f7f8fa; }

        /* ── Status — bold text only, no pill background ── */
        .rc-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 800;
        }
        .rc-status-compensated { color: var(--violet, #7c6be8); }
        .rc-status-assigned    { color: #1d4ed8; }
        .rc-status-pending     { color: #b45309; }

        /* ── Empty state ── */
        .rc-empty { text-align: center; padding: 56px 16px; }

        @keyframes rc-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rc-spinner {
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid var(--green, #1cb97a);
          border-radius: 50%;
          animation: rc-spin 0.6s linear infinite;
          margin-bottom: 12px;
        }
      `}</style>

      {/* ── Page header ── */}
      <div className="rc-header-row">
        <div>
          <h1 className="rc-title">Recycling Credits</h1>
          <p className="rc-subtitle">
            Your earnings from recyclable waste collections
          </p>
        </div>
        <div className="rc-earned-badge">
          <div className="rc-earned-icon" aria-hidden="true">
            <DollarSign
              size={16}
              color="white"
              strokeWidth={2.5}
            />
          </div>
          <div>
            <div className="rc-earned-label">Total Earned</div>
            <div className="rc-earned-amount">
              {totalEarned.toLocaleString("fr-CG")} XAF
            </div>
          </div>
        </div>
      </div>

      {/* ── Body shell ── */}
      <div className="rc-body">
        <div className="rc-card">
          <div className="rc-card-header">
            <div className="rc-card-title">
              <Recycle size={13} aria-hidden="true" />
              Collections History
            </div>
            <span
              className="rc-count"
              aria-live="polite"
              aria-atomic="true"
            >
              {displayed.length} records
            </span>
          </div>

          {/* Toolbar */}
          <div className="rc-toolbar">
            <div className="rc-search-wrap">
              <Search
                size={13}
                className="rc-search-icon"
                aria-hidden="true"
              />
              <input
                className="rc-input"
                placeholder="Search by report, material, partner…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search collections"
              />
            </div>
            <div className="rc-filter-wrap">
              <Filter
                size={13}
                className="rc-filter-icon"
                aria-hidden="true"
              />
              <select
                className="rc-select"
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as ViewFilter)
                }
                aria-label="Filter by status"
              >
                <option value="all">All</option>
                <option value="compensated">Compensated</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown
                size={13}
                className="rc-chevron-icon"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Table / empty state */}
          {loading ? (
            <div className="rc-empty">
              <div className="rc-spinner" aria-hidden="true" />
              <p style={{ margin: 0, color: "#6b7a8f", fontSize: 13, fontWeight: 600 }}>
                Loading your compensation records…
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                margin: "16px",
                padding: "12px 16px",
                background: "#fee",
                border: "1px solid #fcc",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#dc2626",
                fontSize: "12.5px",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          ) : displayed.length === 0 ? (
            <div className="rc-empty">
              <Package
                size={40}
                color="#aab0bb"
                style={{
                  margin: "0 auto 10px",
                  display: "block",
                  opacity: 0.4,
                }}
                aria-hidden="true"
              />
              <p
                style={{
                  margin: 0,
                  color: "#aab0bb",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {search ? "No records match your search." : "No compensation records yet."}
              </p>
            </div>
          ) : (
            <div className="rc-table-wrap">
              <table
                className="rc-table"
                aria-label="Recycling credits history"
              >
                <thead>
                  <tr>
                    {[
                      { label: "Report ID", cls: "" },
                      { label: "Material", cls: "" },
                      { label: "Weight", cls: "num" },
                      { label: "Location", cls: "" },
                      { label: "Partner", cls: "" },
                      { label: "Status", cls: "" },
                      {
                        label: `Your Compensation (${citizenPctLabel}%)`,
                        cls: "num",
                      },
                      { label: "Date", cls: "" },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={`rc-th${h.cls ? " " + h.cls : ""}`}
                        scope="col"
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((a: CitizenCreditRow) => {
                    const credit = a.citizenCredit;

                    const statusCls =
                      a.status === "compensated"
                        ? "rc-status rc-status-compensated"
                        : a.status === "assigned"
                          ? "rc-status rc-status-assigned"
                          : "rc-status rc-status-pending";

                    const statusLabel =
                      a.status === "compensated"
                        ? "Compensated"
                        : a.status === "assigned"
                          ? "Assigned"
                          : "Pending";

                    return (
                      <tr key={a.id} className="rc-tr">
                        <td
                          className="rc-td"
                          style={{
                            fontWeight: 800,
                            color: "var(--violet, #7c6be8)",
                          }}
                        >
                          {a.reportId}
                        </td>
                        <td
                          className="rc-td"
                          style={{ fontWeight: 600 }}
                        >
                          {a.material}
                        </td>
                        <td
                          className="rc-td num"
                          style={{ fontWeight: 700 }}
                        >
                          {a.weight}
                        </td>
                        <td
                          className="rc-td"
                          style={{
                            fontSize: 11.5,
                            color: "#8a9099",
                          }}
                        >
                          {a.location}
                        </td>
                        <td
                          className="rc-td"
                          style={{
                            fontSize: 11.5,
                            color: "#8a9099",
                          }}
                        >
                          {a.partner ?? "—"}
                        </td>
                        <td className="rc-td">
                          <span className={statusCls}>
                            {a.status === "compensated" ? (
                              <CheckCircle2
                                size={12}
                                aria-hidden="true"
                              />
                            ) : (
                              <Clock
                                size={12}
                                aria-hidden="true"
                              />
                            )}
                            {statusLabel}
                          </span>
                        </td>
                        <td
                          className="rc-td num"
                          style={{
                            fontWeight: 800,
                            color:
                              credit !== null
                                ? "var(--green, #1cb97a)"
                                : "#aab0bb",
                          }}
                        >
                          {credit !== null
                            ? credit.toLocaleString("fr-CG") +
                              " XAF"
                            : "—"}
                        </td>
                        <td
                          className="rc-td"
                          style={{
                            fontSize: 11.5,
                            color: "#9aa0ac",
                          }}
                        >
                          {fmtDate(a.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
