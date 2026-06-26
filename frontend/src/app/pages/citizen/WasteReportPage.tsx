import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { WasteService } from "../../../services/wasteService";
import {
  MapPin,
  Camera,
  FileText,
  Package,
  CheckCircle,
  ChevronDown,
  Navigation2,
  Loader2,
  X,
} from "lucide-react";

export function WasteReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: "",
    district: "",
    location: "",
    description: "",
    quantity: "small",
    photo: null as File | null,
  });

  const wasteCategories = [
    "Plastic",
    "Organic",
    "Paper",
    "Glass",
    "Metal",
    "Electronic Waste",
    "Construction Waste",
    "Hazardous Waste",
  ];

  const districts = [
    "Poto-Poto",
    "Moungali",
    "Bacongo",
    "Makélékélé",
    "Plateau des 15 Ans",
    "Ouenzé",
    "Mfilou",
    "Talangaï",
  ];

  const quantitySizes = [
    { id: "small", label: "Small", hint: "< 10kg", icon: "🗑️" },
    {
      id: "medium",
      label: "Medium",
      hint: "10–50kg",
      icon: "♻️",
    },
    { id: "large", label: "Large", hint: "> 50kg", icon: "🚛" },
  ];

  const [locationQuery, setLocationQuery] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [gpsState, setGpsState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [gpsCoords, setGpsCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsHint, setGpsHint] = useState<string | null>(null);
  const geolocateRequestRef = useRef(0);

  const brazzavilleLocations: {
    label: string;
    district: string;
    lat: number;
    lng: number;
  }[] = [
    { label: "Avenue de la Paix", district: "Poto-Poto", lat: -4.269, lng: 15.281 },
    { label: "Marché Total", district: "Poto-Poto", lat: -4.271, lng: 15.284 },
    { label: "Avenue du Maréchal", district: "Poto-Poto", lat: -4.267, lng: 15.278 },
    { label: "Rue Mbochi", district: "Moungali", lat: -4.252, lng: 15.272 },
    { label: "Rond-Point Moungali", district: "Moungali", lat: -4.248, lng: 15.268 },
    { label: "Rue Loubomo", district: "Moungali", lat: -4.255, lng: 15.275 },
    { label: "Avenue Foch", district: "Bacongo", lat: -4.278, lng: 15.262 },
    { label: "Rue du Commerce", district: "Bacongo", lat: -4.281, lng: 15.258 },
    { label: "Cité du Fleuve", district: "Bacongo", lat: -4.275, lng: 15.255 },
    { label: "Marché du Plateau", district: "Makélékélé", lat: -4.288, lng: 15.286 },
    {
      label: "Plateau des 15 Ans, Centre",
      district: "Plateau des 15 Ans",
      lat: -4.285,
      lng: 15.279,
    },
    { label: "Avenue de l'Indépendance", district: "Ouenzé", lat: -4.238, lng: 15.252 },
    { label: "Marché de Ouenzé", district: "Ouenzé", lat: -4.234, lng: 15.248 },
    { label: "Avenue Lumumba", district: "Talangaï", lat: -4.212, lng: 15.262 },
    { label: "Avenue de la Tsiémé", district: "Mfilou", lat: -4.225, lng: 15.238 },
    { label: "Marché de Mfilou", district: "Mfilou", lat: -4.218, lng: 15.234 },
    {
      label: "Boulevard Denis Sassou Nguesso",
      district: "Ouenzé",
      lat: -4.241,
      lng: 15.255,
    },
    { label: "Avenue de la Corniche", district: "Bacongo", lat: -4.272, lng: 15.251 },
  ];

  function haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function findNearestLocation(lat: number, lng: number) {
    let nearest = brazzavilleLocations[0];
    let bestDist = haversineKm(lat, lng, nearest.lat, nearest.lng);
    for (const loc of brazzavilleLocations.slice(1)) {
      const dist = haversineKm(lat, lng, loc.lat, loc.lng);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = loc;
      }
    }
    return { location: nearest, distanceKm: bestDist };
  }

  const filteredLocations = brazzavilleLocations.filter((l) => {
    const matchesQuery =
      locationQuery.trim().length === 0 ||
      l.label
        .toLowerCase()
        .includes(locationQuery.toLowerCase()) ||
      l.district
        .toLowerCase()
        .includes(locationQuery.toLowerCase());
    const matchesDistrict =
      !formData.district || l.district === formData.district;
    return matchesQuery && matchesDistrict;
  });

  const applyCoordinates = (
    lat: number,
    lng: number,
    source: "gps" | "network",
  ) => {
    setGpsCoords({ lat, lng });

    const { location: nearest, distanceKm } = findNearestLocation(lat, lng);
    const locationLabel =
      distanceKm <= 50
        ? nearest.label
        : `Near ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    setFormData((prev) => ({
      ...prev,
      location: locationLabel,
      district:
        distanceKm <= 50 ? nearest.district : prev.district || nearest.district,
    }));
    setLocationQuery(locationLabel);
    setGpsHint(
      source === "network"
        ? "Approximate location from your network — adjust if needed."
        : "Location detected — adjust if needed.",
    );
    setGpsError(null);
    setGpsState("done");
  };

  const fetchNetworkLocation = async (): Promise<{
    lat: number;
    lng: number;
  } | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch("https://ipwho.is/", {
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      if (!res.ok) return null;

      const data = await res.json();
      if (
        data?.success &&
        typeof data.latitude === "number" &&
        typeof data.longitude === "number"
      ) {
        return { lat: data.latitude, lng: data.longitude };
      }
    } catch {
      return null;
    }
    return null;
  };

  const handleGeolocate = () => {
    const requestId = ++geolocateRequestRef.current;
    setGpsState("loading");
    setGpsError(null);
    setGpsHint(null);

    const finishWithNetworkFallback = async () => {
      const coords = await fetchNetworkLocation();
      if (geolocateRequestRef.current !== requestId) return;

      if (coords) {
        applyCoordinates(coords.lat, coords.lng, "network");
        return;
      }

      setGpsState("error");
      setGpsError(
        "Could not detect your location. Pick a location from the list or type it manually.",
      );
    };

    if (!navigator.geolocation) {
      void finishWithNetworkFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (geolocateRequestRef.current !== requestId) return;
        applyCoordinates(pos.coords.latitude, pos.coords.longitude, "gps");
      },
      () => {
        if (geolocateRequestRef.current !== requestId) return;
        void finishWithNetworkFallback();
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 600000,
      },
    );
  };

  // FIX #12: Full reset including locationQuery, gpsState, gpsCoords
  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      category: "",
      district: "",
      location: "",
      description: "",
      quantity: "small",
      photo: null,
    });
    setLocationQuery("");
    setGpsState("idle");
    setGpsCoords(null);
    setGpsError(null);
    setGpsHint(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!user || !user.id) {
        throw new Error("You must be logged in to submit a report");
      }

      // Convert photo to base64 if exists
      let photoUrl: string | null = null;
      if (formData.photo) {
        const photo = formData.photo;
        photoUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(photo);
        });
      }

      // Prepare the report data
      const reportData = {
        userId: user.id,
        category: formData.category,
        district: formData.district,
        location: formData.location,
        description: formData.description,
        quantity: formData.quantity,
        photoUrl: photoUrl,
      };

      const report = await WasteService.createReport(reportData);
      setTrackingNumber(report.trackingNumber);
      setSubmitted(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to submit report";
      setError(errorMsg);
      console.error("Report submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
     Success screen
  ───────────────────────────────────────────── */
  if (submitted) {
    return (
      <div
        style={{
          fontFamily:
            "'Nunito Sans','DM Sans',-apple-system,sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');
        `}</style>

        {/* FIX #1 / #11: <h1> not <p> */}
        <div style={{ marginBottom: 14 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#1a1e25",
              letterSpacing: "-0.02em",
            }}
          >
            Report Waste
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Help keep Brazzaville clean
          </p>
        </div>

        <div
          style={{
            background: "#f7f8fa",
            border: "1px solid #dde1e7",
            borderRadius: 8,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #dde1e7",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Card header */}
            <div
              style={{
                background: "#f0f2f5",
                padding: "10px 16px",
                borderBottom: "1px solid #dde1e7",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle
                size={13}
                color="#1cb97a"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#4a5568",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Report Submitted
              </span>
            </div>

            <div
              style={{
                padding: "28px 24px",
                textAlign: "center",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #34d9a0, #1cb97a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 6px 16px rgba(28,185,122,0.25)",
                }}
              >
                <CheckCircle
                  size={26}
                  color="#fff"
                  strokeWidth={2.5}
                />
              </div>

              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#1a1e25",
                  letterSpacing: "-0.02em",
                }}
              >
                Your report has been received!
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#8a9099",
                }}
              >
                A collection team has been assigned to your
                location.
              </p>

              {/* Tracking number — FIX #11: use <output> role for the generated value */}
              <div
                style={{
                  margin: "20px auto 0",
                  background: "#f7f8fa",
                  border: "1px solid #dde1e7",
                  borderRadius: 8,
                  padding: "14px 20px",
                  maxWidth: 320,
                }}
              >
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#9aa0ac",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  Tracking Number
                </p>
                <output
                  aria-label="Tracking number"
                  style={{
                    display: "block",
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#1a5fa8",
                    letterSpacing: "-0.03em",
                    fontFamily: "inherit",
                  }}
                >
                  {trackingNumber}
                </output>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 11,
                    color: "#aab0bb",
                  }}
                >
                  Use this number to track your report status
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div
              style={{
                background: "#f0f2f5",
                borderTop: "1px solid #dde1e7",
                padding: "12px 16px",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              {/* FIX #12: uses handleReset which fully resets all state */}
              <button
                type="button"
                onClick={handleReset}
                className="wr-btn-cancel"
              >
                Submit Another
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate("/dashboard/citizen/my-reports")
                }
                className="wr-btn-submit"
              >
                <FileText size={13} aria-hidden="true" /> View
                My Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     Form
  ───────────────────────────────────────────── */
  return (
    <div
      style={{
        fontFamily:
          "'Nunito Sans','DM Sans',-apple-system,sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap');

        .wr-body {
          background: #f7f8fa;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .wr-card {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 8px;
          overflow: hidden;
        }
        .wr-card-header {
          background: #f0f2f5;
          padding: 10px 16px;
          border-bottom: 1px solid #dde1e7;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wr-card-title {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .wr-card-body {
          padding: 16px;
        }

        /* ── Two-column grids ─────────────────────── */
        .wr-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        /* FIX #2 / #3: collapse to single column on mobile */
        @media (max-width: 600px) {
          .wr-two-col { grid-template-columns: 1fr; }
        }

        /* ── Labels ──────────────────────────────── */
        .wr-label {
          font-size: 11px;
          font-weight: 800;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
          display: block;
        }

        /* ── Selects ─────────────────────────────── */
        .wr-select-wrap { position: relative; }
        .wr-select {
          width: 100%;
          padding: 9px 36px 9px 12px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1e25;
          background: #f7f8fa;
          font-family: inherit;
          appearance: none;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
          /* FIX #14: touch target */
          min-height: 44px;
          box-sizing: border-box;
        }
        .wr-select:focus { border-color: var(--green, #1cb97a); background: #fff; }
        .wr-select-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #9aa0ac;
        }

        /* ── Text inputs ─────────────────────────── */
        .wr-input {
          width: 100%;
          padding: 9px 36px 9px 36px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1e25;
          background: #f7f8fa;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
          /* FIX #14: touch target */
          min-height: 44px;
        }
        .wr-input:focus { border-color: var(--green, #1cb97a); background: #fff; }
        .wr-input::placeholder { color: #aab0bb; font-weight: 500; }

        /* ── Textarea ────────────────────────────── */
        .wr-textarea {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 500;
          color: #1a1e25;
          background: #f7f8fa;
          font-family: inherit;
          outline: none;
          resize: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .wr-textarea:focus { border-color: var(--green, #1cb97a); background: #fff; }
        .wr-textarea::placeholder { color: #aab0bb; }

        /* FIX #16 / #17: Prevent iOS zoom on focus — 16px minimum font size on mobile */
        @media (max-width: 640px) {
          .wr-select, .wr-input, .wr-textarea { font-size: 16px; }
        }

        /* ── Input hint ──────────────────────────── */
        .wr-input-hint {
          font-size: 10.5px;
          color: #aab0bb;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        /* ── Quantity grid ───────────────────────── */
        .wr-qty-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .wr-qty-btn {
          border-radius: 6px;
          padding: 10px 8px;
          text-align: center;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          border: 1px solid #dde1e7;
          background: #f7f8fa;
          /* FIX #14: touch target */
          min-height: 44px;
        }
        .wr-qty-btn.active {
          border-color: var(--green, #1cb97a);
          background: rgba(28,185,122,0.07);
        }
        .wr-qty-btn:hover:not(.active) { border-color: #b0b8c4; background: #f0f2f5; }
        .wr-qty-btn:focus-visible {
          outline: 2px solid var(--green, #1cb97a);
          outline-offset: 2px;
        }
        .wr-qty-emoji { font-size: 18px; margin-bottom: 4px; }
        .wr-qty-label { font-size: 12px; font-weight: 800; color: #1a1e25; }
        .wr-qty-hint  { font-size: 10.5px; color: #8a9099; margin-top: 1px; }

        /* FIX #4: Quantity grid on mobile — 3 columns inside a full-width card
           (the wr-two-col collapses to 1fr so the card is now full width — 3 cols still fits fine) */
        @media (max-width: 400px) {
          .wr-qty-grid { grid-template-columns: repeat(3, 1fr); gap: 5px; }
          .wr-qty-btn  { padding: 8px 4px; }
          .wr-qty-emoji { font-size: 15px; }
          .wr-qty-label { font-size: 11px; }
        }

        /* ── Upload zone ─────────────────────────── */
        .wr-upload-zone {
          border: 1.5px dashed #dde1e7;
          border-radius: 6px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          background: #f7f8fa;
        }
        .wr-upload-zone:hover { border-color: var(--green, #1cb97a); background: rgba(28,185,122,0.04); }
        .wr-upload-zone.has-file { border-color: var(--green, #1cb97a); border-style: solid; background: rgba(28,185,122,0.05); }

        /* ── Remove photo button — FIX #5: CSS hover, no DOM mutation ── */
        .wr-remove-photo {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: background 0.15s;
        }
        .wr-remove-photo:hover { background: #fca5a5; }
        .wr-remove-photo:focus-visible { outline: 2px solid #e53e3e; outline-offset: 2px; }

        /* ── Dropdown list items — FIX #6: CSS hover ── */
        .wr-loc-item {
          padding: 9px 14px;
          font-size: 12.5px;
          font-weight: 600;
          color: #1a1e25;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f0f2f5;
          transition: background 0.1s;
        }
        .wr-loc-item:hover { background: #f7f8fa; }
        .wr-loc-item.selected {
          color: #0f6e56;
          background: rgba(28,185,122,0.08);
        }
        .wr-loc-item.selected:hover { background: rgba(28,185,122,0.12); }

        /* ── Form footer ─────────────────────────── */
        /* FIX #10: replaced negative-margin trick with a proper card wrapper */
        .wr-form-footer {
          background: #f0f2f5;
          border-top: 1px solid #dde1e7;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          border-radius: 0 0 8px 8px;
        }

        /* ── Action buttons ──────────────────────── */
        .wr-btn-cancel {
          background: #fff;
          border: 1px solid #dde1e7;
          border-radius: 6px;
          padding: 7px 20px;
          font-size: 12.5px;
          font-weight: 700;
          color: #4a5568;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.02em;
          transition: background 0.1s;
          /* FIX #15: touch target */
          min-height: 40px;
        }
        .wr-btn-cancel:hover { background: #eaecf0; }
        .wr-btn-cancel:focus-visible { outline: 2px solid #4a5568; outline-offset: 2px; }

        .wr-btn-submit {
          background: var(--green, #1cb97a);
          border: none;
          border-radius: 6px;
          padding: 7px 20px;
          font-size: 12.5px;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.1s;
          /* FIX #15: touch target */
          min-height: 40px;
        }
        .wr-btn-submit:hover { opacity: 0.88; }
        .wr-btn-submit:focus-visible { outline: 2px solid var(--green, #1cb97a); outline-offset: 2px; }

        /* ── Misc ────────────────────────────────── */
        .wr-required { color: #e53e3e; margin-left: 2px; }

        @keyframes wr-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* Page header — FIX #1: <h1> not <p> */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 14,
          gap: 10,
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
            Report Waste
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12.5,
              color: "#8a9099",
              fontWeight: 500,
            }}
          >
            Help keep Brazzaville clean by reporting waste in
            your area
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard/citizen")}
          className="wr-btn-cancel"
          style={{ flexShrink: 0 }}
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "6px",
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
              fontSize: "13px",
              fontWeight: 500,
              marginBottom: "16px",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}
        {/* FIX #10: Form body now contains the footer as a natural last child inside a card wrapper,
            removing the fragile negative-margin approach */}
        <div className="wr-body">
          {/* ── Section 1: Classification ── */}
          <div className="wr-card">
            <div className="wr-card-header">
              <Package
                size={12}
                color="#6b7a8f"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span className="wr-card-title">
                Waste Classification
              </span>
            </div>
            <div className="wr-card-body">
              {/* FIX #2: wr-two-col collapses to 1 col at ≤600px via CSS */}
              <div className="wr-two-col">
                <div>
                  <label
                    htmlFor="wr-category"
                    className="wr-label"
                  >
                    Category{" "}
                    <span className="wr-required">*</span>
                  </label>
                  <div className="wr-select-wrap">
                    <select
                      id="wr-category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value,
                        })
                      }
                      className="wr-select"
                      required
                    >
                      <option value="">Select category</option>
                      {wasteCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="wr-select-icon"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <label
                      htmlFor="wr-district"
                      className="wr-label"
                      style={{ margin: 0 }}
                    >
                      District{" "}
                      <span className="wr-required">*</span>
                    </label>
                    {formData.district && formData.location && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "rgba(28,185,122,0.1)",
                          color: "#0f6e56",
                          letterSpacing: "0.03em",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        ✦ Auto-filled
                      </span>
                    )}
                  </div>
                  <div className="wr-select-wrap">
                    <select
                      id="wr-district"
                      value={formData.district}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          district: e.target.value,
                          location: "",
                        });
                        setLocationQuery("");
                      }}
                      className="wr-select"
                      style={{
                        borderColor:
                          formData.district && formData.location
                            ? "var(--green, #1cb97a)"
                            : undefined,
                      }}
                      required
                    >
                      <option value="">Select district</option>
                      {districts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="wr-select-icon"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Location ── */}
          <div className="wr-card">
            <div className="wr-card-header">
              <MapPin
                size={12}
                color="#6b7a8f"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span className="wr-card-title">
                Location Details
              </span>
            </div>
            <div
              className="wr-card-body"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <label
                    htmlFor="wr-location"
                    className="wr-label"
                    style={{ margin: 0 }}
                  >
                    Specific Location{" "}
                    <span className="wr-required">*</span>
                  </label>

                  {/* FIX #9: GPS button has aria-label that reflects current state */}
                  <button
                    type="button"
                    onClick={handleGeolocate}
                    disabled={gpsState === "loading"}
                    aria-label={
                      gpsState === "loading"
                        ? "Locating via GPS…"
                        : gpsState === "done"
                          ? "GPS location set"
                          : gpsState === "error"
                            ? "Retry GPS location"
                            : "Use my current GPS location"
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background:
                        gpsState === "done"
                          ? "rgba(28,185,122,0.1)"
                          : gpsState === "error"
                            ? "rgba(229,62,62,0.08)"
                            : "#f0f2f5",
                      border: `1px solid ${
                        gpsState === "done"
                          ? "var(--green, #1cb97a)"
                          : gpsState === "error"
                            ? "#e53e3e"
                            : "#dde1e7"
                      }`,
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor:
                        gpsState === "loading"
                          ? "not-allowed"
                          : "pointer",
                      color:
                        gpsState === "done"
                          ? "#0f6e56"
                          : gpsState === "error"
                            ? "#c53030"
                            : "#4a5568",
                      fontFamily: "inherit",
                      letterSpacing: "0.02em",
                      transition: "all 0.15s",
                      opacity: gpsState === "loading" ? 0.7 : 1,
                      minHeight: 32,
                    }}
                  >
                    {gpsState === "loading" ? (
                      <>
                        <Loader2
                          size={11}
                          style={{
                            animation:
                              "wr-spin 0.8s linear infinite",
                          }}
                          aria-hidden="true"
                        />{" "}
                        Locating…
                      </>
                    ) : gpsState === "done" ? (
                      <>
                        <Navigation2
                          size={11}
                          aria-hidden="true"
                        />{" "}
                        Location set
                      </>
                    ) : gpsState === "error" ? (
                      <>
                        <Navigation2
                          size={11}
                          aria-hidden="true"
                        />{" "}
                        Retry GPS
                      </>
                    ) : (
                      <>
                        <Navigation2
                          size={11}
                          aria-hidden="true"
                        />{" "}
                        My current location
                      </>
                    )}
                  </button>
                </div>

                {/* Filterable combobox */}
                {/* FIX #8: aria-autocomplete + role=combobox for screen readers */}
                <div style={{ position: "relative" }}>
                  <MapPin
                    size={14}
                    color="#9aa0ac"
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: 11,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  <input
                    id="wr-location"
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={locationOpen}
                    aria-controls="wr-location-list"
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }));
                      setLocationOpen(true);
                    }}
                    onFocus={() => setLocationOpen(true)}
                    onBlur={() =>
                      setTimeout(
                        () => setLocationOpen(false),
                        150,
                      )
                    }
                    placeholder="Search or select a location…"
                    className="wr-input"
                    autoComplete="off"
                    required
                  />
                  <ChevronDown
                    size={13}
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: `translateY(-50%) rotate(${locationOpen ? 180 : 0}deg)`,
                      transition: "transform 0.15s",
                      color: "#9aa0ac",
                      pointerEvents: "none",
                    }}
                  />

                  {locationOpen && (
                    <div
                      id="wr-location-list"
                      role="listbox"
                      aria-label="Suggested locations"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        background: "#fff",
                        border: "1px solid #dde1e7",
                        borderRadius: 6,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                        overflow: "hidden",
                        maxHeight: 220,
                        overflowY: "auto",
                      }}
                    >
                      {filteredLocations.length === 0 ? (
                        <div
                          style={{
                            padding: "10px 14px",
                            fontSize: 12,
                            color: "#aab0bb",
                            fontStyle: "italic",
                          }}
                        >
                          No locations found
                          {formData.district
                            ? ` in ${formData.district}`
                            : ""}
                        </div>
                      ) : (
                        filteredLocations.map((loc) => {
                          const isSelected =
                            formData.location === loc.label;
                          return (
                            // FIX #6: CSS class-based hover; no DOM mutation
                            <div
                              key={loc.label}
                              role="option"
                              aria-selected={isSelected}
                              className={`wr-loc-item${isSelected ? " selected" : ""}`}
                              onMouseDown={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  location: loc.label,
                                  district: loc.district,
                                }));
                                setLocationQuery(loc.label);
                                setLocationOpen(false);
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <MapPin
                                  size={11}
                                  color={
                                    isSelected
                                      ? "var(--green, #1cb97a)"
                                      : "#aab0bb"
                                  }
                                  aria-hidden="true"
                                />
                                {loc.label}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: 4,
                                  background: isSelected
                                    ? "rgba(28,185,122,0.15)"
                                    : "#f0f2f5",
                                  color: isSelected
                                    ? "#0f6e56"
                                    : "#8a9099",
                                  letterSpacing: "0.03em",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                              >
                                {loc.district}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {gpsCoords && (
                  <p className="wr-input-hint">
                    <Navigation2
                      size={10}
                      color="var(--green, #1cb97a)"
                      aria-hidden="true"
                    />
                    <span
                      style={{ color: "var(--green, #1cb97a)" }}
                    >
                      {gpsHint ?? `Coordinates: ${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}`}
                    </span>
                  </p>
                )}
                {gpsState === "error" && !gpsCoords && (
                  <p
                    className="wr-input-hint"
                    style={{ color: "#c53030" }}
                  >
                    <span aria-hidden="true">⚠</span>
                    <span>
                      {gpsError ??
                        "Could not detect your location. Pick a location manually."}
                    </span>
                  </p>
                )}
                {gpsState !== "error" && !gpsCoords && (
                  <p className="wr-input-hint">
                    <MapPin size={10} aria-hidden="true" />
                    Type to filter or use GPS to auto-fill
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="wr-description"
                  className="wr-label"
                >
                  Description{" "}
                  <span className="wr-required">*</span>
                </label>
                <textarea
                  id="wr-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the waste situation — type, spread, any hazards..."
                  rows={3}
                  className="wr-textarea"
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Section 3: Quantity + Photo side by side ──
              FIX #3: wr-two-col collapses to 1 col at ≤600px via CSS */}
          <div className="wr-two-col" style={{ gap: 10 }}>
            {/* Quantity */}
            <div className="wr-card">
              <div className="wr-card-header">
                <span className="wr-card-title">
                  Estimated Quantity
                </span>
              </div>
              <div className="wr-card-body">
                {/* FIX #4: qty-grid stays repeat(3,1fr); on mobile the card is now full-width
                    so 3 cols is readable. Extra compression at ≤400px handled in CSS. */}
                <div
                  className="wr-qty-grid"
                  role="group"
                  aria-label="Estimated quantity"
                >
                  {quantitySizes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={formData.quantity === s.id}
                      aria-label={`${s.label} — ${s.hint}`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          quantity: s.id,
                        })
                      }
                      className={`wr-qty-btn${formData.quantity === s.id ? " active" : ""}`}
                    >
                      <div
                        className="wr-qty-emoji"
                        aria-hidden="true"
                      >
                        {s.icon}
                      </div>
                      <div
                        className="wr-qty-label"
                        style={{
                          color:
                            formData.quantity === s.id
                              ? "#0f6e56"
                              : "#1a1e25",
                        }}
                      >
                        {s.label}
                      </div>
                      <div className="wr-qty-hint">
                        {s.hint}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Photo */}
            <div className="wr-card">
              <div className="wr-card-header">
                <Camera
                  size={12}
                  color="#6b7a8f"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                <span className="wr-card-title">
                  Photo Evidence
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10.5,
                    color: "#aab0bb",
                    fontWeight: 600,
                  }}
                >
                  Optional
                </span>
              </div>
              <div className="wr-card-body">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      setFormData({
                        ...formData,
                        photo: e.target.files[0],
                      });
                  }}
                  style={{ display: "none" }}
                  id="photo-upload"
                  aria-label="Upload photo evidence"
                />
                <label
                  htmlFor="photo-upload"
                  className={`wr-upload-zone${formData.photo ? " has-file" : ""}`}
                  style={{
                    display: "block",
                    position: "relative",
                  }}
                >
                  <Camera
                    size={22}
                    color={
                      formData.photo
                        ? "var(--green, #1cb97a)"
                        : "#aab0bb"
                    }
                    aria-hidden="true"
                    style={{ margin: "0 auto 8px" }}
                  />
                  {formData.photo ? (
                    <>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#0f6e56",
                        }}
                      >
                        {formData.photo.name}
                      </p>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 10.5,
                          color: "var(--green, #1cb97a)",
                        }}
                      >
                        Photo attached ✓
                      </p>
                      {/* FIX #5: CSS hover via .wr-remove-photo — no DOM mutation */}
                      <button
                        type="button"
                        aria-label="Remove photo"
                        className="wr-remove-photo"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFormData({
                            ...formData,
                            photo: null,
                          });
                          (
                            document.getElementById(
                              "photo-upload",
                            ) as HTMLInputElement
                          ).value = "";
                        }}
                      >
                        <X
                          size={11}
                          color="#c53030"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      </button>
                    </>
                  ) : (
                    <>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#4a5568",
                        }}
                      >
                        Click to upload a photo
                      </p>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 10.5,
                          color: "#aab0bb",
                        }}
                      >
                        PNG, JPG up to 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* ── Footer actions ──
              FIX #10: The footer now lives as a natural last child of .wr-body,
              wrapped in a card-like div. No negative margins needed. */}
          <div
            className="wr-form-footer"
            style={{
              border: "1px solid #dde1e7",
              borderRadius: 8,
              marginTop: -2,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "#aab0bb",
              }}
            >
              <span className="wr-required">*</span> Required
              fields
            </p>
            <button type="submit" className="wr-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={13} style={{ animation: "wr-spin 0.8s linear infinite" }} />
                  Submitting…
                </>
              ) : (
                <>
                  <FileText size={13} aria-hidden="true" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}