import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats } from '../api/reports.api';
import { getRevenueReport } from '../api/reports.api';
import { getExpiringMembers } from '../api/reports.api';
import { getLiveAttendance } from '../api/attendance.api';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Loader from '../components/ui/Loader';
import useAuthStore from '../store/authStore';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [revenue,  setRevenue]  = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [live,     setLive]     = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getRevenueReport({ months: 6 }),
      getExpiringMembers({ days: 7 }),
      getLiveAttendance(),
    ])
      .then(([s, r, e, l]) => {
        setStats(s.data.stats);
        setRevenue(r.data.monthly.map(m => ({
          name:  MONTH_NAMES[m._id.month - 1],
          total: m.total,
          count: m.count,
        })));
        setExpiring(e.data.members);
        setLive(l.data.records.slice(0, 8));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <Loader fullPage text="Loading dashboard…" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>{now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · All systems normal</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">📥 Export</button>
          <button className="btn btn-gold" onClick={() => navigate('/members')}>+ Add Member</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Members"
          value={stats?.members.total ?? '—'}
          sub={`${stats?.members.active ?? 0} active`}
          icon="👥" accent="gold"
          trend="8.3%" trendUp
        />
        <StatCard
          label="Seats Occupied"
          value={`${stats?.seats.occupied ?? 0}/${stats?.seats.total ?? 0}`}
          sub={`${stats?.seats.total ? Math.round(stats.seats.occupied / stats.seats.total * 100) : 0}% occupancy`}
          icon="🪑" accent="teal"
          trend="5.1%" trendUp
        />
        <StatCard
          label="Revenue This Month"
          value={`₹${(stats?.revenue.thisMonth ?? 0).toLocaleString('en-IN')}`}
          sub="Paid memberships"
          icon="💰" accent="success"
        />
        <StatCard
          label="Today's Check-ins"
          value={stats?.attendance.today ?? 0}
          sub={`${live.length} currently inside`}
          icon="📋" accent="gold"
        />
      </div>

      {/* Revenue chart + expiring members */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue (Last 6 months)</span>
          </div>
          <div className="card-body" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7A7A6E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7A7A6E' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Bar dataKey="total" fill="#C9A84C" radius={[4,4,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Expiring Soon</span>
            <span style={{ color: '#C0392B', fontSize: '0.75rem', fontWeight: 600 }}>
              {expiring.length} members
            </span>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {expiring.length === 0 && (
              <div style={{ padding: '20px 22px', color: '#7A7A6E', fontSize: '0.82rem' }}>No members expiring soon</div>
            )}
            {expiring.map(m => (
              <div
                key={m._id}
                onClick={() => navigate(`/members/${m._id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 22px', borderBottom: '1px solid rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#7A7A6E', fontFamily: 'JetBrains Mono, monospace' }}>
                    {m.memberId}
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#C0392B', fontWeight: 500 }}>
                  {new Date(m.expiryDate).toLocaleDateString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live attendance */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Currently Inside</span>
          <span style={{ fontSize: '0.75rem', color: '#1A6A4A', fontWeight: 500 }}>
            🟢 {live.length} present
          </span>
        </div>
        {live.length === 0 ? (
          <div style={{ padding: '20px 22px', color: '#7A7A6E', fontSize: '0.82rem' }}>Nobody checked in yet today</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Seat</th>
                  <th>Check-in</th>
                </tr>
              </thead>
              <tbody>
                {live.map(r => (
                  <tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/members/${r.memberId?._id}`)}>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar" style={{ background: '#1A5F6A' }}>
                          {r.memberId?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="member-name">{r.memberId?.name}</div>
                          <div className="member-id">{r.memberId?.memberId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#7A7A6E', fontSize: '0.78rem' }}>
                      {r.seatId?.seatNumber || '—'}
                    </td>
                    <td style={{ color: '#7A7A6E', fontSize: '0.78rem' }}>
                      {new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
