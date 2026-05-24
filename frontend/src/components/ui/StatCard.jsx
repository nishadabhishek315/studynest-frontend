const ACCENT = { gold: '#C9A84C', teal: '#1A5F6A', danger: '#C0392B', success: '#1A6A4A' };

export default function StatCard({ label, value, sub, icon, accent = 'gold', trend, trendUp }) {
  const color = ACCENT[accent] || ACCENT.gold;
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 22px',
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: color,
      }} />
      {icon && (
        <span style={{ position: 'absolute', right: 18, top: 18, fontSize: '1.5rem', opacity: 0.15 }}>
          {icon}
        </span>
      )}
      <div style={{ color: '#7A7A6E', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '2.4rem', fontWeight: 700, color: '#0D0D0D',
        lineHeight: 1.1, margin: '6px 0 4px',
      }}>
        {value}
      </div>
      {sub && <div style={{ color: '#7A7A6E', fontSize: '0.75rem' }}>{sub}</div>}
      {trend && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: '0.72rem', padding: '2px 7px', borderRadius: 20,
          marginTop: 6,
          background: trendUp ? 'rgba(26,106,74,0.1)' : 'rgba(192,57,43,0.1)',
          color: trendUp ? '#1A6A4A' : '#C0392B',
        }}>
          {trendUp ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
  );
}
