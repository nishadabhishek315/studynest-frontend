import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { logout as apiLogout } from '../../api/auth.api';

const NAV = [
  { label: 'Dashboard',     icon: '⊞', to: '/dashboard' },
  { label: 'Members',       icon: '👥', to: '/members' },
  { label: 'Seat Map',      icon: '🗺', to: '/seats' },
  { label: 'Billing',       icon: '💳', to: '/billing' },
];

const ADMIN_NAV = [
  { label: 'Reports',       icon: '📊', to: '/reports' },
  { label: 'Notifications', icon: '🔔', to: '/notifications' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const avatarColors = ['#1A5F6A', '#C9A84C', '#C0392B', '#2C3E50'];
  const avatarColor  = avatarColors[(user?.name?.charCodeAt(0) || 0) % avatarColors.length];
  const initials     = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside style={{
      width: 220, background: '#0D0D0D',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto', zIndex: 100,
      borderRight: '1px solid rgba(201,168,76,0.1)',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', color: '#C9A84C', fontSize: '1.3rem', fontWeight: 600 }}>
          📚 StudyNest
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', marginTop: 2 }}>
          Library Management
        </div>
      </div>

      {/* Main nav */}
      <div style={{ padding: '16px 12px 8px' }}>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 8px', marginBottom: 6 }}>
          Main
        </div>
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8,
              color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.45)',
              fontSize: '0.82rem', cursor: 'pointer',
              transition: 'all 0.15s', marginBottom: 2,
              textDecoration: 'none', fontWeight: isActive ? 500 : 400,
              background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
              borderLeft: isActive ? '2px solid #C9A84C' : '2px solid transparent',
            })}
          >
            <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Admin nav */}
      <div style={{ padding: '8px 12px' }}>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 8px', marginBottom: 6 }}>
          Admin
        </div>
        {ADMIN_NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8,
              color: isActive ? '#C9A84C' : 'rgba(255,255,255,0.45)',
              fontSize: '0.82rem', cursor: 'pointer',
              transition: 'all 0.15s', marginBottom: 2,
              textDecoration: 'none', fontWeight: isActive ? 500 : 400,
              background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
              borderLeft: isActive ? '2px solid #C9A84C' : '2px solid transparent',
            })}
          >
            <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Bottom: user + logout */}
      <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ color: '#7A7A6E', fontSize: '0.68rem', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', marginTop: 8, padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          ↪ Sign out
        </button>
      </div>
    </aside>
  );
}
