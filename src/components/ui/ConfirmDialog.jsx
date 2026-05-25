/**
 * Reusable inline confirmation dialog (no browser confirm()).
 * Renders on top of everything via fixed overlay.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "24px 24px 20px",
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "0.82rem",
            color: "#7A7A6E",
            marginBottom: 20,
            lineHeight: 1.6,
          }}
        >
          {message}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-gold"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button className="btn btn-outline" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
