/**
 * Elegant dual-ring spinner — gold outer ring, teal inner ring.
 *
 * Props:
 *   text     — label shown below the rings  (default: 'Loading…')
 *   fullPage — centers vertically in the page area (use for top-level page loading)
 *   size     — outer diameter in px  (default: 48)
 */
export default function Loader({ text = 'Loading…', fullPage = false, size = 48 }) {
  const half  = size / 2;
  const third = Math.round(size / 3);

  const rings = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Spinner */}
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Outer ring — gold, clockwise */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: `3px solid rgba(201,168,76,0.15)`,
          borderTopColor: '#C9A84C',
          animation: 'sn-spin 0.8s linear infinite',
        }} />
        {/* Inner ring — teal, counter-clockwise */}
        <div style={{
          position: 'absolute',
          inset: Math.round(size * 0.18),
          borderRadius: '50%',
          border: `2px solid rgba(26,95,106,0.15)`,
          borderBottomColor: '#1A5F6A',
          animation: 'sn-spin 0.55s linear infinite reverse',
        }} />
        {/* Centre dot */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 5, height: 5,
          borderRadius: '50%',
          background: '#C9A84C',
          opacity: 0.7,
        }} />
      </div>

      {/* Label */}
      {text && (
        <span style={{
          color: '#7A7A6E',
          fontSize: '0.8rem',
          letterSpacing: '0.04em',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '65vh',
      }}>
        {rings}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 180,
    }}>
      {rings}
    </div>
  );
}
