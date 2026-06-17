import { useState } from "react";
import { X } from "lucide-react";
import type { User } from "../../services/userService";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: User) => Promise<void>;
  user?: User;
  title: string;
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  title,
}: UserFormModalProps) {
  const [formData, setFormData] = useState<User>(
    user || {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
      role: "CITIZEN",
      department: undefined,
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.username || !formData.email) {
        throw new Error(
          "Username and email are required"
        );
      }
      if (!user && !formData.password) {
        throw new Error("Password is required for new users");
      }

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid #dde1e7",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 800,
              color: "#1a1e25",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={20} color="#9aa0ac" />
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              padding: "10px 12px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#4a5568",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!!user}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #dde1e7",
                  borderRadius: "6px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  opacity: user ? 0.6 : 1,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#4a5568",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #dde1e7",
                  borderRadius: "6px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {!user && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#4a5568",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #dde1e7",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#4a5568",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #dde1e7",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#4a5568",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #dde1e7",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#4a5568",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #dde1e7",
                  borderRadius: "6px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#4a5568",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #dde1e7",
                  borderRadius: "6px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              >
                <option value="CITIZEN">Citizen</option>
                <option value="COLLECTOR">Collector</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            {formData.role === "SUPERVISOR" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#4a5568",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department || ""}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #dde1e7",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                >
                  <option value="">Select Department</option>
                  <option value="WASTE_COLLECTION_OPERATIONS">Waste Collection Operations</option>
                  <option value="RECYCLING_OPERATIONS">Recycling Operations</option>
                </select>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "24px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                border: "1px solid #dde1e7",
                backgroundColor: "#fff",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#6b7a8f",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 16px",
                border: "none",
                backgroundColor: "#1cb97a",
                borderRadius: "6px",
                fontSize: "12.5px",
                fontWeight: 700,
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Saving..." : user ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
