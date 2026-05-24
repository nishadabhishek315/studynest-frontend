import { useEffect, useState } from "react";
import {
  getSeats,
  getSeatStats,
  assignSeat,
  releaseSeat,
  updateSeat,
} from "../api/seats.api";
import { getMembers } from "../api/members.api";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const STATUS_COLOR = {
  available: {
    bg: "rgba(26,106,74,0.12)",
    color: "#1A6A4A",
    border: "rgba(26,106,74,0.25)",
  },
  occupied: {
    bg: "rgba(201,168,76,0.18)",
    color: "#8a6d00",
    border: "rgba(201,168,76,0.35)",
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

// Zone A = 28 seats → 7 cols × 4 rows
// Zone B = 32 seats → 8 cols × 4 rows
const ZONE_COLS = { A: 7, B: 8 };
const ZONES = ["A", "B"];

export default function SeatMap() {
  const [seats, setSeats] = useState([]);
  const [stats, setStats] = useState(null);
  const [zone, setZone] = useState("A");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [assignId, setAssignId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getSeats(), getSeatStats()])
      .then(([s, st]) => {
        setSeats(s.data.seats);
        setStats(st.data.stats);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openSeat = (seat) => {
    setSelected(seat);
    setAssignId("");
    setModal(true);
    if (seat.status !== "occupied") {
      // Show all non-suspended members so pending/active members can be assigned
      getMembers({ limit: 200 })
        .then((r) =>
          setMembers(r.data.members.filter((m) => m.status !== "suspended")),
        )
        .catch(() => {});
    }
  };

  const handleAssign = async () => {
    if (!assignId) return;
    setSaving(true);
    try {
      await assignSeat(selected._id, assignId);
      setModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign seat");
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async () => {
    if (!confirm(`Release seat ${selected.seatNumber}?`)) return;
    setSaving(true);
    try {
      await releaseSeat(selected._id);
      setModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to release seat");
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenance = async () => {
    const next =
      selected.status === "maintenance" ? "available" : "maintenance";
    setSaving(true);
    try {
      await updateSeat(selected._id, { status: next });
      setModal(false);
      load();
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  };

  const zoneSeats = seats.filter((s) => s.zone === zone);
  const cols = ZONE_COLS[zone] || 8;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Seat Map</h1>
          <p>
            {stats
              ? `${stats.occupied}/${stats.total} occupied · ${stats.available} available`
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
              Zone {z} &nbsp;
              <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>
                ({z === "A" ? 28 : 32} seats)
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}
      >
        {Object.entries(STATUS_COLOR).map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: "0.78rem",
              color: "#2C3E50",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: v.bg,
                border: `1px solid ${v.border}`,
                display: "inline-block",
              }}
            />
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </div>
        ))}
      </div>

      {/* Stats row */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: "Total", value: stats.total, color: "#2C3E50" },
            { label: "Occupied", value: stats.occupied, color: "#C9A84C" },
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

      {/* Seat grid */}
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
            <div className="loading">Loading seats…</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 10,
              }}
            >
              {zoneSeats.map((seat) => {
                const s = STATUS_COLOR[seat.status] || STATUS_COLOR.available;
                return (
                  <div
                    key={seat._id}
                    onClick={() => openSeat(seat)}
                    title={`${seat.seatNumber}${seat.occupiedBy ? ` — ${seat.occupiedBy.name}` : ` — ${seat.status}`}`}
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
                      background: s.bg,
                      color: s.color,
                      border: `1px solid ${s.border}`,
                      fontWeight: 600,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "scale(1.12)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.12)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {seat.seatNumber.split("-")[1]}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Seat detail modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`Seat ${selected?.seatNumber}`}
        width={440}
      >
        {selected && (
          <div>
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

            {/* Currently occupied info */}
            {selected.occupiedBy && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(201,168,76,0.08)",
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#7A7A6E",
                    marginBottom: 4,
                  }}
                >
                  OCCUPIED BY
                </div>
                <div style={{ fontWeight: 600 }}>
                  {selected.occupiedBy.name}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#7A7A6E",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {selected.occupiedBy.memberId}
                </div>
              </div>
            )}

            {/* Assign — only for available seats */}
            {selected.status === "available" && (
              <div style={{ marginBottom: 16 }}>
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
                        {m.name} ({m.memberId}) — {m.status}
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
                      No members found.
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-gold"
                  disabled={!assignId || saving}
                  onClick={handleAssign}
                  style={{ width: "100%" }}
                >
                  {saving ? "Assigning…" : "✓ Assign Seat"}
                </button>
              </div>
            )}

            {/* Release — only for occupied seats */}
            {selected.status === "occupied" && (
              <button
                className="btn btn-outline"
                disabled={saving}
                onClick={handleRelease}
                style={{ width: "100%", marginBottom: 10 }}
              >
                {saving ? "Releasing…" : "Release Seat"}
              </button>
            )}

            {/* Maintenance toggle */}
            {selected.status !== "occupied" && (
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
