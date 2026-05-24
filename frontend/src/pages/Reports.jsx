import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getRevenueReport, getOccupancyReport, getExpiringMembers, getAttendanceReport } from '../api/reports.api';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Loader from '../components/ui/Loader';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ZONE_COLORS = { A: '#C9A84C', B: '#1A5F6A', C: '#2C3E50' };
const PIE_COLORS  = ['#C9A84C','#1A5F6A','#C0392B','#1A6A4A'];

export default function Reports() {
  const navigate = useNavigate();
  const [revenue,    setRevenue]    = useState([]);
  const [occupancy,  setOccupancy]  = useState([]);
  const [expiring,   setExpiring]   = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      getRevenueReport({ months: 6 }),
      getOccupancyReport(),
      getExpiringMembers({ days: 14 }),
      getAttendanceReport({ days: 14 }),
    ])
      .then(([r, o, e, a]) => {
        setRevenue(r.data.monthly.map(m => ({
          name:  MONTH_NAMES[m._id.month - 1],
          total: m.total,
          count: m.count,
        })));
        setOccupancy(o.data.byZone);
        setExpiring(e.data.members);
        setAttendance(a.data.daily);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader fullPage text="Loading reports…" />;

  const pieData = occupancy.map(z => ({
    name:  `Zone ${z._id}`,
    value: z.occupied,
    color: ZONE_COLORS[z._id] || '#7A7A6E',
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      {/* Revenue + Occupancy */}
      <div className="reports-top">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Revenue</span>
          </div>
          <div className="card-body" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7A7A6E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#7A7A6E' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v, n) => n === 'total' ? [`₹${v.toLocaleString('en-IN')}`, 'Revenue'] : [v, 'Payments']}
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Bar dataKey="total" fill="#C9A84C" radius={[4,4,0,0]} maxBarSize={36} name="total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Occupancy by Zone</span>
          </div>
          <div className="card-body" style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pieData.length === 0 ? (
              <div style={{ color: '#7A7A6E', fontSize: '0.82rem' }}>No data</div>
            ) : (
              <PieChart width={200} height={200}>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </div>
        </div>
      </div>

      {/* Occupancy table + Attendance */}
      <div className="reports-mid">
        <div className="card">
          <div className="card-header"><span className="card-title">Zone Breakdown</span></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Total</th>
                  <th>Occupied</th>
                  <th>Available</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {occupancy.map(z => (
                  <tr key={z._id}>
                    <td style={{ fontWeight: 600 }}>Zone {z._id}</td>
                    <td>{z.total}</td>
                    <td style={{ color: '#C9A84C', fontWeight: 500 }}>{z.occupied}</td>
                    <td style={{ color: '#1A6A4A' }}>{z.available}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            width: `${z.total ? Math.round(z.occupied / z.total * 100) : 0}%`,
                            background: ZONE_COLORS[z._id] || '#C9A84C',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#7A7A6E', minWidth: 32 }}>
                          {z.total ? Math.round(z.occupied / z.total * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance trend */}
        <div className="card">
          <div className="card-header"><span className="card-title">Daily Attendance (14 days)</span></div>
          <div className="card-body" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendance} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="_id" tick={{ fontSize: 9, fill: '#7A7A6E' }} axisLine={false} tickLine={false}
                  tickFormatter={d => d ? d.slice(5) : ''} />
                <YAxis tick={{ fontSize: 10, fill: '#7A7A6E' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }} />
                <Bar dataKey="count" fill="#1A5F6A" radius={[3,3,0,0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expiring members */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Members Expiring in 14 Days</span>
          <span style={{ color: '#C0392B', fontSize: '0.75rem', fontWeight: 600 }}>{expiring.length} members</span>
        </div>
        {expiring.length === 0 ? (
          <div style={{ padding: '20px 22px', color: '#7A7A6E', fontSize: '0.82rem' }}>No members expiring in the next 14 days</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Seat</th>
                  <th>Expiry</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map(m => {
                  const daysLeft = Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={m._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/members/${m._id}`)}>
                      <td>
                        <div className="member-name">{m.name}</div>
                        <div className="member-id">{m.memberId}</div>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#7A7A6E' }}>{m.planId?.name || '—'}</td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                        {m.seatId?.seatNumber || '—'}
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>{new Date(m.expiryDate).toLocaleDateString('en-IN')}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 20,
                          fontSize: '0.72rem', fontWeight: 600,
                          background: daysLeft <= 3 ? 'rgba(192,57,43,0.1)' : 'rgba(201,168,76,0.15)',
                          color: daysLeft <= 3 ? '#C0392B' : '#8a6d00',
                        }}>
                          {daysLeft}d
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
