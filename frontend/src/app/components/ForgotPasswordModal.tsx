import { useState } from "react";
import { Mail, Lock, ArrowRight, Loader2, X } from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send code");
      }

      setStep("code");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send code";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid code");
      }

      setStep("password");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Invalid code";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      onSuccess();
      handleClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to reset password";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{
        backgroundColor: "#2c3340",
        borderRadius: "12px",
        padding: "32px",
        width: "100%",
        maxWidth: "420px",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#fff",
            margin: 0,
            letterSpacing: "-0.02em",
          }}>
            Reset Password
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color="#8a9099" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: "12px 14px",
            borderRadius: "6px",
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
            fontSize: "13px",
            fontWeight: 500,
            marginBottom: "16px",
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        {step === "email" && (
          <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "#8a9099", margin: 0, marginBottom: "12px" }}>
              Enter your email address and we'll send you a verification code.
            </p>
            <div>
              <label style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#8a9099",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: "6px",
              }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{
                  position: "absolute",
                  left: "11px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4a5568",
                  pointerEvents: "none",
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@smartwaste.cg"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    backgroundColor: "#1a1e25",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#fff",
                    fontFamily: "inherit",
                    outline: "none",
                    minHeight: "44px",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#1cb97a";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(28,185,122,0.35)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                backgroundColor: loading ? "rgba(28,185,122,0.38)" : "#1cb97a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
                boxShadow: "0 2px 10px rgba(28,185,122,0.3)",
                transition: "all 0.13s",
                minHeight: "48px",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                  Sending…
                </>
              ) : (
                <>
                  Send Code
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "#8a9099", margin: 0, marginBottom: "12px" }}>
              Enter the 6-digit code sent to {email}
            </p>
            <div>
              <label style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#8a9099",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: "6px",
              }}>
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#1a1e25",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#fff",
                  fontFamily: "monospace",
                  outline: "none",
                  minHeight: "44px",
                  boxSizing: "border-box",
                  textAlign: "center",
                  letterSpacing: "0.2em",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1cb97a";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(28,185,122,0.35)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                backgroundColor: loading ? "rgba(28,185,122,0.38)" : "#1cb97a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
                boxShadow: "0 2px 10px rgba(28,185,122,0.3)",
                transition: "all 0.13s",
                minHeight: "48px",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                  Verifying…
                </>
              ) : (
                <>
                  Verify Code
                  <ArrowRight size={15} />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
              }}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "transparent",
                color: "#1cb97a",
                border: "1px solid #1cb97a",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Back
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: "#8a9099", margin: 0, marginBottom: "12px" }}>
              Create a new password for your account.
            </p>
            <div>
              <label style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#8a9099",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: "6px",
              }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{
                  position: "absolute",
                  left: "11px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4a5568",
                  pointerEvents: "none",
                }} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Your new password"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    backgroundColor: "#1a1e25",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#fff",
                    fontFamily: "inherit",
                    outline: "none",
                    minHeight: "44px",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#1cb97a";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(28,185,122,0.35)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#8a9099",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: "6px",
              }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{
                  position: "absolute",
                  left: "11px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4a5568",
                  pointerEvents: "none",
                }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    backgroundColor: "#1a1e25",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#fff",
                    fontFamily: "inherit",
                    outline: "none",
                    minHeight: "44px",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#1cb97a";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(28,185,122,0.35)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                backgroundColor: loading ? "rgba(28,185,122,0.38)" : "#1cb97a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
                boxShadow: "0 2px 10px rgba(28,185,122,0.3)",
                transition: "all 0.13s",
                minHeight: "48px",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                  Resetting…
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight size={15} />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("code");
                setNewPassword("");
                setConfirmPassword("");
              }}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "transparent",
                color: "#1cb97a",
                border: "1px solid #1cb97a",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Back
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
