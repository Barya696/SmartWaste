import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Camera,
  Truck,
  Award,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Landmark,
} from "lucide-react";

export function CollectorProfile() {
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
    bankAccountNumber: user?.bankAccountNumber || "",
    vehicleNumber: "CG-BZV-1234",
    badgeNumber: "COL-2026-456",
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
        bankAccountNumber: user.bankAccountNumber || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      try {
        const res = await fetch(`http://localhost:8080/api/users/${user.id}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          bankAccountNumber: data.bankAccountNumber || prev.bankAccountNumber,
        }));
      } catch {
        /* keep cached values */
      }
    }
    loadProfile();
  }, [user?.id]);

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
    const bank = formData.bankAccountNumber.trim();
    if (!bank) {
      setError("Bank account number is required.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (bank.length < 8) {
      setError("Bank account number must be at least 8 characters.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await updateUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        district: formData.district,
        photoUrl: formData.photoUrl,
        bankAccountNumber: bank,
      });
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
        .col-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .col-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .col-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .col-card-body { padding: 16px; }

        /* ── Avatar ── */
        .col-avatar-wrap {
          position: relative;
          width: 72px;
          height: 72px;
          flex-shrink: 0;
        }
        .col-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          border: 3px solid rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 22px;
          font-weight: 800;
          overflow: hidden;
        }
        .col-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .col-avatar-btn {
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
        .col-avatar-btn:hover { border-color: var(--violet, #7c3aed); color: var(--violet, #7c3aed); }

        /* ── Form fields ── */
        .col-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .col-field-label {
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
        .col-field-input,
        .col-field-select {
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
        .col-field-input:focus,
        .col-field-select:focus { border-color: var(--violet, #7c3aed); background: #fff; }
        .col-field-input:disabled,
        .col-field-select:disabled { background: #f0f2f5; color: #9aa0ac; cursor: not-allowed; }

        /* ── Read-only badge field ── */
        .col-field-readonly {
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
        .col-footer {
          background: #f0f2f5;
          border-top: 1px solid #dde1e7;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .col-btn-primary {
          background: var(--violet, #7c3aed);
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
        .col-btn-primary:hover { opacity: 0.88; }
        .col-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Password fields ── */
        .col-pw-wrap { position: relative; }
        .col-pw-input {
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
        .col-pw-input:focus { border-color: var(--violet, #7c3aed); background: #fff; }
        .col-pw-input::placeholder { color: #aab0bb; font-weight: 500; }
        .col-pw-eye {
          position: absolute;
          right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: #9aa0ac; padding: 0;
          display: flex; align-items: center;
          transition: color 0.15s;
        }
        .col-pw-eye:hover { color: #4a5568; }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .col-form-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .col-field-input, .col-field-select, .col-pw-input { font-size: 16px; }
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
            Manage your collector information
          </p>
        </div>

        {/* Tasks Completed mini card — top right */}
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
              background:
                "linear-gradient(135deg, #a78bfa, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Truck
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
              Tasks Done
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
              45
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
              98%
            </span>
            <br />
            success rate
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
        <div className="col-card">
          <div className="col-card-header">
            <User
              size={12}
              color="#6b7a8f"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <span className="col-card-title">Identity</span>
          </div>
          <div className="col-card-body">
            {/* Avatar + name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <div className="col-avatar-wrap">
                <div className="col-avatar">
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
                  className="col-avatar-btn"
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
                    color: "var(--violet, #7c3aed)",
                  }}
                >
                  Collector
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className="col-form-grid">
              <div>
                <label
                  className="col-field-label"
                  htmlFor="col-name"
                >
                  <User size={11} aria-hidden="true" />
                  Full Name
                </label>
                <input
                  id="col-name"
                  type="text"
                  className="col-field-input"
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
                  className="col-field-label"
                  htmlFor="col-email"
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
                  id="col-email"
                  type="email"
                  className="col-field-input"
                  value={formData.email}
                  readOnly
                  disabled
                  title="Email address cannot be changed"
                />
              </div>
              <div>
                <label
                  className="col-field-label"
                  htmlFor="col-phone"
                >
                  <Phone size={11} aria-hidden="true" />
                  Phone Number
                </label>
                <input
                  id="col-phone"
                  type="tel"
                  className="col-field-input"
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
                  className="col-field-label"
                  htmlFor="col-district"
                >
                  <MapPin size={11} aria-hidden="true" />
                  Assigned District
                </label>
                <select
                  id="col-district"
                  className="col-field-select"
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
                <label
                  className="col-field-label"
                  htmlFor="col-vehicle"
                >
                  <Truck size={11} aria-hidden="true" />
                  Vehicle Number
                </label>
                <input
                  id="col-vehicle"
                  type="text"
                  className="col-field-input"
                  value={formData.vehicleNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vehicleNumber: e.target.value,
                    })
                  }
                  placeholder="CG-BZV-XXXX"
                />
              </div>
              <div>
                <label className="col-field-label">
                  <Award size={11} aria-hidden="true" />
                  Badge Number
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
                <div className="col-field-readonly">
                  <Award
                    size={12}
                    color="#9aa0ac"
                    aria-hidden="true"
                  />
                  {formData.badgeNumber}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  className="col-field-label"
                  htmlFor="col-bank"
                >
                  <Landmark size={11} aria-hidden="true" />
                  Bank Account Number
                  <span style={{ color: "#c53030", marginLeft: 2 }}>*</span>
                </label>
                <input
                  id="col-bank"
                  type="text"
                  className="col-field-input"
                  value={formData.bankAccountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankAccountNumber: e.target.value,
                    })
                  }
                  placeholder="Enter your bank account number"
                  required
                  autoComplete="off"
                />
                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: 10.5,
                    color: "#9aa0ac",
                    fontWeight: 600,
                  }}
                >
                  Required to receive recycling credit payments.
                </p>
              </div>
            </div>
          </div>

          <div className="col-footer">
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
                  color: "var(--green, #1cb97a)",
                }}
              >
                <CheckCircle2 size={13} aria-hidden="true" />{" "}
                Changes saved!
              </span>
            )}
            <button
              className="col-btn-primary"
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
        <div className="col-card">
          <div className="col-card-header">
            <Lock
              size={12}
              color="#6b7a8f"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <span className="col-card-title">
              Change Password
            </span>
          </div>
          <div className="col-card-body">
            <div className="col-form-grid">
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  className="col-field-label"
                  htmlFor="col-pw-current"
                >
                  <Lock size={11} aria-hidden="true" />
                  Current Password
                </label>
                <div className="col-pw-wrap">
                  <input
                    id="col-pw-current"
                    type={showPw.current ? "text" : "password"}
                    className="col-pw-input"
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
                    className="col-pw-eye"
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
                  className="col-field-label"
                  htmlFor="col-pw-new"
                >
                  <Lock size={11} aria-hidden="true" />
                  New Password
                </label>
                <div className="col-pw-wrap">
                  <input
                    id="col-pw-new"
                    type={showPw.next ? "text" : "password"}
                    className="col-pw-input"
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
                    className="col-pw-eye"
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
                  className="col-field-label"
                  htmlFor="col-pw-confirm"
                >
                  <Lock size={11} aria-hidden="true" />
                  Confirm New Password
                </label>
                <div className="col-pw-wrap">
                  <input
                    id="col-pw-confirm"
                    type={showPw.confirm ? "text" : "password"}
                    className="col-pw-input"
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
                    className="col-pw-eye"
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
          <div className="col-footer">
            <button
              className="col-btn-primary"
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