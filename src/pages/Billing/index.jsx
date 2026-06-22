import { useEffect, useState, useCallback } from "react";
import {
  getPayments,
  getRevenueSummary,
  createPayment,
  downloadInvoice,
} from "../../api/billing.api";
import { getMembers } from "../../api/members.api";
import { getPlans } from "../../api/plans.api";
import { getSeats, assignSeat } from "../../api/seats.api";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/ui/StatCard";
import Modal from "../../components/ui/Modal";
import Loader from "../../components/ui/Loader";

const EMPTY_FORM = {
  memberId: "",
  planId: "",
  method: "cash",
  amount: "",
  notes: "",
  transactionRef: "",
};

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
  maintenance: {
    bg: "rgba(0,0,0,0.06)",
    color: "#7A7A6E",
    border: "rgba(0,0,0,0.12)",
  },
};

export default function Billing() {
  // ── list state ──
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // ── modal state ──
  const [modal, setModal] = useState(false);
  const [step, setStep] = useState(1); // 1 = payment form, 2 = seat assignment

  // step-1 form
  const [form, setForm] = useState(EMPTY_FORM);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  // step-2 seat assignment
  const [paidMember, setPaidMember] = useState(null); // { _id, name, memberId }
  const [availSeats, setAvailSeats] = useState([]);
  const [seatZone, setSeatZone] = useState("A");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedShift, setSelectedShift] = useState("full_day");
  const [assigning, setAssigning] = useState(false);
  const [pageToast, setPageToast] = useState(""); // page-level transient error

  // ── load payments ──
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getPayments({ page, limit: 15 }), getRevenueSummary()])
      .then(([p, s]) => {
        setPayments(p.data.payments);
        setTotal(p.data.total);
        setSummary(s.data.summary);
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  // ── open modal ──
  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormErr("");
    setStep(1);
    setPaidMember(null);
    setSelectedSeat(null);
    setModal(true);
    // load all members (any status) + plans in parallel
    Promise.all([
      getMembers({ limit: 200 }), // no status filter — show everyone
      getPlans(),
    ])
      .then(([m, p]) => {
        setMembers(m.data.members);
        setPlans(p.data.plans);
      })
      .catch(console.error);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePlanChange = (e) => {
    const planId = e.target.value;
    const picked = plans.find((p) => p._id === planId);
    setForm((f) => ({
      ...f,
      planId,
      amount: picked ? String(picked.price) : f.amount,
    }));
  };

  // Returns available shifts for a given seat
  const availableShifts = (seat) => {
    if (!seat || seat.status === "maintenance" || seat.status === "reserved") {
      return [];
    }
    const morningFree = !seat.slots?.morning?.occupiedBy;
    const eveningFree = !seat.slots?.evening?.occupiedBy;
    const options = [];
    if (morningFree) options.push("morning");
    if (eveningFree) options.push("evening");
    if (morningFree && eveningFree) options.push("full_day");
    return options;
  };

  // ── Step 1: Record payment ──
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setFormErr("");
    setSaving(true);
    try {
      const { data } = await createPayment({
        memberId: form.memberId,
        planId: form.planId,
        method: form.method,
        amount: Number(form.amount) || 0,
        notes: form.notes,
        transactionRef: form.transactionRef,
      });

      // Payment done — member is now active.
      // Move to step 2: seat assignment
      const member = data.payment.memberId; // populated { _id, name, memberId }
      setPaidMember(member);

      // Load available seats for assignment
      const seatsRes = await getSeats({ status: "available" });
      setAvailSeats(seatsRes.data.seats);
      setSeatZone("A");
      setSelectedSeat(null);
      setSelectedShift("full_day");
      setStep(2);
      load(); // refresh payment list in background
    } catch (err) {
      setFormErr(err.response?.data?.message || "Payment failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Step 2: Assign seat ──
  const handleAssignSeat = async () => {
    if (!selectedSeat) return;
    setAssigning(true);
    try {
      await assignSeat(selectedSeat._id, paidMember._id, selectedShift);
      setModal(false);
      load();
    } catch (err) {
      setFormErr(err.response?.data?.message || "Seat assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  const handleSkipSeat = () => {
    setModal(false);
  };

  // ── Download PDF ──
  const handleDownload = async (id, invoiceNo) => {
    try {
      const res = await downloadInvoice(id);
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setPageToast("Failed to download PDF. Please try again.");
      setTimeout(() => setPageToast(""), 4000);
    }
  };

  const totalPages = Math.ceil(total / 15);
  const filteredSeats = availSeats.filter((s) => s.zone === seatZone);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Billing</h1>
          <p>{total} total payments</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-gold" onClick={openModal}>
            + Record Payment
          </button>
        </div>
      </div>

      {/* Page-level transient error (e.g. PDF download) */}
      {pageToast && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: 16,
            borderRadius: 8,
            background: "rgba(192,57,43,0.08)",
            border: "1px solid rgba(192,57,43,0.25)",
            color: "#C0392B",
            fontSize: "0.82rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span>{pageToast}</span>
          <button
            onClick={() => setPageToast("")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#C0392B",
              fontWeight: 700,
              fontSize: "1rem",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Summary stats */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <StatCard
            label="This Month"
            value={`₹${(summary.monthlyRevenue || 0).toLocaleString("en-IN")}`}
            icon="📈"
            accent="gold"
          />
          <StatCard
            label="This Year"
            value={`₹${(summary.yearlyRevenue || 0).toLocaleString("en-IN")}`}
            icon="💰"
            accent="teal"
          />
          <StatCard
            label="Total Invoices"
            value={summary.totalPayments || 0}
            icon="🧾"
            accent="success"
          />
          <StatCard
            label="Avg / Invoice"
            value={
              summary.totalPayments
                ? `₹${Math.round(summary.yearlyRevenue / summary.totalPayments).toLocaleString("en-IN")}`
                : "—"
            }
            icon="📊"
            accent="gold"
          />
        </div>
      )}

      {/* Payments table */}
      <div className="card">
        {loading ? (
          <Loader text="Loading payments…" />
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🧾</div>
            <div>No payments yet</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "0.72rem",
                      }}
                    >
                      {p.invoiceNo}
                    </td>
                    <td>
                      <div className="member-name">{p.memberId?.name}</div>
                      <div className="member-id">{p.memberId?.memberId}</div>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "#7A7A6E" }}>
                      {p.planId?.name}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      ₹{p.totalAmount?.toLocaleString("en-IN")}
                    </td>
                    <td
                      style={{
                        textTransform: "capitalize",
                        fontSize: "0.78rem",
                      }}
                    >
                      {p.method}
                    </td>
                    <td style={{ fontSize: "0.72rem", color: "#7A7A6E" }}>
                      {new Date(p.periodStart).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                      {" – "}
                      {new Date(p.periodEnd).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                      })}
                    </td>
                    <td>
                      <Badge status={p.status} />
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDownload(p._id, p.invoiceNo)}
                      >
                        ⬇ PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              padding: "16px 22px",
            }}
          >
            <button
              className="btn btn-outline btn-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span
              style={{
                alignSelf: "center",
                fontSize: "0.82rem",
                color: "#7A7A6E",
              }}
            >
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ═══ MODAL ═══ */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={
          step === 1 ? "Record Payment" : "✅ Payment Recorded — Assign Seat"
        }
        width={step === 2 ? 560 : 500}
      >
        {/* ── STEP 1: Payment form ── */}
        {step === 1 && (
          <form onSubmit={handleCreatePayment}>
            <div className="form-group">
              <label>Member *</label>
              <select
                className="form-input"
                value={form.memberId}
                onChange={set("memberId")}
                required
              >
                <option value="">Select member…</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.memberId}) — {m.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Plan *</label>
              <select
                className="form-input"
                value={form.planId}
                onChange={handlePlanChange}
                required
              >
                <option value="">Select plan…</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ₹{p.price}/mo
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Amount (₹) *
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: "0.75rem",
                    color: "#7A7A6E",
                    marginLeft: 6,
                  }}
                >
                  — auto-filled from plan, edit for custom amount
                </span>
              </label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={form.amount}
                onChange={set("amount")}
                placeholder="Select a plan or enter custom amount"
                required
              />
            </div>
            <div className="form-group">
              <label>Payment Method *</label>
              <select
                className="form-input"
                value={form.method}
                onChange={set("method")}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div className="form-group">
              <label>Transaction Reference</label>
              <input
                className="form-input"
                value={form.transactionRef}
                onChange={set("transactionRef")}
                placeholder="UPI/card ref number"
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input
                className="form-input"
                value={form.notes}
                onChange={set("notes")}
                placeholder="Optional notes"
              />
            </div>
            {formErr && (
              <div
                style={{
                  color: "#C0392B",
                  fontSize: "0.82rem",
                  marginBottom: 12,
                }}
              >
                {formErr}
              </div>
            )}
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? "Processing…" : "Record Payment →"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: Seat assignment ── */}
        {step === 2 && paidMember && (
          <div>
            {/* Success banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(26,106,74,0.08)",
                border: "1px solid rgba(26,106,74,0.2)",
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>✅</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                  {paidMember.name} is now an active member!
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#7A7A6E",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {paidMember.memberId}
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: "0.84rem",
                color: "#2C3E50",
                marginBottom: 14,
                fontWeight: 500,
              }}
            >
              Assign a seat (optional):
            </div>

            {/* Zone tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["A", "B"].map((z) => (
                <button
                  key={z}
                  className={`btn btn-sm ${seatZone === z ? "btn-primary" : "btn-outline"}`}
                  onClick={() => {
                    setSeatZone(z);
                    setSelectedSeat(null);
                  }}
                >
                  Zone {z} ({availSeats.filter((s) => s.zone === z).length}{" "}
                  free)
                </button>
              ))}
            </div>

            {/* Seat grid */}
            {filteredSeats.length === 0 ? (
              <div
                style={{
                  color: "#7A7A6E",
                  fontSize: "0.82rem",
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                No available seats in Zone {seatZone}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${seatZone === "A" ? 7 : 8}, 1fr)`,
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {filteredSeats.map((seat) => {
                  const isSelected = selectedSeat?._id === seat._id;
                  return (
                    <div
                      key={seat._id}
                      onClick={() => {
                        setSelectedSeat(isSelected ? null : seat);
                        if (!isSelected) {
                          // Reset shift to default when selecting a new seat
                          const shifts = availableShifts(seat);
                          setSelectedShift(shifts.includes("full_day") ? "full_day" : shifts[0] || "full_day");
                        }
                      }}
                      title={seat.seatNumber}
                      style={{
                        aspectRatio: "1",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.65rem",
                        fontFamily: "JetBrains Mono, monospace",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.1s",
                        background: isSelected
                          ? "#0D0D0D"
                          : STATUS_COLOR.available.bg,
                        color: isSelected
                          ? "#fff"
                          : STATUS_COLOR.available.color,
                        border: isSelected
                          ? "2px solid #0D0D0D"
                          : `1px solid ${STATUS_COLOR.available.border}`,
                        transform: isSelected ? "scale(1.1)" : "scale(1)",
                        boxShadow: isSelected
                          ? "0 2px 8px rgba(0,0,0,0.2)"
                          : "none",
                      }}
                    >
                      {seat.seatNumber.split("-")[1]}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected seat info */}
            {selectedSeat && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  marginBottom: 14,
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                }}
              >
                Selected: <strong>{selectedSeat.seatNumber}</strong>
                &nbsp;·&nbsp; Zone {selectedSeat.zone}, Floor{" "}
                {selectedSeat.floor}
                &nbsp;·&nbsp;
                {selectedSeat.features?.join(", ")}
              </div>
            )}

            {/* Shift selector */}
            {selectedSeat && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 500, marginBottom: 10, color: "#2C3E50" }}>
                  Choose Shift:
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["morning", "evening", "full_day"].map((shift) => {
                    const available = availableShifts(selectedSeat).includes(shift);
                    const isSelected = selectedShift === shift;
                    const shiftLabels = {
                      morning: "🌅 Morning (7 AM – 2 PM)",
                      evening: "🌆 Evening (2 PM – 9 PM)",
                      full_day: "☀️ Full Day (7 AM – 9 PM)",
                    };
                    return (
                      <button
                        key={shift}
                        onClick={() => available && setSelectedShift(shift)}
                        disabled={!available}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 6,
                          border: isSelected ? "2px solid #1A6A4A" : "1px solid rgba(201,168,76,0.3)",
                          background: isSelected ? "rgba(26,106,74,0.12)" : available ? "transparent" : "rgba(0,0,0,0.04)",
                          color: isSelected ? "#1A6A4A" : available ? "#2C3E50" : "#7A7A6E",
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: "0.75rem",
                          cursor: available ? "pointer" : "not-allowed",
                          opacity: available ? 1 : 0.5,
                          transition: "all 0.15s",
                        }}
                      >
                        {shiftLabels[shift]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button className="btn btn-outline" onClick={handleSkipSeat}>
                Skip for now
              </button>
              <button
                className="btn btn-gold"
                disabled={!selectedSeat || assigning}
                onClick={handleAssignSeat}
              >
                {assigning
                  ? "Assigning…"
                  : `Assign ${selectedSeat?.seatNumber || "Seat"} · ${selectedShift === "full_day" ? "Full Day" : selectedShift.charAt(0).toUpperCase() + selectedShift.slice(1)}`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
