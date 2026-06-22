import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.api';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth }           = useAuthStore();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await login(form);
      setAuth(data.token, data.refreshToken, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0D',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 80% 20%, rgba(201,168,76,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 10% 80%, rgba(26,95,106,0.15) 0%, transparent 60%)
        `,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 16,
        padding: 'clamp(28px, 6vw, 52px) clamp(20px, 6vw, 48px)',
        width: 'min(420px, calc(100% - 24px))',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: '0 8px 32px rgba(201,168,76,0.3)',
          }}>📚</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: '#fff', fontWeight: 600 }}>
            StudyNest
          </h1>
          <p style={{ color: '#7A7A6E', fontSize: '0.8rem', marginTop: 4 }}>Library Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 7 }}>
              Email
            </label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@studynest.in"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.2)', color: '#fff' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 7 }}>
              Password
            </label>
            <input
              type="password"
              className="form-input"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.2)', color: '#fff' }}
            />
          </div>

          {error && (
            <div style={{ color: '#C0392B', fontSize: '0.8rem', marginBottom: 12, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 13, marginTop: 8,
              background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
              border: 'none', borderRadius: 8,
              color: '#0D0D0D', fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.9rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
          StudyNest v2.1 · Secure Admin Portal
        </div>
      </div>
    </div>
  );
}
