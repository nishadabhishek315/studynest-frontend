import { useCallback, useEffect, useState } from "react";
import {
  getSeats,
  getSeatStats,
  assignSeat,
  releaseSeat,
  updateSeat,
} from "../api/seats.api";
import { getMembers } from "../api/members.api";
import Badge from "../components/ui/Badge";
import Loader from "../components/ui/Loader";
import Modal from "../components/ui/Modal";

// ── Constants ──────────────────────────────────────────────────────────────

const SLOTS = {
  morning: { label: "Morning", time: "7 AM – 2 PM" },
  evening: { label: "Evening", time: "2 PM – 9 PM" },
  full_day: { label: "Full Day", time: "7 AM – 9 PM" },
};

const STATUS_COLOR = {
  available: {
    bg: "rgba(26,106,74,0.12)",
    color: "#1A6A4A",
    border: "rgba(26,106,74,0.25)",
  },
  occupied: {
    bg: "rgba(184,115,51,0.22)",
    color: "#7a4a00",
    border: "rgba(184,115,51,0.5)",
  },
  partial: {
    bg: "transparent",
    color: "#8a6d00",
    border: "rgba(201,168,76,0.45)",
  },
  reserved: {
    bg: "rgba(26,95,106,0.15)",
    color: "#1A5F6A",
    border: "rgba(26,95,106,0.3)",
  },
  maintenance: {
    bg: "rgba(0,0,0,0.06)",
    color: "#7A7A6E",
    border: "rgba(0,0,0,0.12)",
  },
};

const SLOT_OCCUPIED = { background: "#d4b483", color: "#6b3c00" };
const SLOT_FREE = { background: "#a3c4b0", color: "#1A6A4A" };

const ZONE_COLS = { A: 7, B: 8 };
const ZONES = ["A", "B"];

// ── Sub-components ─────────────────────────────────────────────────────────

/** Split tile: top half = morning, bottom half = evening */
function SplitTile({ mOcc, eOcc, seatNum }) {
  const mStyle = mOcc ? SLOT_OCCUPIED : SLOT_FREE;
  const eStyle = eOcc ? SLOT_OCCUPIED : SLOT_FREE;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 7,
      }}
    >
      <div
        style={{
          flex: 1,
          ...mStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 5px",
          borderBottom: "1px dashed rgba(0,0,0,0.12)",
          fontSize: "0.56rem",
          fontWeight: 700,
        }}
      >
        <span style={{ fontSize: "0.42rem", opacity: 0.7, fontWeight: 600 }}>
          M
        </span>
        <span>{seatNum}</span>
      </div>
      <div
        style={{
          flex: 1,
          ...eStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 5px",
          fontSize: "0.56rem",
          fontWeight: 700,
        }}
      >
        <span style={{ fontSize: "0.42rem", opacity: 0.7, fontWeight: 600 }}>
          E
        </span>
        {eOcc && <span style={{ fontSize: "0.5rem" }}>●</span>}
      </div>
    </div>
  );
}

/** Tile content — keeps render logic out of the grid map */
function SeatTileContent({ seat }) {
  const num = seat.seatNumber.split("-")[1];
  const mOcc = seat.slots?.morning?.occupiedBy;
  const eOcc = seat.slots?.evening?.occupiedBy;

  if (seat.status === "partial") {
    return <SplitTile mOcc={mOcc} eOcc={eOcc} seatNum={num} />;
  }
  if (seat.status === "occupied") {
    if (seat.occupiedBy) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <span style={{ fontSize: "0.62rem", fontWeight: 700 }}>{num}</span>
          <span
            style={{
              fontSize: "0.38rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              background: "rgba(184,115,51,0.25)",
              borderRadius: 3,
              padding: "1px 4px",
            }}
          >
            FD
          </span>
        </div>
      );
    }
    return <SplitTile mOcc={mOcc} eOcc={eOcc} seatNum={num} />;
  }
  return num;
}

/** Hover card — fixed-position card shown on mouse-enter */
function HoverCard({ data }) {
  if (!data) return null;
  const { seat, rect } = data;

  const mOcc = seat.slots?.morning?.occupiedBy;
  const eOcc = seat.slots?.evening?.occupiedBy;
  const isFullDay = !!seat.occupiedBy;

  // Full-day: one row; otherwise show morning + evening
  const rows = isFullDay
    ? [
        {
          key: "full_day",
          slotInfo: SLOTS.full_day,
          occupant: mOcc ?? seat.occupiedBy,
        },
      ]
    : [
        { key: "morning", slotInfo: SLOTS.morning, occupant: mOcc },
        { key: "evening", slotInfo: SLOTS.evening, occupant: eOcc },
      ];

  const statusLabel = isFullDay
    ? "Full Day"
    : seat.status === "partial"
      ? "Half-Day"
      : seat.status === "available"
        ? "Available"
        : seat.status;

  const statusStyle = {
    fontSize: "0.62rem",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    background:
      seat.status === "available"
        ? "rgba(26,106,74,0.1)"
        : seat.status === "occupied"
          ? "rgba(184,115,51,0.15)"
          : seat.status === "partial"
            ? "rgba(201,168,76,0.12)"
            : "rgba(0,0,0,0.06)",
    color:
      seat.status === "available"
        ? "#1A6A4A"
        : seat.status === "occupied"
          ? "#7a4a00"
          : seat.status === "partial"
            ? "#8a6d00"
            : "#7A7A6E",
  };

  const CARD_W = 210;
  const left = Math.max(
    8,
    Math.min(
      rect.left + rect.width / 2 - CARD_W / 2,
      window.innerWidth - CARD_W - 8,
    ),
  );
  const top = rect.top - 8;

  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        transform: "translateY(-100%)",
        zIndex: 1500,
        width: CARD_W,
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 8px 28px rgba(0,0,0,0.16)",
        border: "1px solid rgba(201,168,76,0.25)",
        padding: "12px 14px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 700,
            fontSize: "0.82rem",
          }}
        >
          {seat.seatNumber}
        </span>
        <span style={statusStyle}>{statusLabel}</span>
      </div>

      {rows.map(({ key, slotInfo, occupant }) => (
        <div
          key={key}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              flexShrink: 0,
              marginTop: 4,
              background: occupant
                ? "rgba(201,168,76,0.8)"
                : "rgba(26,106,74,0.5)",
            }}
          />
          <div>
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 600,
                color: "#2C3E50",
                lineHeight: 1.2,
              }}
            >
              {slotInfo.label}
              <span
                style={{ color: "#7A7A6E", fontWeight: 400, marginLeft: 4 }}
              >
                {slotInfo.time}
              </span>
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: occupant ? "#2C3E50" : "#1A6A4A",
                fontWeight: occupant ? 600 : 400,
              }}
            >
              {occupant ? occupant.name : "Free"}
            </div>
            {occupant && (
              <div
                style={{
                  fontSize: "0.62rem",
                  color: "#7A7A6E",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {occupant.memberId}
              </div>
            )}
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: 8,
          fontSize: "0.62rem",
          color: "#7A7A6E",
          textAlign: "center",
        }}
      >
        Click to manage
      </div>
    </div>
  );
}

/** Slot card inside the seat management modal */
function SlotCard({ sl, occupant, saving, onRelease, isMaintenance }) {
  const slotInfo = SLOTS[sl];
  const taken = !!occupant;
  return (
    <div
      style={{
        flex: 1,
        padding: "10px 12px",
        borderRadius: 8,
        background: taken ? "rgba(201,168,76,0.1)" : "rgba(26,106,74,0.08)",
        border: `1px solid ${taken ? "rgba(201,168,76,0.35)" : "rgba(26,106,74,0.2)"}`,
      }}
    >
      <div
        style={{
          fontSize: "0.65rem",
          fontWeight: 700,
          color: taken ? "#8a6d00" : "#1A6A4A",
          marginBottom: 2,
        }}
      >
        {slotInfo.label}
      </div>
      <div style={{ fontSize: "0.62rem", color: "#7A7A6E", marginBottom: 6 }}>
        {slotInfo.time}
      </div>
      {taken ? (
        <>
          <div style={{ fontSize: "0.72rem", fontWeight: 600 }}>
            {occupant.name}
          </div>
          <div
            style={{
              fontSize: "0.65rem",
              color: "#7A7A6E",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {occupant.memberId}
          </div>
          {!isMaintenance && (
            <button
              className="btn btn-outline"
              disabled={saving}
              onClick={() => onRelease(sl)}
              style={{
                marginTop: 8,
                padding: "3px 10px",
                fontSize: "0.7rem",
                width: "100%",
              }}
            >
              Release
            </button>
          )}
        </>
      ) : (
        <div style={{ fontSize: "0.7rem", color: "#1A6A4A" }}>Free</div>
      )}
    </div>
  );
}

/** Inline dismissible error banner */
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      style={{
        padding: "10px 14px",
        marginBottom: 16,
        borderRadius: 8,
        background: "rgba(192,57,43,0.08)",
        border: "1px solid rgba(192,57,43,0.25)",
        color: "#C0392B",
        fontSize: "0.78rem",
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontWeight: 700, flexShrink: 0 }}>✕</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#C0392B",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

/** Inline release confirmation panel */
function ReleaseConfirm({ slot, seatNumber, saving, onConfirm, onCancel }) {
  if (!slot) return null;
  const desc =
    slot === "all"
      ? `Release all slots for seat ${seatNumber}?`
      : `Release the ${SLOTS[slot].label} slot (${SLOTS[slot].time}) for seat ${seatNumber}?`;
  return (
    <div
      style={{
        padding: "12px 14px",
        marginBottom: 16,
        borderRadius: 8,
        background: "rgba(201,168,76,0.1)",
        border: "1px solid rgba(201,168,76,0.35)",
      }}
    >
      <div style={{ fontSize: "0.78rem", fontWeight: 600, marginBottom: 10 }}>
        {desc}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-gold"
          disabled={saving}
          onClick={onConfirm}
          style={{ flex: 1 }}
        >
          {saving ? "Releasing…" : "Confirm Release"}
        </button>
        <button
          className="btn btn-outline"
          disabled={saving}
          onClick={onCancel}
          style={{ flex: 1 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Legend swatch + label */
function LegendItem({ children, swatch }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: "0.78rem",
        color: "#2C3E50",
      }}
    >
      {swatch}
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function SeatMap() {
  const [seats, setSeats] = useState([]);
  const [stats, setStats] = useState(null);
  const [zone, setZone] = useState("A");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [assignId, setAssignId] = useState("");
  const [assignSlot, setAssignSlot] = useState("full_day");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [pendingRelease, setPendingRelease] = useState(null);
  const [hoverCard, setHoverCard] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getSeats(), getSeatStats()])
      .then(([s, st]) => {
        setSeats(s.data.seats);
        setStats(st.data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeModal = useCallback(() => {
    setModal(false);
    setModalError("");
    setPendingRelease(null);
    setSaving(false);
  }, []);

  const openSeat = useCallback((seat) => {
    const morningFree = !seat.slots?.morning?.occupiedBy;
    const eveningFree = !seat.slots?.evening?.occupiedBy;
    setSelected(seat);
    setAssignId("");
    setModalError("");
    setPendingRelease(null);
    setAssignSlot(
      morningFree && eveningFree
        ? "full_day"
        : morningFree
          ? "morning"
          : eveningFree
            ? "evening"
            : "full_day",
    );
    setModal(true);
    if (morningFree || eveningFree) {
      getMembers({ status: "active", limit: 200 })
        .then((r) => setMembers(r.data.members))
        .catch(() => {});
    }
  }, []);

  // Returns bookable slots for a given seat
  const availableSlots = useCallback((seat) => {
    if (!seat || seat.status === "maintenance" || seat.status === "reserved")
      return [];
    const morningFree = !seat.slots?.morning?.occupiedBy;
    const eveningFree = !seat.slots?.evening?.occupiedBy;
    const options = [];
    if (morningFree) options.push("morning");
    if (eveningFree) options.push("evening");
    if (morningFree && eveningFree) options.push("full_day");
    return options;
  }, []);

  const handleAssign = useCallback(async () => {
    if (!assignId) return;
    setModalError("");
    setSaving(true);
    try {
      await assignSeat(selected._id, assignId, assignSlot);
      closeModal();
      load();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to assign seat");
    } finally {
      setSaving(false);
    }
  }, [assignId, assignSlot, selected, closeModal, load]);

  const handleRelease = useCallback((slot) => {
    setPendingRelease(slot ?? "all");
    setModalError("");
  }, []);

  const handleReleaseConfirm = useCallback(async () => {
    const slot = pendingRelease === "all" ? undefined : pendingRelease;
    setSaving(true);
    setPendingRelease(null);
    try {
      await releaseSeat(selected._id, slot);
      closeModal();
      load();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to release seat");
    } finally {
      setSaving(false);
    }
  }, [pendingRelease, selected, closeModal, load]);

  const handleMaintenance = useCallback(async () => {
    const next =
      selected.status === "maintenance" ? "available" : "maintenance";
    setSaving(true);
    try {
      await updateSeat(selected._id, { status: next });
      closeModal();
      load();
    } catch {
      setSaving(false);
    }
  }, [selected, closeModal, load]);

  const zoneSeats = seats.filter((s) => s.zone === zone);
  const cols = ZONE_COLS[zone] ?? 8;
  const freeSlots = availableSlots(selected);

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1>Seat Map</h1>
          <p>
            {stats
              ? `${stats.occupied + (stats.partial || 0)}/${stats.total} occupied · ${stats.available} available`
              : "Loading…"}
          </p>
        </div>
        <div className="header-actions">
          {ZONES.map((z) => (
            <button
              key={z}
              className={`btn ${zone === z ? "btn-primary" : "btn-outline"}`}
              onClick={() => setZone(z)}
            >
              Zone {z} 
              <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>
                ({z === "A" ? 28 : 32} seats)
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <LegendItem
          swatch={
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: STATUS_COLOR.available.bg,
                border: `1px solid ${STATUS_COLOR.available.border}`,
                display: "inline-block",
              }}
            />
          }
        >
          Available
        </LegendItem>
        <LegendItem
          swatch={
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: STATUS_COLOR.occupied.bg,
                border: `1px solid ${STATUS_COLOR.occupied.border}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.38rem",
                fontWeight: 700,
                color: STATUS_COLOR.occupied.color,
              }}
            >
              FD
            </span>
          }
        >
          Full Day (1 member)
        </LegendItem>
        <LegendItem
          swatch={
            <span
              style={{
                width: 14,
                height: 28,
                borderRadius: 3,
                overflow: "hidden",
                display: "inline-flex",
                flexDirection: "column",
                border: `1px solid ${STATUS_COLOR.partial.border}`,
              }}
            >
              <span style={{ flex: 1, background: SLOT_OCCUPIED.background }} />
              <span style={{ flex: 1, background: SLOT_OCCUPIED.background }} />
            </span>
          }
        >
          Both Slots (2 members)
        </LegendItem>
        <LegendItem
          swatch={
            <span
              style={{
                width: 14,
                height: 28,
                borderRadius: 3,
                overflow: "hidden",
                display: "inline-flex",
                flexDirection: "column",
                border: `1px solid ${STATUS_COLOR.partial.border}`,
              }}
            >
              <span style={{ flex: 1, background: SLOT_OCCUPIED.background }} />
              <span style={{ flex: 1, background: SLOT_FREE.background }} />
            </span>
          }
        >
          Half-Day (M=top, E=bottom)
        </LegendItem>
        <LegendItem
          swatch={
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: STATUS_COLOR.maintenance.bg,
                border: `1px solid ${STATUS_COLOR.maintenance.border}`,
                display: "inline-block",
              }}
            />
          }
        >
          Maintenance
        </LegendItem>
        <LegendItem
          swatch={
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: STATUS_COLOR.reserved.bg,
                border: `1px solid ${STATUS_COLOR.reserved.border}`,
                display: "inline-block",
              }}
            />
          }
        >
          Reserved
        </LegendItem>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="stats-grid" style={{ gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total", value: stats.total, color: "#2C3E50" },
            { label: "Full Occupied", value: stats.occupied, color: "#C9A84C" },
            { label: "Half-Day", value: stats.partial || 0, color: "#b87333" },
            { label: "Available", value: stats.available, color: "#1A6A4A" },
            {
              label: "Maintenance",
              value: stats.maintenance,
              color: "#7A7A6E",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="card"
              style={{ padding: "14px 18px" }}
            >
              <div
                style={{
                  fontSize: "0.68rem",
                  textTransform: "uppercase",
                  color: "#7A7A6E",
                  letterSpacing: "0.08em",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: s.color,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Seat grid ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Zone {zone} &mdash; Floor {zone === "A" ? 0 : 1}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#7A7A6E" }}>
            Click a seat to manage it
          </span>
        </div>
        <div className="card-body">
          {loading ? (
            <Loader text="Loading seats…" />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 10,
              }}
            >
              {zoneSeats.map((seat) => {
                const s = STATUS_COLOR[seat.status] ?? STATUS_COLOR.available;
                const isSplit =
                  seat.status === "partial" ||
                  (seat.status === "occupied" && !seat.occupiedBy);
                return (
                  <div
                    key={seat._id}
                    onClick={() => openSeat(seat)}
                    onMouseEnter={(e) =>
                      setHoverCard({
                        seat,
                        rect: e.currentTarget.getBoundingClientRect(),
                      })
                    }
                    onMouseLeave={() => setHoverCard(null)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "scale(1.12)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.12)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.65rem",
                      fontFamily: "JetBrains Mono, monospace",
                      cursor: "pointer",
                      transition: "transform 0.1s, box-shadow 0.1s",
                      background: isSplit ? "transparent" : s.bg,
                      color: s.color,
                      border: `1px solid ${s.border}`,
                      fontWeight: 600,
                      overflow: "hidden",
                      padding: 0,
                    }}
                  >
                    <SeatTileContent seat={seat} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Hover card ── */}
      <HoverCard data={hoverCard} />

      {/* ── Seat management modal ── */}
      <Modal
        open={modal}
        onClose={closeModal}
        title={`Seat ${selected?.seatNumber}`}
        width={460}
      >
        {selected && (
          <div>
            <ErrorBanner
              message={modalError}
              onDismiss={() => setModalError("")}
            />
            <ReleaseConfirm
              slot={pendingRelease}
              seatNumber={selected.seatNumber}
              saving={saving}
              onConfirm={handleReleaseConfirm}
              onCancel={() => setPendingRelease(null)}
            />

            {/* Zone / Status */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#7A7A6E",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Zone / Floor
                </div>
                <div style={{ fontWeight: 600 }}>
                  Zone {selected.zone} · Floor {selected.floor}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#7A7A6E",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Status
                </div>
                <Badge status={selected.status} />
              </div>
            </div>

            {/* Features */}
            {selected.features?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#7A7A6E",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Features
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selected.features.map((f) => (
                    <span
                      key={f}
                      style={{
                        padding: "2px 10px",
                        borderRadius: 20,
                        background: "rgba(26,95,106,0.1)",
                        color: "#1A5F6A",
                        fontSize: "0.72rem",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Slot occupancy */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "#7A7A6E",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Slot Occupancy
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {["morning", "evening"].map((sl) => (
                  <SlotCard
                    key={sl}
                    sl={sl}
                    occupant={selected.slots?.[sl]?.occupiedBy}
                    saving={saving}
                    onRelease={handleRelease}
                    isMaintenance={selected.status === "maintenance"}
                  />
                ))}
              </div>
            </div>

            {/* Assign form */}
            {freeSlots.length > 0 && selected.status !== "maintenance" && (
              <div style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label>Slot</label>
                  <select
                    className="form-input"
                    value={assignSlot}
                    onChange={(e) => setAssignSlot(e.target.value)}
                  >
                    {freeSlots.map((sl) => (
                      <option key={sl} value={sl}>
                        {SLOTS[sl].label} ({SLOTS[sl].time})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign to Member</label>
                  <select
                    className="form-input"
                    value={assignId}
                    onChange={(e) => setAssignId(e.target.value)}
                  >
                    <option value="">Select member…</option>
                    {members.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.memberId})
                      </option>
                    ))}
                  </select>
                  {members.length === 0 && (
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "#7A7A6E",
                        marginTop: 6,
                      }}
                    >
                      No active members found.
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-gold"
                  disabled={!assignId || saving}
                  onClick={handleAssign}
                  style={{ width: "100%" }}
                >
                  {saving && assignId ? "Assigning…" : "✓ Assign Seat"}
                </button>
              </div>
            )}

            {/* Release all */}
            {(selected.status === "occupied" ||
              selected.status === "partial") && (
              <button
                className="btn btn-outline"
                disabled={saving}
                onClick={() => handleRelease(undefined)}
                style={{ width: "100%", marginBottom: 10 }}
              >
                {saving ? "Releasing…" : "Release All Slots"}
              </button>
            )}

            {/* Maintenance toggle */}
            {selected.status !== "occupied" &&
              selected.status !== "partial" && (
                <button
                  className="btn btn-outline"
                  disabled={saving}
                  onClick={handleMaintenance}
                  style={{ width: "100%" }}
                >
                  {selected.status === "maintenance"
                    ? "✓ Mark as Available"
                    : "🔧 Mark as Maintenance"}
                </button>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
