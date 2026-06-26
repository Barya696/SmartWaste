import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Shield,
  Award,
  Gift,
  ChevronDown,
  Lock,
  Unlock,
  Star,
  TrendingUp,
} from "lucide-react";
import { AdminMobileBlock } from "../../components/AdminMobileBlock";
import { UserFormModal } from "../../components/UserFormModal";
import { UserService, type User } from "../../../services/userService";
import {
  AdminService,
  getDisplayName,
  formatDateTime,
} from "../../../services/adminService";

export function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [activeTab, setActiveTab] = useState<
    "users" | "compensation"
  >("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [compensationSearch, setCompensationSearch] = useState("");
  const [compensations, setCompensations] = useState<
    {
      id: number;
      citizenName: string;
      wasteType: string;
      quantity: string;
      pointsRequested: number;
      submittedDate: string;
      status: string;
      district: string;
      citizenId: number;
    }[]
  >([]);
  const [materialPrices, setMaterialPrices] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    fetchUsers();
    loadCompensationData();
  }, []);

  const loadCompensationData = async () => {
    try {
      const [comps, prices, allUsers] = await Promise.all([
        AdminService.getCompensations(),
        AdminService.getMaterialPrices(),
        UserService.getAllUsers(),
      ]);
      setMaterialPrices(prices);
      const userMap = new Map(
        allUsers.filter((u) => u.id != null).map((u) => [u.id!, u]),
      );
      setCompensations(
        comps.map((c) => {
          const citizen = userMap.get(c.citizenId);
          return {
            id: c.id,
            citizenId: c.citizenId,
            citizenName: citizen ? getDisplayName(citizen) : "Unknown",
            wasteType: c.materialType,
            quantity: `${c.weightKg} kg`,
            pointsRequested: Math.round(c.citizenAmount ?? 0),
            submittedDate: c.createdAt
              ? formatDateTime(c.createdAt).split(",")[0]
              : "—",
            status: "approved",
            district: citizen?.district ?? "—",
          };
        }),
      );
    } catch (err) {
      console.error("Failed to load compensation data:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError("Failed to load users. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(undefined);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id: number) => {
    if (deleteConfirm === id) {
      try {
        await UserService.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
        setDeleteConfirm(null);
      } catch (err) {
        setError("Failed to delete user");
        console.error(err);
      }
    } else {
      setDeleteConfirm(id);
    }
  };

  const handleSubmitUser = async (userData: User) => {
    try {
      if (editingUser?.id) {
        const updated = await UserService.updateUser(editingUser.id, userData);
        setUsers(users.map(u => u.id === updated.id ? updated : u));
      } else {
        const created = await UserService.createUser(userData);
        setUsers([...users, created]);
      }
      setIsModalOpen(false);
      setEditingUser(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleBlockUser = async (id: number) => {
    try {
      await UserService.blockUser(id);
      setUsers(users.map(u => u.id === id ? { ...u, isBlocked: true } : u));
    } catch (err) {
      setError("Failed to block user");
      console.error(err);
    }
  };

  const handleUnblockUser = async (id: number) => {
    try {
      await UserService.unblockUser(id);
      setUsers(users.map(u => u.id === id ? { ...u, isBlocked: false } : u));
    } catch (err) {
      setError("Failed to unblock user");
      console.error(err);
    }
  };

  const roleFilterMap: Record<string, string> = {
    all: "all",
    citizen: "CITIZEN",
    collector: "COLLECTOR",
    supervisor: "SUPERVISOR",
    administrator: "ADMIN",
  };

  const stats = [
    {
      label: "Total Users",
      value: String(users.length),
      icon: Users,
      gradFrom: "#60a5fa",
      gradTo: "#3b82f6",
      trend: `${users.length} registered`,
    },
    {
      label: "Citizens",
      value: String(users.filter((u) => u.role === "CITIZEN").length),
      icon: Users,
      gradFrom: "#34d9a0",
      gradTo: "#1cb97a",
      trend: "citizens",
    },
    {
      label: "Collectors",
      value: String(users.filter((u) => u.role === "COLLECTOR").length),
      icon: Users,
      gradFrom: "#c084fc",
      gradTo: "#a855f7",
      trend: "collectors",
    },
    {
      label: "Supervisors",
      value: String(users.filter((u) => u.role === "SUPERVISOR").length),
      icon: Shield,
      gradFrom: "#fb923c",
      gradTo: "#f97316",
      trend: "supervisors",
    },
  ];

  // Aggregate compensation per citizen
  const citizenCompensation = useMemo(() => {
    const map = new Map<string, {
      name: string; district: string; totalCompensated: number;
      transactions: number; wasteTypes: Set<string>;
    }>();
    for (const c of compensations) {
      const key = c.citizenName;
      if (!map.has(key)) {
        map.set(key, { name: c.citizenName, district: c.district, totalCompensated: 0, transactions: 0, wasteTypes: new Set() });
      }
      const entry = map.get(key)!;
      entry.totalCompensated += c.pointsRequested;
      entry.transactions += 1;
      if (c.wasteType) entry.wasteTypes.add(c.wasteType.split(",")[0].trim());
    }
    return Array.from(map.values())
      .sort((a, b) => b.totalCompensated - a.totalCompensated)
      .map((e, i) => ({ ...e, rank: i + 1, wasteTypes: Array.from(e.wasteTypes) }));
  }, [compensations]);

  const filteredCitizenCompensation = useMemo(() => {
    const q = compensationSearch.toLowerCase();
    return citizenCompensation.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.district.toLowerCase().includes(q)
    );
  }, [citizenCompensation, compensationSearch]);

  function getRankBadge(rank: number, pts: number) {
    if (pts >= 5000) return { label: "Gold", color: "#d97706", bg: "#fffbeb", border: "#fcd34d" };
    if (pts >= 1000) return { label: "Silver", color: "#4b5563", bg: "#f9fafb", border: "#d1d5db" };
    if (pts >= 200)  return { label: "Bronze", color: "#92400e", bg: "#fef3c7", border: "#fbbf24" };
    return { label: "Starter", color: "#1e40af", bg: "#eff6ff", border: "#93c5fd" };
  }

  const wasteTypePoints = Object.entries(materialPrices).map(
    ([type, pointsPerKg], i) => ({
      type,
      pointsPerKg: Math.round(pointsPerKg / 50),
      color: ["#3b82f6", "#f59e0b", "#8b5cf6", "#6b7280", "#ef4444", "#1cb97a"][i % 6],
    }),
  );

  const filteredUsers = users.filter((user) => {
    const q = searchTerm.toLowerCase();
    const roleMap: Record<string, string> = {
      "ADMIN": "ADMIN",
      "SUPERVISOR": "SUPERVISOR",
      "COLLECTOR": "COLLECTOR",
      "CITIZEN": "CITIZEN",
    };
    const userRole = roleMap[user.role.toUpperCase()] || user.role;
    
    const matchSearch =
      !q ||
      (user.firstName && user.firstName.toLowerCase().includes(q)) ||
      (user.lastName && user.lastName.toLowerCase().includes(q)) ||
      user.email.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q);
    
    const matchFilter =
      filterRole === "all" ||
      userRole === roleFilterMap[filterRole.toLowerCase()];
    
    return matchSearch && matchFilter;
  });

  function initials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  const roleStyle: Record<
    string,
    { text: string; bg: string; border: string; displayName: string }
  > = {
    ADMIN: {
      text: "#991b1b",
      bg: "#fff1f2",
      border: "#fca5a5",
      displayName: "Administrator",
    },
    SUPERVISOR: {
      text: "#92400e",
      bg: "#fffbeb",
      border: "#fcd34d",
      displayName: "Supervisor",
    },
    COLLECTOR: {
      text: "#1e40af",
      bg: "#eff6ff",
      border: "#93c5fd",
      displayName: "Collector",
    },
    CITIZEN: {
      text: "#065f46",
      bg: "#f0fdf4",
      border: "#6ee7b7",
      displayName: "Citizen",
    },
  };

  const getRoleStyle = (role: string) => {
    const upperRole = role.toUpperCase() as keyof typeof roleStyle;
    return roleStyle[upperRole] || roleStyle.CITIZEN;
  };

  const getDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || "";
  };

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

        .um-body { background: #f7f8fa; border: 1px solid #dde1e7; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .um-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .um-stat-card { background: #fff; border: 1px solid #e8eaee; border-radius: 8px; padding: 10px 16px; display: flex; flex-direction: column; }
        .um-stat-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 6px 16px rgba(0,0,0,0.13); }
        .um-stat-label { font-size: 12px; font-weight: 600; color: #9aa0ac; margin-bottom: 2px; }
        .um-stat-value { font-size: 30px; font-weight: 800; color: #1a1e25; letter-spacing: -0.04em; line-height: 1; }
        .um-stat-trend { font-size: 11.5px; font-weight: 700; color: #1cb97a; margin-top: 8px; }

        .um-tabs { display: flex; gap: 0; border-bottom: 1px solid #dde1e7; margin-bottom: 2px; }
        .um-tab {
          padding: 9px 16px; font-size: 12.5px; font-weight: 700; cursor: pointer;
          background: none; border: none; font-family: inherit; color: #9aa0ac;
          position: relative; letter-spacing: 0.02em; transition: color 0.15s;
        }
        .um-tab:hover { color: #1a1e25; }
        .um-tab.active { color: #1a1e25; }
        .um-tab.active::after {
          content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
          height: 2px; background: #1cb97a; border-radius: 2px 2px 0 0;
        }

        .um-toolbar { display: flex; align-items: center; gap: 8px; }
        .um-search-wrap { position: relative; flex: 1; }
        .um-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #aab0bb; pointer-events: none; }
        .um-input {
          width: 100%; padding: 8px 12px 8px 34px; border: 1px solid #dde1e7; border-radius: 6px;
          font-size: 12.5px; font-weight: 600; color: #1a1e25; background: #fff;
          font-family: inherit; outline: none; transition: border-color 0.15s; box-sizing: border-box;
        }
        .um-input:focus { border-color: #1cb97a; }
        .um-input::placeholder { color: #aab0bb; font-weight: 500; }
        .um-select-wrap { position: relative; }
        .um-select {
          padding: 8px 32px 8px 36px; border: 1px solid #dde1e7; border-radius: 6px;
          font-size: 12.5px; font-weight: 600; color: #1a1e25; background: #fff;
          font-family: inherit; appearance: none; cursor: pointer; outline: none;
          min-width: 150px; transition: border-color 0.15s;
        }
        .um-select:focus { border-color: #1cb97a; }

        .um-card { background: #fff; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden; }
        .um-card-header {
          background: #f0f2f5; padding: 10px 16px; border-bottom: 1px solid #dde1e7;
          display: flex; align-items: center; justify-content: space-between;
        }
        .um-card-title { font-size: 11px; font-weight: 800; color: #4a5568; text-transform: uppercase; letter-spacing: 0.07em; }
        .um-card-subtitle { font-size: 11px; color: #9aa0ac; margin-top: 1px; }

        .um-table { width: 100%; border-collapse: collapse; }
        .um-th {
          padding: 8px 14px; text-align: left; font-size: 10.5px; font-weight: 800;
          color: #9aa0ac; letter-spacing: 0.06em; text-transform: uppercase;
          background: #f7f8fa; border-bottom: 1px solid #eef0f3;
        }
        .um-tr { border-bottom: 1px solid #eef0f3; transition: background 0.1s; }
        .um-tr:last-child { border-bottom: none; }
        .um-tr:hover { background: #f7f9fc; }
        .um-td { padding: 10px 14px; font-size: 12.5px; color: #1a1e25; }
        .um-avatar {
          width: 32px; height: 32px; border-radius: 50%; background: #f0f2f5;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: #6b7a8f; flex-shrink: 0;
        }
        .um-role-badge {
          display: inline-flex; align-items: center; padding: 3px 8px;
          border-radius: 4px; border: 1px solid; font-size: 10.5px; font-weight: 800;
          letter-spacing: 0.03em; text-transform: capitalize;
        }
        .um-status-dot {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 800;
        }
        .um-action-btn {
          width: 26px; height: 26px; border-radius: 5px; border: 1px solid #dde1e7;
          background: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; transition: background 0.1s;
        }
        .um-action-btn:hover { background: #f0f2f5; }
        .um-count { font-size: 10.5px; font-weight: 800; background: #f0f2f5; color: #6b7a8f; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.03em; }

        .um-btn-add {
          display: inline-flex; align-items: center; gap: 6px; background: #1cb97a;
          color: #fff; border: none; border-radius: 6px; padding: 8px 16px;
          font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          letter-spacing: 0.02em; transition: opacity 0.12s;
        }
        .um-btn-add:hover { opacity: 0.87; }

        /* Eco Points */
        .um-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .um-request-card {
          border: 1px solid #dde1e7; border-radius: 7px; padding: 12px 14px;
          display: flex; flex-direction: column; gap: 10px;
          transition: background 0.1s;
        }
        .um-request-card:hover { background: #f7f8fa; }
        .um-approve-btn {
          flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
          padding: 6px 12px; border-radius: 6px; border: none; background: #1cb97a;
          color: #fff; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: opacity 0.1s;
        }
        .um-approve-btn:hover { opacity: 0.87; }
        .um-reject-btn {
          flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
          padding: 6px 12px; border-radius: 6px; border: 1px solid #dde1e7; background: #fff;
          color: #6b7a8f; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: background 0.1s;
        }
        .um-reject-btn:hover { background: #f0f2f5; }
        .um-pts-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 16px; border-bottom: 1px solid #eef0f3;
        }
        .um-pts-row:last-child { border-bottom: none; }
        .um-type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .um-edit-btn {
          width: 24px; height: 24px; border-radius: 4px; border: 1px solid #dde1e7;
          background: #fff; cursor: pointer; display: flex; align-items: center;
          justify-content: center; transition: background 0.1s;
        }
        .um-edit-btn:hover { background: #f0f2f5; }
        .um-empty { text-align: center; padding: 48px 16px; }
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
            User Management
          </p>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Manage system users, permissions, and compensation rewards
          </p>
        </div>
        {activeTab === "users" && (
          <button className="um-btn-add" onClick={handleAddUser}>
            <Plus size={13} /> Add User
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="um-tabs">
        <button
          className={`um-tab${activeTab === "users" ? " active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={`um-tab${activeTab === "compensation" ? " active" : ""}`}
          onClick={() => setActiveTab("compensation")}
        >
          Compensation
        </button>
      </div>

      <div className="um-body">
        {activeTab === "users" ? (
          <>
            {/* Stats */}
            <div className="um-stats-grid">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    className="um-stat-card"
                    key={stat.label}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        className="um-stat-icon"
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
                        <div className="um-stat-label">
                          {stat.label}
                        </div>
                        <div className="um-stat-value">
                          {stat.value}
                        </div>
                      </div>
                    </div>
                    <div className="um-stat-trend">
                      ↑ {stat.trend}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Toolbar */}
            <div className="um-toolbar">
              <div className="um-search-wrap">
                <Search size={13} className="um-search-icon" />
                <input
                  type="text"
                  className="um-input"
                  placeholder="Search by name, email or district…"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                />
              </div>
              <div className="um-select-wrap">
                <Filter
                  size={13}
                  color="#9aa0ac"
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <select
                  className="um-select"
                  value={filterRole}
                  onChange={(e) =>
                    setFilterRole(e.target.value)
                  }
                >
                  <option value="all">All Roles</option>
                  <option value="citizen">Citizens</option>
                  <option value="collector">Collectors</option>
                  <option value="supervisor">
                    Supervisors
                  </option>
                  <option value="administrator">
                    Administrators
                  </option>
                </select>
                <ChevronDown
                  size={13}
                  color="#9aa0ac"
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <span className="um-count">
                {filteredUsers.length} user
                {filteredUsers.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table */}
            <div className="um-card">
              <div className="um-card-header">
                <div>
                  <div className="um-card-title">All Users</div>
                  <div className="um-card-subtitle">
                    Registered accounts across all roles
                  </div>
                </div>
              </div>
              {error && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fca5a5",
                    borderRadius: "0",
                    padding: "12px 16px",
                    fontSize: "12px",
                    color: "#991b1b",
                    borderBottom: "1px solid #dde1e7",
                  }}
                >
                  {error}
                </div>
              )}
              {loading ? (
                <div className="um-empty">
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#aab0bb",
                    }}
                  >
                    Loading users...
                  </p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="um-empty">
                  <Users
                    size={40}
                    color="#aab0bb"
                    style={{
                      margin: "0 auto 10px",
                      display: "block",
                      opacity: 0.4,
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "#aab0bb",
                    }}
                  >
                    No users found
                  </p>
                </div>
              ) : (
                <table className="um-table">
                  <thead>
                    <tr>
                      {[
                        "User",
                        "Role",
                        "Email",
                        "Phone",
                        "Blocked",
                        "Actions",
                      ].map((h) => (
                        <th key={h} className="um-th">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const rs = getRoleStyle(user.role);
                      const displayName = getDisplayName(user);
                      return (
                        <tr key={user.id} className="um-tr">
                          <td className="um-td">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div className="um-avatar">
                                {initials(displayName)}
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 12.5,
                                    color: "#1a1e25",
                                  }}
                                >
                                  {displayName}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#aab0bb",
                                    fontWeight: 500,
                                  }}
                                >
                                  @{user.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="um-td">
                            <span
                              className="um-role-badge"
                              style={{
                                color: rs.text,
                                background: rs.bg,
                                borderColor: rs.border,
                              }}
                            >
                              {rs.displayName}
                            </span>
                          </td>
                          <td
                            className="um-td"
                            style={{
                              fontSize: 12,
                              color: "#6b7a8f",
                              fontWeight: 600,
                            }}
                          >
                            {user.email}
                          </td>
                          <td
                            className="um-td"
                            style={{
                              fontSize: 12,
                              color: "#6b7a8f",
                              fontWeight: 600,
                            }}
                          >
                            {user.phoneNumber || "—"}
                          </td>
                          <td className="um-td">
                            <span
                              className="um-status-dot"
                              style={{
                                color: user.isBlocked
                                  ? "#ef4444"
                                  : "#1cb97a",
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: user.isBlocked
                                    ? "#ef4444"
                                    : "#1cb97a",
                                  display: "inline-block",
                                }}
                              />
                              {user.isBlocked ? "blocked" : "allowed"}
                            </span>
                          </td>
                          <td className="um-td">
                            <div
                              style={{
                                display: "flex",
                                gap: 5,
                              }}
                            >
                              <button
                                className="um-action-btn"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit
                                  size={12}
                                  color="#3b82f6"
                                />
                              </button>
                              {user.isBlocked ? (
                                <button
                                  className="um-action-btn"
                                  onClick={() => handleUnblockUser(user.id!)}
                                  title="Unblock user"
                                  style={{
                                    backgroundColor: "#eff6ff",
                                    borderColor: "#93c5fd",
                                  }}
                                >
                                  <Unlock
                                    size={12}
                                    color="#3b82f6"
                                  />
                                </button>
                              ) : (
                                <button
                                  className="um-action-btn"
                                  onClick={() => handleBlockUser(user.id!)}
                                  title="Block user"
                                  style={{
                                    backgroundColor: "#fef2f2",
                                    borderColor: "#fca5a5",
                                  }}
                                >
                                  <Lock
                                    size={12}
                                    color="#ef4444"
                                  />
                                </button>
                              )}
                              <button
                                className="um-action-btn"
                                onClick={() => handleDeleteUser(user.id!)}
                                title={deleteConfirm === user.id ? "Click again to confirm delete" : "Delete user"}
                                style={{
                                  backgroundColor: deleteConfirm === user.id ? "#fef2f2" : undefined,
                                  borderColor: deleteConfirm === user.id ? "#fca5a5" : undefined,
                                }}
                              >
                                <Trash2
                                  size={12}
                                  color={deleteConfirm === user.id ? "#991b1b" : "#ef4444"}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Compensation stats */}
            <div className="um-stats-grid">
              {[
                {
                  label: "Citizens with Compensation",
                  value: String(citizenCompensation.length),
                  icon: Users,
                  gradFrom: "#60a5fa", gradTo: "#3b82f6",
                  sub: "earned compensation",
                },
                {
                  label: "Total Compensation Issued",
                  value: citizenCompensation.reduce((s, c) => s + c.totalCompensated, 0).toLocaleString() + " XAF",
                  icon: Award,
                  gradFrom: "#34d9a0", gradTo: "#1cb97a",
                  sub: "across all citizens",
                },
                {
                  label: "Avg Compensation / Citizen",
                  value: citizenCompensation.length
                    ? Math.round(citizenCompensation.reduce((s, c) => s + c.totalCompensated, 0) / citizenCompensation.length).toLocaleString() + " XAF"
                    : "0 XAF",
                  icon: TrendingUp,
                  gradFrom: "#c084fc", gradTo: "#a855f7",
                  sub: "per active citizen",
                },
                {
                  label: "Top Earner",
                  value: (citizenCompensation[0]?.totalCompensated ?? 0).toLocaleString() + " XAF",
                  icon: Star,
                  gradFrom: "#fb923c", gradTo: "#f97316",
                  sub: citizenCompensation[0]?.name ?? "—",
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div className="um-stat-card" key={s.label}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
                      <div className="um-stat-icon" style={{ background: `linear-gradient(135deg, ${s.gradFrom}, ${s.gradTo})` }}>
                        <Icon size={22} color="#fff" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="um-stat-label">{s.label}</div>
                        <div className="um-stat-value">{s.value}</div>
                      </div>
                    </div>
                    <div className="um-stat-trend">↑ {s.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Search + table */}
            <div className="um-card">
              <div className="um-card-header">
                <div>
                  <div className="um-card-title">Compensation per Citizen</div>
                  <div className="um-card-subtitle">Total accumulated compensation ranked highest to lowest</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="um-search-wrap" style={{ width: 220 }}>
                    <Search size={13} className="um-search-icon" />
                    <input
                      type="text" className="um-input"
                      placeholder="Search citizen or district…"
                      value={compensationSearch}
                      onChange={(e) => setCompensationSearch(e.target.value)}
                    />
                  </div>
                  <span className="um-count">{filteredCitizenCompensation.length} citizens</span>
                </div>
              </div>

              {filteredCitizenCompensation.length === 0 ? (
                <div className="um-empty">
                  <Award size={40} color="#aab0bb" style={{ margin: "0 auto 10px", display: "block", opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: 13, color: "#aab0bb" }}>
                    {compensationSearch ? "No citizens match your search." : "No compensation records yet."}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="um-table">
                    <thead>
                      <tr>
                        {["Rank", "Citizen", "District", "Total compensated (in XAF)", "Transactions", "Waste Types", "Badge"].map((h) => (
                          <th key={h} className="um-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCitizenCompensation.map((c) => {
                        const badge = getRankBadge(c.rank, c.totalCompensated);
                        return (
                          <tr key={c.name} className="um-tr">
                            <td className="um-td">
                              <span style={{
                                fontWeight: 800, fontSize: 13,
                                color: c.rank <= 3 ? "#d97706" : "#9aa0ac",
                              }}>#{c.rank}</span>
                            </td>
                            <td className="um-td">
                              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <div className="um-avatar" style={{
                                  background: c.rank === 1 ? "linear-gradient(135deg,#fcd34d,#f59e0b)" :
                                    c.rank === 2 ? "linear-gradient(135deg,#d1d5db,#9ca3af)" :
                                    c.rank === 3 ? "linear-gradient(135deg,#fbbf24,#92400e)" : "#f0f2f5",
                                  color: c.rank <= 3 ? "#fff" : "#6b7a8f",
                                }}>
                                  {c.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <span style={{ fontWeight: 700, fontSize: 12.5 }}>{c.name}</span>
                              </div>
                            </td>
                            <td className="um-td" style={{ fontSize: 12, color: "#6b7a8f", fontWeight: 600 }}>
                              {c.district}
                            </td>
                            <td className="um-td">
                              <span style={{ fontWeight: 800, fontSize: 15, color: "#1cb97a", letterSpacing: "-0.02em" }}>
                                {c.totalCompensated.toLocaleString()}
                              </span>
                              <span style={{ fontSize: 11, color: "#9aa0ac", marginLeft: 3 }}>XAF</span>
                            </td>
                            <td className="um-td" style={{ fontWeight: 700, fontSize: 12.5 }}>
                              {c.transactions}
                            </td>
                            <td className="um-td">
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                                {c.wasteTypes.map((wt: string) => (
                                  <span key={wt} style={{
                                    fontSize: 10, fontWeight: 700, background: "#f0f2f5",
                                    color: "#4a5568", borderRadius: 4, padding: "2px 6px",
                                    border: "1px solid #dde1e7",
                                  }}>{wt}</span>
                                ))}
                              </div>
                            </td>
                            <td className="um-td">
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                fontSize: 10.5, fontWeight: 800, letterSpacing: "0.03em",
                                color: badge.color, background: badge.bg,
                                border: `1px solid ${badge.border}`,
                                borderRadius: 4, padding: "3px 8px",
                              }}>
                                {badge.label === "Gold" && <Star size={9} />}
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(undefined);
        }}
        onSubmit={handleSubmitUser}
        user={editingUser}
        title={editingUser ? "Edit User" : "Add New User"}
      />
    </div>
    </AdminMobileBlock>
  );
}