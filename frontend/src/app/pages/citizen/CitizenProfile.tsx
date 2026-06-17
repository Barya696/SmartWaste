import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  EcoPointsService,
  type CitizenEcoRewards,
} from "../../../services/ecoPointsService";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Camera,
  Coins,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Landmark,
} from "lucide-react";

export function CitizenProfile() {
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
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync formData with user when user changes (e.g., after localStorage restore)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        district: user.district || "",
        photoUrl: user.photoUrl || "",
        bankAccountNumber: user.bankAccountNumber || "",
      });
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
  const [rewards, setRewards] = useState<CitizenEcoRewards | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    EcoPointsService.getCitizenRewards(user.id)
      .then(setRewards)
      .catch(console.error);
  }, [user?.id]);

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
      await updateUser({ ...formData, bankAccountNumber: bank });
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

        /* ── Eco Points banner ── */
        .cp-eco-banner {
          background: #fff;
          border: 1px solid #e8eaee;
          border-radius: 8px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cp-eco-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cp-eco-label  { font-size: 11.5px; font-weight: 600; color: #9aa0ac; margin-bottom: 2px; }
        .cp-eco-value  { font-size: 32px; font-weight: 800; color: #1a1e25; letter-spacing: -0.04em; line-height: 1; }
        .cp-eco-trend  { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; margin-top: 5px; color: var(--green); }
        .cp-eco-divider {
          width: 1px;
          height: 44px;
          background: #eef0f3;
          flex-shrink: 0;
          margin: 0 4px;
        }
        .cp-eco-next {
          font-size: 11px;
          color: #9aa0ac;
          font-weight: 600;
          line-height: 1.5;
        }
        .cp-eco-next strong {
          color: #4a5568;
          font-weight: 800;
        }

        /* ── Card base ── */
        .cp-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .cp-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cp-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .cp-card-body { padding: 16px; }

        /* ── Avatar ── */
        .cp-avatar-wrap {
          position: relative;
          width: 72px;
          height: 72px;
          flex-shrink: 0;
        }
        .cp-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--green, #1cb97a), #10b981);
          border: 3px solid rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 22px;
          font-weight: 800;
          overflow: hidden;
        }
        .cp-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .cp-avatar-btn {
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
        .cp-avatar-btn:hover { border-color: var(--green, #1cb97a); color: var(--green, #1cb97a); }

        /* ── Form fields ── */
        .cp-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .cp-field-label {
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
        .cp-field-input,
        .cp-field-select {
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
        .cp-field-input:focus,
        .cp-field-select:focus { border-color: var(--green, #1cb97a); background: #fff; }
        .cp-field-input:disabled,
        .cp-field-select:disabled { background: #f0f2f5; color: #9aa0ac; cursor: not-allowed; }

        /* ── Footer ── */
        .cp-footer {
          background: #f0f2f5;
          border-top: 1px solid #dde1e7;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }
        .cp-btn-cancel {
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
        .cp-btn-cancel:hover { background: #eaecf0; }
        .cp-btn-primary {
          background: var(--green, #1cb97a);
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
        .cp-btn-primary:hover { opacity: 0.88; }

        /* ── Password toggle eye ── */
        .cp-pw-eye {
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
        .cp-pw-eye:hover { color: #4a5568; }
        .cp-pw-wrap { position: relative; }
        .cp-pw-input {
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
        .cp-pw-input:focus { border-color: var(--green, #1cb97a); background: #fff; }
        .cp-pw-input::placeholder { color: #aab0bb; font-weight: 500; }
        .cp-pw-error {
          font-size: 11px;
          font-weight: 700;
          color: #c53030;
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .cp-pw-success {
          font-size: 11px;
          font-weight: 700;
          color: var(--green, #1cb97a);
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        /* ── Responsive ── */
        @media (max-width: 600px) {
          .cp-form-grid { grid-template-columns: 1fr; }
          .cp-eco-banner { flex-wrap: wrap; }
          .cp-eco-divider { display: none; }
        }
        @media (max-width: 480px) {
          .cp-field-input, .cp-field-select, .cp-pw-input { font-size: 16px; }
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
            Manage your personal information
          </p>
        </div>

        {/* Eco Points mini card — top right */}
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
                "linear-gradient(135deg, #60a5fa, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Coins
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
              Eco Points
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
              {rewards?.totalEcoPoints ?? 0}
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
              {rewards?.badges.filter((b) => b.earned).length ?? 0}
            </span>
            <br />
            badges earned
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
        <div className="cp-card">
          <div className="cp-card-header">
            <User
              size={12}
              color="#6b7a8f"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <span className="cp-card-title">Identity</span>
          </div>
          <div className="cp-card-body">
            {/* Avatar + name row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <div className="cp-avatar-wrap">
                <div className="cp-avatar">
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
                  className="cp-avatar-btn"
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
                    color: "var(--green, #1cb97a)",
                  }}
                >
                  Citizen
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className="cp-form-grid">
              <div>
                <label
                  className="cp-field-label"
                  htmlFor="cp-name"
                >
                  <User size={11} aria-hidden="true" />
                  Full Name
                </label>
                <input
                  id="cp-name"
                  type="text"
                  className="cp-field-input"
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
                  className="cp-field-label"
                  htmlFor="cp-email"
                >
                  <Mail size={11} aria-hidden="true" />
                  Email Address
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#aab0bb",
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    Cannot be changed
                  </span>
                </label>
                <input
                  id="cp-email"
                  type="email"
                  className="cp-field-input"
                  value={formData.email}
                  readOnly
                  disabled
                  placeholder="Enter your email"
                  title="Email address cannot be changed"
                />
              </div>
              <div>
                <label
                  className="cp-field-label"
                  htmlFor="cp-phone"
                >
                  <Phone size={11} aria-hidden="true" />
                  Phone Number
                </label>
                <input
                  id="cp-phone"
                  type="tel"
                  className="cp-field-input"
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
                  className="cp-field-label"
                  htmlFor="cp-district"
                >
                  <MapPin size={11} aria-hidden="true" />
                  District
                </label>
                <select
                  id="cp-district"
                  className="cp-field-select"
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
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  className="cp-field-label"
                  htmlFor="cp-bank"
                >
                  <Landmark size={11} aria-hidden="true" />
                  Bank Account Number
                  <span style={{ color: "#c53030", marginLeft: 2 }}>*</span>
                </label>
                <input
                  id="cp-bank"
                  type="text"
                  className="cp-field-input"
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
                  Required to receive compensation payments.
                </p>
              </div>
            </div>
          </div>

          <div className="cp-footer">
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
              className="cp-btn-primary"
              onClick={handleSave}
              disabled={loading}
              style={{ marginLeft: "auto", opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              <Save size={13} aria-hidden="true" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
        <div className="cp-card">
          <div className="cp-card-header">
            <Lock
              size={12}
              color="#6b7a8f"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <span className="cp-card-title">
              Change Password
            </span>
          </div>
          <div className="cp-card-body">
            <div className="cp-form-grid">
              {/* Current password — full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  className="cp-field-label"
                  htmlFor="cp-pw-current"
                >
                  <Lock size={11} aria-hidden="true" />
                  Current Password
                </label>
                <div className="cp-pw-wrap">
                  <input
                    id="cp-pw-current"
                    type={showPw.current ? "text" : "password"}
                    className="cp-pw-input"
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
                    className="cp-pw-eye"
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

              {/* New password */}
              <div>
                <label
                  className="cp-field-label"
                  htmlFor="cp-pw-new"
                >
                  <Lock size={11} aria-hidden="true" />
                  New Password
                </label>
                <div className="cp-pw-wrap">
                  <input
                    id="cp-pw-new"
                    type={showPw.next ? "text" : "password"}
                    className="cp-pw-input"
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
                    className="cp-pw-eye"
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

              {/* Confirm password */}
              <div>
                <label
                  className="cp-field-label"
                  htmlFor="cp-pw-confirm"
                >
                  <Lock size={11} aria-hidden="true" />
                  Confirm New Password
                </label>
                <div className="cp-pw-wrap">
                  <input
                    id="cp-pw-confirm"
                    type={showPw.confirm ? "text" : "password"}
                    className="cp-pw-input"
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
                    className="cp-pw-eye"
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
              <p className="cp-pw-error">
                <span aria-hidden="true">⚠</span> {pwError}
              </p>
            )}
            {pwSaved && (
              <p className="cp-pw-success">
                <ShieldCheck size={13} aria-hidden="true" />{" "}
                Password updated successfully.
              </p>
            )}
          </div>
          <div className="cp-footer">
            <button
              className="cp-btn-primary"
              onClick={handlePwSave}
              disabled={
                (!pwData.current &&
                !pwData.next &&
                !pwData.confirm) || pwLoading
              }
              style={{
                opacity:
                  (!pwData.current &&
                  !pwData.next &&
                  !pwData.confirm) || pwLoading
                    ? 0.5
                    : 1,
                cursor:
                  (!pwData.current &&
                  !pwData.next &&
                  !pwData.confirm) || pwLoading
                    ? "not-allowed"
                    : "pointer",
              }}
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