const STYLES = {
  active:      { bg: 'rgba(26,106,74,0.1)',  color: '#1A6A4A', dot: '#1A6A4A' },
  expired:     { bg: 'rgba(192,57,43,0.1)',  color: '#C0392B', dot: '#C0392B' },
  suspended:   { bg: 'rgba(0,0,0,0.07)',     color: '#7A7A6E', dot: '#7A7A6E' },
  pending:     { bg: 'rgba(201,168,76,0.15)',color: '#8a6d00', dot: '#C9A84C' },
  available:   { bg: 'rgba(26,106,74,0.1)',  color: '#1A6A4A', dot: '#1A6A4A' },
  occupied:    { bg: 'rgba(201,168,76,0.18)',color: '#8a6d00', dot: '#C9A84C' },
  reserved:    { bg: 'rgba(26,95,106,0.12)', color: '#1A5F6A', dot: '#1A5F6A' },
  maintenance: { bg: 'rgba(0,0,0,0.06)',     color: '#7A7A6E', dot: '#7A7A6E' },
  paid:        { bg: 'rgba(26,106,74,0.1)',  color: '#1A6A4A', dot: '#1A6A4A' },
  failed:      { bg: 'rgba(192,57,43,0.1)',  color: '#C0392B', dot: '#C0392B' },
  admin:       { bg: 'rgba(201,168,76,0.15)',color: '#8a6d00', dot: '#C9A84C' },
  staff:       { bg: 'rgba(26,95,106,0.12)', color: '#1A5F6A', dot: '#1A5F6A' },
};

export default function Badge({ status, label }) {
  const s = STYLES[status] || STYLES.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.7rem', fontWeight: 500,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {label || status}
    </span>
  );
}
