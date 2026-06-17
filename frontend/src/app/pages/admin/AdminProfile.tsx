import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Camera,
  Shield,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export function AdminProfile() {
  const { user, updateUser, changePassword } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    district: user?.district || "",
    photoUrl: user?.photoUrl || "",
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

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("") ?? "?";

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
        .ap-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .ap-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ap-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .ap-card-body { padding: 16px; }

        /* ── Avatar ── */
        .ap-avatar-wrap {
          position: relative;
          width: 72px;
          height: 72px;
          flex-shrink: 0;
        }
        .ap-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border: 3px solid rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 22px;
          font-weight: 800;
          overflow: hidden;
        }
        .ap-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .ap-avatar-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          border: 1.5px solid #dde1e7;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7a8f;
          transition: border-color 0.15s, color 0.15s;
          padding: 0;
        }
        .ap-avatar-btn:hover { border-color: #dc2626; color: #dc2626; }

        /* ── Form fields ── */
        .ap-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .ap-field-label {
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
        .ap-field-input,
        .ap-field-select {
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
        .ap-field-input:focus,
        .ap-field-select:focus { border-color: #dc2626; background: #fff; }
        .ap-field-input:disabled,
        .ap-field-select:disabled { background: #f0f2f5; color: #9aa0ac; cursor: not-allowed; }

        /* ── Footer ── */
        .ap-footer {
          background: #f0f2f5;
          border-top: 1px solid #dde1e7;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }
        .ap-btn-cancel {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          padding: 7px 16px;
          font-size: 12.5px;
          font-weight: 700;
          color: #4a5568;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.1s;
          min-height: 36px;
        }
        .ap-btn-cancel:hover { background: #eaecf0; }
        .ap-btn-primary {
          background: #dc2626;
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
        .ap-btn-primary:hover { opacity: 0.88; }
        .ap-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Password toggle eye ── */
        .ap-pw-eye {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9aa0ac;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .ap-pw-eye:hover { color: #4a5568; }
        .ap-pw-wrap { position: relative; }
        .ap-pw-input {
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
        .ap-pw-input:focus { border-color: #dc2626; background: #fff; }
        .ap-pw-input::placeholder { color: #aab0bb; font-weight: 500; }
        .ap-pw-error {
          font-size: 11px;
          font-weight: 700;
          color: #c53030;
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .ap-pw-success {
          font-size: 11px;
          font-weight: 700;
          color: #dc2626;
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        /* ── Responsive ── */
        @media (max-width: 600px) {
          .ap-form-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .ap-field-input, .ap-field-select, .ap-pw-input { font-size: 16px; }
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
            Manage your personal information and settings
          </p>
        </div>
      </div>

      {/* Profile info card */}
      <div className="ap-card">
        <div className="ap-card-header">
          <User
            size={12}
            color="#6b7a8f"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span className="ap-card-title">Personal Information</span>
        </div>

        <div className="ap-card-body">
          {/* Avatar section */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div className="ap-avatar-wrap">
              <div className="ap-avatar">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt={user?.name} />
                ) : (
                  initials
                )}
              </div>
              <button
                className="ap-avatar-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload profile picture"
                aria-label="Upload profile picture"
              >
                <Camera size={10} aria-hidden="true" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
                aria-label="Profile picture file input"
              />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1a1e25",
                  marginBottom: 2,
                }}
              >
                {user?.name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "#9aa0ac",
                  fontWeight: 600,
                }}
              >
                Administrator · {user?.department || "System"}
              </p>
            </div>
          </div>

          {/* Form grid */}
          <div className="ap-form-grid">
            <div>
              <label className="ap-field-label">
                <User size={11} aria-hidden="true" />
                Full Name
              </label>
              <input
                type="text"
                className="ap-field-input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="ap-field-label">
                <Mail size={11} aria-hidden="true" />
                Email Address
              </label>
              <input
                type="email"
                className="ap-field-input"
                value={formData.email}
                disabled
                title="Email cannot be changed"
              />
            </div>

            <div>
              <label className="ap-field-label">
                <Phone size={11} aria-hidden="true" />
                Phone Number
              </label>
              <input
                type="tel"
                className="ap-field-input"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+242 06 123 4567"
              />
            </div>

            <div>
              <label className="ap-field-label">
                <MapPin size={11} aria-hidden="true" />
                District
              </label>
              <select
                className="ap-field-select"
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value })
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
          </div>
        </div>

        <div className="ap-footer">
          {error && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                fontWeight: 700,
                color: "#c53030",
              }}
            >
              <AlertCircle size={13} aria-hidden="true" />
              {error}
            </span>
          )}
          {saved && !error && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                fontWeight: 700,
                color: "#dc2626",
              }}
            >
              <CheckCircle2 size={13} aria-hidden="true" />{" "}
              Changes saved!
            </span>
          )}
          <button
            className="ap-btn-primary"
            onClick={handleSave}
            disabled={loading}
            style={{ marginLeft: "auto", opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <Save size={13} aria-hidden="true" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Password card */}
      <div className="ap-card" style={{ marginTop: 14 }}>
        <div className="ap-card-header">
          <Lock
            size={12}
            color="#6b7a8f"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span className="ap-card-title">Change Password</span>
        </div>

        <div className="ap-card-body">
          <div className="ap-form-grid">
            <div>
              <label className="ap-field-label">
                <ShieldCheck size={11} aria-hidden="true" />
                Current Password
              </label>
              <div className="ap-pw-wrap">
                <input
                  type={showPw.current ? "text" : "password"}
                  className="ap-pw-input"
                  value={pwData.current}
                  onChange={(e) =>
                    setPwData({ ...pwData, current: e.target.value })
                  }
                  placeholder="••••••••"
                />
                <button
                  className="ap-pw-eye"
                  onClick={() =>
                    setShowPw({ ...showPw, current: !showPw.current })
                  }
                  title={showPw.current ? "Hide" : "Show"}
                  aria-label={showPw.current ? "Hide password" : "Show password"}
                >
                  {showPw.current ? (
                    <EyeOff size={14} aria-hidden="true" />
                  ) : (
                    <Eye size={14} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div style={{ gridColumn: "1 / 2" }}>
              <label className="ap-field-label">
                <ShieldCheck size={11} aria-hidden="true" />
                New Password
              </label>
              <div className="ap-pw-wrap">
                <input
                  type={showPw.next ? "text" : "password"}
                  className="ap-pw-input"
                  value={pwData.next}
                  onChange={(e) =>
                    setPwData({ ...pwData, next: e.target.value })
                  }
                  placeholder="••••••••"
                />
                <button
                  className="ap-pw-eye"
                  onClick={() =>
                    setShowPw({ ...showPw, next: !showPw.next })
                  }
                  title={showPw.next ? "Hide" : "Show"}
                  aria-label={showPw.next ? "Hide password" : "Show password"}
                >
                  {showPw.next ? (
                    <EyeOff size={14} aria-hidden="true" />
                  ) : (
                    <Eye size={14} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div style={{ gridColumn: "2 / 3" }}>
              <label className="ap-field-label">
                <ShieldCheck size={11} aria-hidden="true" />
                Confirm Password
              </label>
              <div className="ap-pw-wrap">
                <input
                  type={showPw.confirm ? "text" : "password"}
                  className="ap-pw-input"
                  value={pwData.confirm}
                  onChange={(e) =>
                    setPwData({ ...pwData, confirm: e.target.value })
                  }
                  placeholder="••••••••"
                />
                <button
                  className="ap-pw-eye"
                  onClick={() =>
                    setShowPw({ ...showPw, confirm: !showPw.confirm })
                  }
                  title={showPw.confirm ? "Hide" : "Show"}
                  aria-label={showPw.confirm ? "Hide password" : "Show password"}
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
            <p className="ap-pw-error">
              <AlertCircle size={12} aria-hidden="true" />
              {pwError}
            </p>
          )}
          {pwSaved && (
            <p className="ap-pw-success">
              <CheckCircle2 size={12} aria-hidden="true" />
              Password updated successfully.
            </p>
          )}
        </div>

        <div className="ap-footer">
          <button
            className="ap-btn-primary"
            onClick={handlePwSave}
            disabled={(!pwData.current && !pwData.next && !pwData.confirm) || pwLoading}
            style={{ marginLeft: "auto" }}
          >
            <Save size={13} aria-hidden="true" />
            {pwLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
