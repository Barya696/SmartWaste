import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Camera,
  Shield,
  Award,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Users,
} from "lucide-react";

export function WasteSupervisorProfile() {
  const { user, updateUser, changePassword } = useAuth();
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    district: user?.district || "",
    photoUrl: user?.photoUrl || "",
    supervisorId: "SUP-2026-789",
    department: "Waste Collection Operations",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync formData with user when user changes (e.g., after localStorage restore)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        district: user.district || "",
        photoUrl: user.photoUrl || "",
      }));
    }
  }, [user]);

  const [pwData, setPwData] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePwSave = async () => {
    if (!pwData.current) {
      setPwError("Enter your current password.");
      return;
    }
    if (pwData.next.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (pwData.next !== pwData.confirm) {
      setPwError("Passwords don't match.");
      return;
    }
    
    if (!changePassword) return;
    try {
      setPwLoading(true);
      setPwError("");
      await changePassword(pwData.current, pwData.next);
      setPwSaved(true);
      setPwData({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  };
  const handleSave = async () => {
    if (!updateUser) return;
    try {
      setLoading(true);
      setError(null);
      await updateUser(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData({
          ...formData,
          photoUrl: reader.result as string,
        });
      reader.readAsDataURL(file);
    }
  };

  const districts = [
    "Poto-Poto",
    "Moungali",
    "Bacongo",
    "Makélékélé",
    "Ouenzé",
    "Talangaï",
    "Mfilou",
  ];

  const departments = [
    "Waste Collection Operations",
    "Recycling Operations",
    "Special Waste Management",
    "District Coordination",
  ];

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("") ?? "?";

  // Supervisor accent color
  const amber = "#b45309";
  const amberGradFrom = "#fbbf24";
  const amberGradTo = "#d97706";

  return (
    <div
      style={{
        fontFamily:
          "'Nunito Sans', 'DM Sans', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        /* ── Card base ── */
        .sup-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .sup-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sup-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .sup-card-body { padding: 16px; }

        /* ── Avatar ── */
        .sup-avatar-wrap {
          position: relative;
          width: 72px;
          height: 72px;
          flex-shrink: 0;
        }
        .sup-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24, #b45309);
          border: 3px solid rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 22px;
          font-weight: 800;
          overflow: hidden;
        }
        .sup-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .sup-avatar-btn {
          position: absolute;
          bottom: 0; right: 0;
          width: 24px; height: 24px;
          border-radius: 50%;
          background: #fff;
          border: 1.5px solid #dde1e7;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #6b7a8f;
          transition: border-color 0.15s, color 0.15s;
          padding: 0;
        }
        .sup-avatar-btn:hover { border-color: #b45309; color: #b45309; }

        /* ── Form fields ── */
        .sup-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .sup-field-label {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .sup-field-input,
        .sup-field-select {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1e25;
          background: #f7f8fa;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
          min-height: 40px;
          appearance: none;
        }
        .sup-field-input:focus,
        .sup-field-select:focus { border-color: #b45309; background: #fff; }
        .sup-field-input:disabled,
        .sup-field-select:disabled { background: #f0f2f5; color: #9aa0ac; cursor: not-allowed; }

        /* ── Read-only ID field ── */
        .sup-field-readonly {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: #6b7a8f;
          background: #f0f2f5;
          box-sizing: border-box;
          min-height: 40px;
          display: flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 0.02em;
        }

        /* ── Footer ── */
        .sup-footer {
          background: #f0f2f5;
          border-top: 1px solid #dde1e7;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sup-btn-primary {
          background: #b45309;
          border: none;
          border-radius: 6px;
          padding: 7px 16px;
          font-size: 12.5px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.1s;
          min-height: 36px;
        }
        .sup-btn-primary:hover { opacity: 0.88; }
        .sup-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Password fields ── */
        .sup-pw-wrap { position: relative; }
        .sup-pw-input {
          width: 100%;
          padding: 9px 36px 9px 12px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1e25;
          background: #f7f8fa;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
          min-height: 40px;
        }
        .sup-pw-input:focus { border-color: #b45309; background: #fff; }
        .sup-pw-input::placeholder { color: #aab0bb; font-weight: 500; }
        .sup-pw-eye {
          position: absolute;
          right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: #9aa0ac; padding: 0;
          display: flex; align-items: center;
          transition: color 0.15s;
        }
        .sup-pw-eye:hover { color: #4a5568; }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .sup-form-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .sup-field-input, .sup-field-select, .sup-pw-input { font-size: 16px; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#1a1e25",
              letterSpacing: "-0.02em",
            }}
          >
            My Profile
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Manage your waste supervisor information
          </p>
        </div>

        {/* Collectors Managed mini card — top right */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8eaee",
            borderRadius: 8,
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${amberGradFrom}, ${amberGradTo})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Users
              size={15}
              color="#fff"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#9aa0ac",
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
                lineHeight: 1,
              }}
            >
              Collectors
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#1a1e25",
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
              }}
            >
              8
            </div>
          </div>
          <div
            style={{
              width: 1,
              height: 32,
              background: "#eef0f3",
              margin: "0 2px",
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          <div
            style={{
              fontSize: 11,
              color: "#9aa0ac",
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            <span
              style={{
                color: "var(--green, #1cb97a)",
                fontWeight: 800,
              }}
            >
              95%
            </span>
            <br />
            completion
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          background: "#f7f8fa",
          border: "1px solid #dde1e7",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Identity card */}
        <div className="sup-card">
          <div className="sup-card-header">
            <User
              size={12}
              color="#6b7a8f"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <span className="sup-card-title">Identity</span>
          </div>
          <div className="sup-card-body">
            {/* Avatar + name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <div className="sup-avatar-wrap">
                <div className="sup-avatar">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt={user?.name}
                    />
                  ) : (
                    initials
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: "none" }}
                  aria-label="Upload profile photo"
                />
                <button
                  type="button"
                  className="sup-avatar-btn"
                  title="Upload photo"
                  aria-label="Upload profile photo"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={12} aria-hidden="true" />
                </button>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#1a1e25",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {user?.name}
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: amber,
                  }}
                >
                  Supervisor
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className="sup-form-grid">
              <div>
                <label
                  className="sup-field-label"
                  htmlFor="sup-name"
                >
                  <User size={11} aria-hidden="true" />
                  Full Name
                </label>
                <input
                  id="sup-name"
                  type="text"
                  className="sup-field-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label
                  className="sup-field-label"
                  htmlFor="sup-email"
                >
                  <Mail size={11} aria-hidden="true" />
                  Email Address
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#aab0bb",
                      textTransform: "none" as const,
                      letterSpacing: 0,
                    }}
                  >
                    Cannot be changed
                  </span>
                </label>
                <input
                  id="sup-email"
                  type="email"
                  className="sup-field-input"
                  value={formData.email}
                  readOnly
                  disabled
                  title="Email address cannot be changed"
                />
              </div>
              <div>
                <label
                  className="sup-field-label"
                  htmlFor="sup-phone"
                >
                  <Phone size={11} aria-hidden="true" />
                  Phone Number
                </label>
                <input
                  id="sup-phone"
                  type="tel"
                  className="sup-field-input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+242 06 XXX XXXX"
                />
              </div>
              <div>
                <label
                  className="sup-field-label"
                  htmlFor="sup-district"
                >
                  <MapPin size={11} aria-hidden="true" />
                  Supervised District
                </label>
                <select
                  id="sup-district"
                  className="sup-field-select"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      district: e.target.value,
                    })
                  }
                >
                  <option value="">Select district</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="sup-field-label">
                  <Shield size={11} aria-hidden="true" />
                  Department
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#aab0bb",
                      textTransform: "none" as const,
                      letterSpacing: 0,
                    }}
                  >
                    Cannot be changed
                  </span>
                </label>
                <div className="sup-field-readonly">
                  <Shield
                    size={12}
                    color="#9aa0ac"
                    aria-hidden="true"
                  />
                  {formData.department}
                </div>
              </div>
              <div>
                <label className="sup-field-label">
                  <Award size={11} aria-hidden="true" />
                  Supervisor ID
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#aab0bb",
                      textTransform: "none" as const,
                      letterSpacing: 0,
                    }}
                  >
                    Read only
                  </span>
                </label>
                <div className="sup-field-readonly">
                  <Award
                    size={12}
                    color="#9aa0ac"
                    aria-hidden="true"
                  />
                  {formData.supervisorId}
                </div>
              </div>
            </div>
          </div>

          <div className="sup-footer">
            {saved && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--green, #1cb97a)",
                }}
              >
                <CheckCircle2 size={13} aria-hidden="true" />{" "}
                Changes saved!
              </span>
            )}
            <button
              className="sup-btn-primary"
              onClick={handleSave}
              style={{ marginLeft: "auto" }}
            >
              <Save size={13} aria-hidden="true" />
              Save Changes
            </button>
          </div>
        </div>

        {/* Password card */}
        <div className="sup-card">
          <div className="sup-card-header">
            <Lock
              size={12}
              color="#6b7a8f"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <span className="sup-card-title">
              Change Password
            </span>
          </div>
          <div className="sup-card-body">
            <div className="sup-form-grid">
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  className="sup-field-label"
                  htmlFor="sup-pw-current"
                >
                  <Lock size={11} aria-hidden="true" />
                  Current Password
                </label>
                <div className="sup-pw-wrap">
                  <input
                    id="sup-pw-current"
                    type={showPw.current ? "text" : "password"}
                    className="sup-pw-input"
                    value={pwData.current}
                    onChange={(e) => {
                      setPwData({
                        ...pwData,
                        current: e.target.value,
                      });
                      setPwError("");
                    }}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="sup-pw-eye"
                    aria-label={
                      showPw.current
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPw({
                        ...showPw,
                        current: !showPw.current,
                      })
                    }
                  >
                    {showPw.current ? (
                      <EyeOff size={14} aria-hidden="true" />
                    ) : (
                      <Eye size={14} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  className="sup-field-label"
                  htmlFor="sup-pw-new"
                >
                  <Lock size={11} aria-hidden="true" />
                  New Password
                </label>
                <div className="sup-pw-wrap">
                  <input
                    id="sup-pw-new"
                    type={showPw.next ? "text" : "password"}
                    className="sup-pw-input"
                    value={pwData.next}
                    onChange={(e) => {
                      setPwData({
                        ...pwData,
                        next: e.target.value,
                      });
                      setPwError("");
                    }}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="sup-pw-eye"
                    aria-label={
                      showPw.next
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPw({
                        ...showPw,
                        next: !showPw.next,
                      })
                    }
                  >
                    {showPw.next ? (
                      <EyeOff size={14} aria-hidden="true" />
                    ) : (
                      <Eye size={14} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  className="sup-field-label"
                  htmlFor="sup-pw-confirm"
                >
                  <Lock size={11} aria-hidden="true" />
                  Confirm New Password
                </label>
                <div className="sup-pw-wrap">
                  <input
                    id="sup-pw-confirm"
                    type={showPw.confirm ? "text" : "password"}
                    className="sup-pw-input"
                    value={pwData.confirm}
                    onChange={(e) => {
                      setPwData({
                        ...pwData,
                        confirm: e.target.value,
                      });
                      setPwError("");
                    }}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="sup-pw-eye"
                    aria-label={
                      showPw.confirm
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPw({
                        ...showPw,
                        confirm: !showPw.confirm,
                      })
                    }
                  >
                    {showPw.confirm ? (
                      <EyeOff size={14} aria-hidden="true" />
                    ) : (
                      <Eye size={14} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            {pwError && (
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#c53030",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span aria-hidden="true">⚠</span> {pwError}
              </p>
            )}
            {pwSaved && (
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--green, #1cb97a)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <ShieldCheck size={13} aria-hidden="true" />{" "}
                Password updated successfully.
              </p>
            )}
          </div>
          <div className="sup-footer">
            <button
              className="sup-btn-primary"
              onClick={handlePwSave}
              disabled={
                (!pwData.current &&
                !pwData.next &&
                !pwData.confirm) || pwLoading
              }
              style={{ marginLeft: "auto" }}
            >
              <ShieldCheck size={13} aria-hidden="true" />
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}