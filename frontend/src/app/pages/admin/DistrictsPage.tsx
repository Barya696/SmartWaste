import { useState, useEffect, useMemo } from "react";
import { type User } from "../../../services/userService";
import {
  MapPin,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  ChevronDown,
  X,
} from "lucide-react";
import { AdminMobileBlock } from "../../components/AdminMobileBlock";
import {
  AdminService,
  type DistrictSummary,
} from "../../../services/adminService";

interface ZoneRow {
  id: number;
  name: string;
  district: string;
  status: string;
  reportCount: number;
  lastCollection: string;
  collectorAssigned: string;
  custom?: boolean;
}

const CUSTOM_DISTRICTS_KEY = "smartwaste_admin_custom_districts";
const CUSTOM_ZONES_KEY = "smartwaste_admin_custom_zones";
const DISTRICT_RENAMES_KEY = "smartwaste_admin_district_renames";
const ZONE_EDITS_KEY = "smartwaste_admin_zone_edits";

type ZoneEdit = {
  name?: string;
  district?: string;
  status?: string;
  collectorAssigned?: string;
};

function loadDistrictRenames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DISTRICT_RENAMES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function loadZoneEdits(): Record<number, ZoneEdit> {
  try {
    const raw = localStorage.getItem(ZONE_EDITS_KEY);
    return raw ? (JSON.parse(raw) as Record<number, ZoneEdit>) : {};
  } catch {
    return {};
  }
}

function loadCustomDistricts(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DISTRICTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function loadCustomZones(): ZoneRow[] {
  try {
    const raw = localStorage.getItem(CUSTOM_ZONES_KEY);
    return raw ? (JSON.parse(raw) as ZoneRow[]) : [];
  } catch {
    return [];
  }
}

function mergeDistrictSummaries(
  summaries: DistrictSummary[],
  customNames: string[],
): DistrictSummary[] {
  const map = new Map(summaries.map((d) => [d.name, d]));
  for (const name of customNames) {
    if (!name.trim() || map.has(name)) continue;
    map.set(name, {
      name,
      reportCount: 0,
      completedCount: 0,
      collectorsAssigned: 0,
      supervisors: [],
      completionRate: 0,
    });
  }
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function DistrictsPage() {
  const [activeTab, setActiveTab] = useState<
    "districts" | "zones"
  >("districts");
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [collectors, setCollectors] = useState<User[]>([]);
  const [supervisorCount, setSupervisorCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customDistricts, setCustomDistricts] = useState<string[]>(
    loadCustomDistricts,
  );
  const [customZones, setCustomZones] = useState<ZoneRow[]>(loadCustomZones);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Add District form
  const [newDistrictName, setNewDistrictName] = useState("");
  const [newDistrictDesc, setNewDistrictDesc] = useState("");
  const [newDistrictStatus, setNewDistrictStatus] = useState("active");

  // Add Zone form
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneDistrict, setNewZoneDistrict] = useState("");
  const [newZoneStatus, setNewZoneStatus] = useState("active");
  const [newZoneCollector, setNewZoneCollector] = useState("");

  // District rename state
  const [districtRenames, setDistrictRenames] = useState<Record<string, string>>(
    loadDistrictRenames,
  );
  const [zoneEdits, setZoneEdits] = useState<Record<number, ZoneEdit>>(
    loadZoneEdits,
  );

  // Edit District
  const [editingDistrict, setEditingDistrict] = useState<DistrictSummary | null>(null);
  const [editDistrictName, setEditDistrictName] = useState("");
  const [editDistrictDesc, setEditDistrictDesc] = useState("");
  const [editDistrictStatus, setEditDistrictStatus] = useState("active");

  // Edit Zone
  const [editingZone, setEditingZone] = useState<ZoneRow | null>(null);
  const [editZoneName, setEditZoneName] = useState("");
  const [editZoneDistrict, setEditZoneDistrict] = useState("");
  const [editZoneStatus, setEditZoneStatus] = useState("active");
  const [editZoneCollector, setEditZoneCollector] = useState("");

  const displayDistricts = useMemo(() => {
    const merged = mergeDistrictSummaries(districts, customDistricts);
    return merged.map((d) => ({
      ...d,
      originalName: d.name,
      name: districtRenames[d.name] ?? d.name,
    }));
  }, [districts, customDistricts, districtRenames]);

  const displayZones = useMemo(
    () =>
      [
        ...zones.map((z) => {
          const edit = zoneEdits[z.id];
          const district =
            edit?.district ??
            (districtRenames[z.district] ?? z.district);
          return {
            ...z,
            name: edit?.name ?? z.name,
            district,
            status: edit?.status ?? z.status,
            collectorAssigned:
              edit?.collectorAssigned ?? z.collectorAssigned,
            custom: false,
          };
        }),
        ...customZones.map((z) => ({
          ...z,
          status: z.status || "active",
          reportCount: z.reportCount ?? 0,
          lastCollection: z.lastCollection || new Date().toISOString(),
          collectorAssigned: z.collectorAssigned || "Unassigned",
          custom: true,
        })),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    [zones, customZones, zoneEdits, districtRenames],
  );

  const districtOptions = useMemo(
    () => displayDistricts.map((d) => d.name),
    [displayDistricts],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [{ reports, users, assignments }, summaries] =
          await Promise.all([
            AdminService.fetchCoreData(),
            AdminService.getDistrictSummaries(),
          ]);
        setDistricts(summaries);
        setSupervisorCount(
          users.filter((u) => u.role === "SUPERVISOR").length,
        );
        setAssignmentCount(assignments.length);
        setCollectors(users.filter((u) => u.role === "COLLECTOR"));

        const locationMap = new Map<string, ZoneRow>();
        let zoneId = 1;
        for (const r of reports) {
          const key = `${r.district}::${r.location}`;
          const existing = locationMap.get(key);
          if (existing) {
            existing.reportCount += 1;
            if (new Date(r.updatedAt) > new Date(existing.lastCollection)) {
              existing.lastCollection = r.updatedAt;
            }
          } else {
            const collector = users.find(
              (u) =>
                u.role === "COLLECTOR" && u.district === r.district,
            );
            locationMap.set(key, {
              id: zoneId++,
              name: r.location,
              district: r.district,
              status: r.status === "completed" ? "active" : "active",
              reportCount: 1,
              lastCollection: r.updatedAt,
              collectorAssigned: collector
                ? `${collector.firstName ?? ""} ${collector.lastName ?? ""}`.trim() ||
                  collector.username
                : "Unassigned",
            });
          }
        }
        setZones(Array.from(locationMap.values()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddDistrict = () => {
    const name = newDistrictName.trim();
    if (!name) { setModalError("District name is required."); return; }
    if (displayDistricts.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      setModalError("A district with this name already exists.");
      return;
    }
    const updated = [...customDistricts, name];
    setCustomDistricts(updated);
    localStorage.setItem(CUSTOM_DISTRICTS_KEY, JSON.stringify(updated));
    setNewDistrictName(""); setNewDistrictDesc(""); setNewDistrictStatus("active");
    setModalError(null);
    setShowDistrictModal(false);
  };

  const handleAddZone = () => {
    const name = newZoneName.trim();
    const district = newZoneDistrict.trim();
    if (!name) { setModalError("Zone name is required."); return; }
    if (!district) { setModalError("Please select a district."); return; }
    if (displayZones.some((z) =>
      z.name.toLowerCase() === name.toLowerCase() &&
      z.district.toLowerCase() === district.toLowerCase()
    )) {
      setModalError("This zone already exists in the selected district.");
      return;
    }
    const zone: ZoneRow = {
      id: Date.now(),
      name,
      district,
      status: newZoneStatus,
      reportCount: 0,
      lastCollection: new Date().toISOString(),
      collectorAssigned: newZoneCollector.trim() || "Unassigned",
      custom: true,
    };
    const updated = [...customZones, zone];
    setCustomZones(updated);
    localStorage.setItem(CUSTOM_ZONES_KEY, JSON.stringify(updated));
    setNewZoneName(""); setNewZoneDistrict("");
    setNewZoneStatus("active"); setNewZoneCollector("");
    setModalError(null);
    setShowZoneModal(false);
  };

  const openAddModal = () => {
    setModalError(null);
    if (activeTab === "districts") {
      setNewDistrictName(""); setNewDistrictDesc(""); setNewDistrictStatus("active");
      setShowDistrictModal(true);
    } else {
      setNewZoneName(""); setNewZoneDistrict("");
      setNewZoneStatus("active"); setNewZoneCollector("");
      setShowZoneModal(true);
    }
  };

  const openEditDistrict = (d: DistrictSummary & { originalName?: string }) => {
    setModalError(null);
    setEditingDistrict(d);
    setEditDistrictName(d.name);
    setEditDistrictDesc("");
    setEditDistrictStatus(d.reportCount > 0 || d.collectorsAssigned > 0 ? "active" : "inactive");
  };

  const handleSaveDistrictEdit = () => {
    if (!editingDistrict) return;
    const newName = editDistrictName.trim();
    const originalName =
      (editingDistrict as DistrictSummary & { originalName?: string })
        .originalName ?? editingDistrict.name;
    if (!newName) { setModalError("District name is required."); return; }
    if (
      displayDistricts.some(
        (d) =>
          d.name.toLowerCase() === newName.toLowerCase() &&
          d.originalName !== originalName,
      )
    ) {
      setModalError("This district name is already in use.");
      return;
    }

    if (customDistricts.includes(originalName)) {
      const updatedCustom = customDistricts.map((n) =>
        n === originalName ? newName : n,
      );
      setCustomDistricts(updatedCustom);
      localStorage.setItem(
        CUSTOM_DISTRICTS_KEY,
        JSON.stringify(updatedCustom),
      );
    } else {
      const updatedRenames = { ...districtRenames, [originalName]: newName };
      setDistrictRenames(updatedRenames);
      localStorage.setItem(
        DISTRICT_RENAMES_KEY,
        JSON.stringify(updatedRenames),
      );
    }

    const updatedZones = customZones.map((z) =>
      z.district === originalName || z.district === editingDistrict.name
        ? { ...z, district: newName }
        : z,
    );
    if (updatedZones.some((z, i) => z !== customZones[i])) {
      setCustomZones(updatedZones);
      localStorage.setItem(CUSTOM_ZONES_KEY, JSON.stringify(updatedZones));
    }

    setModalError(null);
    setEditingDistrict(null);
    setEditDistrictName("");
    setEditDistrictDesc("");
  };

  const openEditZone = (z: ZoneRow) => {
    setModalError(null);
    setEditingZone(z);
    setEditZoneName(z.name);
    setEditZoneDistrict(z.district);
    setEditZoneStatus(z.status || "active");
    setEditZoneCollector(z.collectorAssigned === "Unassigned" ? "" : (z.collectorAssigned || ""));
  };

  const handleSaveZoneEdit = () => {
    if (!editingZone) return;
    const name = editZoneName.trim();
    const district = editZoneDistrict.trim();
    if (!name) { setModalError("Zone name is required."); return; }
    if (!district) { setModalError("Please select a district."); return; }

    if (editingZone.custom) {
      const updated = customZones.map((z) =>
        z.id === editingZone.id
          ? {
              ...z,
              name,
              district,
              status: editZoneStatus,
              collectorAssigned: editZoneCollector || "Unassigned",
            }
          : z,
      );
      setCustomZones(updated);
      localStorage.setItem(CUSTOM_ZONES_KEY, JSON.stringify(updated));
    } else {
      const updatedEdits = {
        ...zoneEdits,
        [editingZone.id]: {
          name,
          district,
          status: editZoneStatus,
          collectorAssigned: editZoneCollector || "Unassigned",
        },
      };
      setZoneEdits(updatedEdits);
      localStorage.setItem(ZONE_EDITS_KEY, JSON.stringify(updatedEdits));
    }

    setModalError(null);
    setEditingZone(null);
  };

  const stats = [
    {
      label: "Total Districts",
      value: String(displayDistricts.length),
      trend: "across Brazzaville",
      icon: MapPin,
      gradFrom: "#60a5fa",
      gradTo: "#3b82f6",
    },
    {
      label: "Active Zones",
      value: String(displayZones.length),
      trend: "from report locations",
      icon: CheckCircle,
      gradFrom: "#34d9a0",
      gradTo: "#1cb97a",
    },
    {
      label: "Supervisors",
      value: String(supervisorCount),
      trend: "assigned",
      icon: Users,
      gradFrom: "#c084fc",
      gradTo: "#a855f7",
    },
    {
      label: "Assignments",
      value: String(assignmentCount),
      trend: "total tasks",
      icon: Calendar,
      gradFrom: "#fb923c",
      gradTo: "#f97316",
    },
  ];

  return (
    <AdminMobileBlock>
      <div
        style={{
          fontFamily:
            "'Nunito Sans', 'DM Sans', -apple-system, sans-serif",
        }}
      >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        .dp-body { background: #f7f8fa; border: 1px solid #dde1e7; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .dp-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .dp-stat-card { background: #fff; border: 1px solid #e8eaee; border-radius: 8px; padding: 10px 16px; display: flex; flex-direction: column; }
        .dp-stat-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 6px 16px rgba(0,0,0,0.13); }
        .dp-stat-label { font-size: 12px; font-weight: 600; color: #9aa0ac; margin-bottom: 2px; }
        .dp-stat-value { font-size: 30px; font-weight: 800; color: #1a1e25; letter-spacing: -0.04em; line-height: 1; }
        .dp-stat-trend { font-size: 11.5px; font-weight: 700; color: #1cb97a; margin-top: 8px; }

        .dp-tabs { display: flex; gap: 0; border-bottom: 1px solid #dde1e7; margin-bottom: 2px; }
        .dp-tab {
          padding: 9px 16px; font-size: 12.5px; font-weight: 700; cursor: pointer;
          background: none; border: none; font-family: inherit; color: #9aa0ac;
          position: relative; letter-spacing: 0.02em; transition: color 0.15s;
        }
        .dp-tab:hover { color: #1a1e25; }
        .dp-tab.active { color: #1a1e25; }
        .dp-tab.active::after {
          content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
          height: 2px; background: #1cb97a; border-radius: 2px 2px 0 0;
        }

        .dp-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden; }
        .dp-card-header {
          background: #f0f2f5; padding: 10px 16px; border-bottom: 1px solid #dde1e7;
          display: flex; align-items: center; justify-content: space-between;
        }
        .dp-card-title { font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em; }
        .dp-card-subtitle { font-size: 11px; color: #9aa0ac; margin-top: 1px; }
        .dp-count { font-size: 10.5px; font-weight: 800; background: #f0f2f5; color: #6b7a8f; padding: 3px 10px; border-radius: 4px; border: 1px solid #dde1e7; letter-spacing: 0.03em; }

        .dp-table { width: 100%; border-collapse: collapse; }
        .dp-th {
          padding: 8px 14px; text-align: left; font-size: 10.5px; font-weight: 800;
          color: #9aa0ac; letter-spacing: 0.06em; text-transform: uppercase;
          background: #f7f8fa; border-bottom: 1px solid #eef0f3;
        }
        .dp-tr { border-bottom: 1px solid #eef0f3; transition: background 0.1s; }
        .dp-tr:last-child { border-bottom: none; }
        .dp-tr:hover { background: #f7f9fc; }
        .dp-td { padding: 10px 14px; font-size: 12.5px; color: #1a1e25; vertical-align: middle; }

        .dp-action-btn {
          width: 26px; height: 26px; border-radius: 5px; border: 1px solid #dde1e7;
          background: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; transition: background 0.1s;
        }
        .dp-action-btn:hover { background: #f0f2f5; }

        .dp-btn-add {
          display: inline-flex; align-items: center; gap: 6px; background: #1cb97a;
          color: #fff; border: none; border-radius: 6px; padding: 8px 16px;
          font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          letter-spacing: 0.02em; transition: opacity 0.12s;
        }
        .dp-btn-add:hover { opacity: 0.87; }

        .dp-supervisor-pill {
          display: inline-flex; align-items: center;
          background: #f0f2f5; border-radius: 4px; padding: 2px 7px;
          font-size: 11px; font-weight: 700; color: #4a5568;
          margin: 2px 2px 0 0;
        }

        .dp-table-wrap { overflow-x: auto; }

        .dp-modal-overlay {
          position: fixed; inset: 0; background: rgba(10,14,20,0.5);
          z-index: 300; display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .dp-modal {
          background: #fff; border: 1px solid #dde1e7; border-radius: 10px;
          width: 420px; max-width: 100%; box-shadow: 0 24px 64px rgba(0,0,0,0.18);
        }
        .dp-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid #eef0f3; background: #f0f2f5;
        }
        .dp-modal-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .dp-modal-footer {
          padding: 12px 16px; border-top: 1px solid #eef0f3;
          display: flex; justify-content: flex-end; gap: 8px;
        }
        .dp-input {
          width: 100%; padding: 8px 12px; border: 1px solid #dde1e7; border-radius: 6px;
          font-size: 13px; font-family: inherit; box-sizing: border-box;
        }
        .dp-btn-cancel {
          padding: 7px 14px; border-radius: 6px; border: 1px solid #dde1e7;
          background: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit;
        }
        .dp-btn-save {
          padding: 7px 14px; border-radius: 6px; border: none;
          background: #1cb97a; color: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit;
        }

        @media (max-width: 900px) {
          .dp-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .dp-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#1a1e25",
              letterSpacing: "-0.02em",
            }}
          >
            Districts &amp; Zones Management
          </p>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Manage Brazzaville districts, zones, and collection
            schedules
          </p>
        </div>
        <button className="dp-btn-add" type="button" onClick={openAddModal}>
          <Plus size={13} />
          {activeTab === "districts"
            ? "Add District"
            : "Add Zone"}
        </button>
      </div>

      {/* Stats */}
      <div
        className="dp-stats-grid"
        style={{ marginBottom: 4 }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className="dp-stat-card" key={stat.label}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 8,
                }}
              >
                <div
                  className="dp-stat-icon"
                  style={{
                    background: `linear-gradient(135deg, ${stat.gradFrom}, ${stat.gradTo})`,
                  }}
                >
                  <Icon
                    size={22}
                    color="#fff"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <div className="dp-stat-label">
                    {stat.label}
                  </div>
                  <div className="dp-stat-value">
                    {stat.value}
                  </div>
                </div>
              </div>
              <div className="dp-stat-trend">
                ↑ {stat.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="dp-tabs">
        <button
          className={`dp-tab${activeTab === "districts" ? " active" : ""}`}
          onClick={() => setActiveTab("districts")}
        >
          Districts
        </button>
        <button
          className={`dp-tab${activeTab === "zones" ? " active" : ""}`}
          onClick={() => setActiveTab("zones")}
        >
          Zones &amp; Schedules
        </button>
      </div>

      <div
        className="dp-body"
        style={{
          marginTop: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderTop: "none",
        }}
      >
        {activeTab === "districts" ? (
          <div className="dp-card">
            <div className="dp-card-header">
              <div>
                <div className="dp-card-title">
                  All Districts
                </div>
                <div className="dp-card-subtitle">
                  Operational areas across Brazzaville
                </div>
              </div>
              <span className="dp-count">
                {displayDistricts.length} districts
              </span>
            </div>
            {loading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#aab0bb" }}>
                Loading districts...
              </div>
            ) : (
            <div className="dp-table-wrap">
            <table className="dp-table">
              <thead>
                <tr>
                  {[
                    "District",
                    "Reports",
                    "Completed",
                    "Collectors",
                    "Completion",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="dp-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayDistricts.map((d) => {
                  const zoneCount = displayZones.filter((z) => z.district === d.name).length;
                  return (
                    <tr key={d.name} className="dp-tr">
                      <td className="dp-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <MapPin size={13} color="#1cb97a" />
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            {d.name}
                          </span>
                        </div>
                      </td>
                      <td
                        className="dp-td"
                        style={{
                          fontWeight: 600,
                          color: "#6b7a8f",
                          fontSize: 12,
                        }}
                      >
                        {d.reportCount}
                      </td>
                      <td className="dp-td">
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 13,
                            color: "#1a1e25",
                          }}
                        >
                          {d.completedCount}
                        </span>
                      </td>
                      <td className="dp-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "#6b7a8f",
                          }}
                        >
                          <Calendar size={11} color="#9aa0ac" />
                          {d.completionRate}% ({zoneCount} zones)
                        </div>
                      </td>
                      <td className="dp-td">
                        <div
                          style={{ display: "flex", gap: 5 }}
                        >
                          <button
                            type="button"
                            className="dp-action-btn"
                            onClick={() => openEditDistrict(d)}
                            aria-label={`Edit ${d.name}`}
                          >
                            <Edit size={12} color="#3b82f6" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            )}
          </div>
        ) : (
          <div className="dp-card">
            <div className="dp-card-header">
              <div>
                <div className="dp-card-title">
                  Zones &amp; Schedules
                </div>
                <div className="dp-card-subtitle">
                  Collection zones with assigned collectors
                </div>
              </div>
              <span className="dp-count">
                {displayZones.length} zones
              </span>
            </div>
            <div className="dp-table-wrap">
            <table className="dp-table">
              <thead>
                <tr>
                  {[
                    "Location",
                    "District",
                    "Reports",
                    "Assigned Collector",
                    "Last Activity",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="dp-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayZones.map((z) => {
                  const isActive = z.status === "active";
                  return (
                    <tr key={z.id} className="dp-tr">
                      <td
                        className="dp-td"
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {z.name}
                      </td>
                      <td className="dp-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#6b7a8f",
                          }}
                        >
                          <MapPin size={10} color="#aab0bb" />{" "}
                          {z.district}
                        </div>
                      </td>
                      <td
                        className="dp-td"
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {z.reportCount}
                      </td>
                      <td
                        className="dp-td"
                        style={{ fontWeight: 600, fontSize: 12.5 }}
                      >
                        {z.collectorAssigned}
                      </td>
                      <td
                        className="dp-td"
                        style={{
                          fontSize: 12,
                          color: "#6b7a8f",
                          fontWeight: 600,
                        }}
                      >
                        {new Date(z.lastCollection).toLocaleDateString()}
                      </td>
                      <td className="dp-td">
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11,
                            fontWeight: 800,
                            color: isActive
                              ? "#1cb97a"
                              : "#9aa0ac",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: isActive
                                ? "#1cb97a"
                                : "#9aa0ac",
                              display: "inline-block",
                            }}
                          />
                          {z.status}
                        </span>
                      </td>
                      <td className="dp-td">
                        <button
                          type="button"
                          className="dp-action-btn"
                          onClick={() => openEditZone(z)}
                          aria-label={`Edit ${z.name}`}
                        >
                          <Edit size={12} color="#3b82f6" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Add District Modal ── */}
      {showDistrictModal && (
        <div className="dp-modal-overlay" role="dialog" aria-modal="true"
          onClick={() => { setShowDistrictModal(false); setModalError(null); }}>
          <div className="dp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dp-modal-header">
              <strong style={{ fontSize: 14 }}>Add District</strong>
              <button type="button" className="dp-action-btn"
                onClick={() => { setShowDistrictModal(false); setModalError(null); }} aria-label="Close">
                <X size={14} />
              </button>
            </div>
            <div className="dp-modal-body">
              {modalError && (
                <div style={{ background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: 6,
                  padding: "8px 12px", fontSize: 12, color: "#c53030", fontWeight: 600 }}>
                  {modalError}
                </div>
              )}
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                District name <span style={{ color: "#e53e3e" }}>*</span>
                <input className="dp-input" style={{ marginTop: 6 }}
                  value={newDistrictName}
                  onChange={(e) => { setNewDistrictName(e.target.value); setModalError(null); }}
                  placeholder="e.g. Talangaï" autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddDistrict()}
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                Description (optional)
                <textarea className="dp-input" style={{ marginTop: 6, resize: "vertical", minHeight: 60 }}
                  value={newDistrictDesc}
                  onChange={(e) => setNewDistrictDesc(e.target.value)}
                  placeholder="Brief description of this district…"
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                Status
                <select className="dp-input" style={{ marginTop: 6 }}
                  value={newDistrictStatus} onChange={(e) => setNewDistrictStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className="dp-modal-footer">
              <button type="button" className="dp-btn-cancel"
                onClick={() => { setShowDistrictModal(false); setModalError(null); }}>Cancel</button>
              <button type="button" className="dp-btn-save" onClick={handleAddDistrict}>Add District</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Zone Modal ── */}
      {showZoneModal && (
        <div className="dp-modal-overlay" role="dialog" aria-modal="true"
          onClick={() => { setShowZoneModal(false); setModalError(null); }}>
          <div className="dp-modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="dp-modal-header">
              <strong style={{ fontSize: 14 }}>Add Zone / Schedule</strong>
              <button type="button" className="dp-action-btn"
                onClick={() => { setShowZoneModal(false); setModalError(null); }} aria-label="Close">
                <X size={14} />
              </button>
            </div>
            <div className="dp-modal-body">
              {modalError && (
                <div style={{ background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: 6,
                  padding: "8px 12px", fontSize: 12, color: "#c53030", fontWeight: 600 }}>
                  {modalError}
                </div>
              )}
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                Zone / location name <span style={{ color: "#e53e3e" }}>*</span>
                <input className="dp-input" style={{ marginTop: 6 }}
                  value={newZoneName}
                  onChange={(e) => { setNewZoneName(e.target.value); setModalError(null); }}
                  placeholder="e.g. Marché Total" autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddZone()}
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                District <span style={{ color: "#e53e3e" }}>*</span>
                <select className="dp-input" style={{ marginTop: 6 }}
                  value={newZoneDistrict} onChange={(e) => { setNewZoneDistrict(e.target.value); setModalError(null); }}>
                  <option value="">— Select district —</option>
                  {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                Assigned collector (optional)
                <select className="dp-input" style={{ marginTop: 6 }}
                  value={newZoneCollector}
                  onChange={(e) => setNewZoneCollector(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {collectors.map((c) => {
                    const label = (c.firstName && c.lastName)
                      ? `${c.firstName} ${c.lastName}`
                      : c.username;
                    return <option key={c.id} value={label}>{label}{c.district ? ` (${c.district})` : ""}</option>;
                  })}
                </select>
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                Status
                <select className="dp-input" style={{ marginTop: 6 }}
                  value={newZoneStatus} onChange={(e) => setNewZoneStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className="dp-modal-footer">
              <button type="button" className="dp-btn-cancel"
                onClick={() => { setShowZoneModal(false); setModalError(null); }}>Cancel</button>
              <button type="button" className="dp-btn-save" onClick={handleAddZone}>Add Zone</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit District Modal ── */}
      {editingDistrict && (
        <div className="dp-modal-overlay" role="dialog" aria-modal="true"
          onClick={() => { setEditingDistrict(null); setModalError(null); }}>
          <div className="dp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dp-modal-header">
              <div>
                <strong style={{ fontSize: 14 }}>Edit District</strong>
                <div style={{ fontSize: 11, color: "#9aa0ac", marginTop: 1 }}>
                  {editingDistrict.reportCount} report{editingDistrict.reportCount !== 1 ? "s" : ""} · {editingDistrict.collectorsAssigned} collector{editingDistrict.collectorsAssigned !== 1 ? "s" : ""}
                </div>
              </div>
              <button type="button" className="dp-action-btn"
                onClick={() => { setEditingDistrict(null); setModalError(null); }} aria-label="Close">
                <X size={14} />
              </button>
            </div>
            <div className="dp-modal-body">
              {modalError && (
                <div style={{ background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: 6,
                  padding: "8px 12px", fontSize: 12, color: "#c53030", fontWeight: 600 }}>
                  {modalError}
                </div>
              )}
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                District name <span style={{ color: "#e53e3e" }}>*</span>
                <input className="dp-input" style={{ marginTop: 6 }}
                  value={editDistrictName}
                  onChange={(e) => { setEditDistrictName(e.target.value); setModalError(null); }}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveDistrictEdit()}
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                Description / notes (optional)
                <textarea className="dp-input" style={{ marginTop: 6, resize: "vertical", minHeight: 60 }}
                  value={editDistrictDesc}
                  onChange={(e) => setEditDistrictDesc(e.target.value)}
                  placeholder="Any notes about this district…"
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                Status
                <select className="dp-input" style={{ marginTop: 6 }}
                  value={editDistrictStatus} onChange={(e) => setEditDistrictStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className="dp-modal-footer">
              <button type="button" className="dp-btn-cancel"
                onClick={() => { setEditingDistrict(null); setModalError(null); }}>Cancel</button>
              <button type="button" className="dp-btn-save" onClick={handleSaveDistrictEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Zone Modal ── */}
      {editingZone && (
        <div className="dp-modal-overlay" role="dialog" aria-modal="true"
          onClick={() => { setEditingZone(null); setModalError(null); }}>
          <div className="dp-modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="dp-modal-header">
              <div>
                <strong style={{ fontSize: 14 }}>Edit Zone</strong>
                <div style={{ fontSize: 11, color: "#9aa0ac", marginTop: 1 }}>
                  {editingZone.reportCount} report{editingZone.reportCount !== 1 ? "s" : ""} · {editingZone.district}
                </div>
              </div>
              <button type="button" className="dp-action-btn"
                onClick={() => { setEditingZone(null); setModalError(null); }} aria-label="Close">
                <X size={14} />
              </button>
            </div>
            <div className="dp-modal-body">
              {modalError && (
                <div style={{ background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: 6,
                  padding: "8px 12px", fontSize: 12, color: "#c53030", fontWeight: 600 }}>
                  {modalError}
                </div>
              )}
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                Zone / location name <span style={{ color: "#e53e3e" }}>*</span>
                <input className="dp-input" style={{ marginTop: 6 }}
                  value={editZoneName}
                  onChange={(e) => { setEditZoneName(e.target.value); setModalError(null); }}
                  autoFocus onKeyDown={(e) => e.key === "Enter" && handleSaveZoneEdit()}
                />
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                District <span style={{ color: "#e53e3e" }}>*</span>
                <select className="dp-input" style={{ marginTop: 6 }}
                  value={editZoneDistrict} onChange={(e) => setEditZoneDistrict(e.target.value)}>
                  {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                Assigned collector
                <select className="dp-input" style={{ marginTop: 6 }}
                  value={editZoneCollector}
                  onChange={(e) => setEditZoneCollector(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {collectors.map((c) => {
                    const label = (c.firstName && c.lastName)
                      ? `${c.firstName} ${c.lastName}`
                      : c.username;
                    return <option key={c.id} value={label}>{label}{c.district ? ` (${c.district})` : ""}</option>;
                  })}
                </select>
              </label>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block" }}>
                Status
                <select className="dp-input" style={{ marginTop: 6 }}
                  value={editZoneStatus} onChange={(e) => setEditZoneStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className="dp-modal-footer">
              <button type="button" className="dp-btn-cancel"
                onClick={() => { setEditingZone(null); setModalError(null); }}>Cancel</button>
              <button type="button" className="dp-btn-save" onClick={handleSaveZoneEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminMobileBlock>
  );
}