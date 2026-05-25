import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMember, updateStatus } from '../api/members.api';
import { getMemberAttendance } from '../api/attendance.api';
import { getPayments } from '../api/billing.api';
import Badge from '../components/ui/Badge';
import Loader from '../components/ui/Loader';

const AVATAR_COLORS = ['#1A5F6A','#C9A84C','#C0392B','#2C3E50','#1A6A4A'];

export default function MemberProfile() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [member,     setMember]     = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMember(id),
      getMemberAttendance(id, { limit: 30 }),
      getPayments({ memberId: id, limit: 10 }),
    ])
      .then(([m, a, p]) => {
        setMember(m.data.member);
        setAttendance(a.data.records);
        setPayments(p.data.payments);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader fullPage text="Loading profile…" />;
  if (!member) return <Loader fullPage text="Member not found" />;

  const avatarColor = AVATAR_COLORS[(member.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const initials    = member.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleStatus = async (newStatus) => {
    await updateStatus(id, newStatus);
    setMember(m => ({ ...m, status: newStatus }));
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/members')}>← Back</button>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{member.name}</h1>
            <p style={{ fontFamily: 'JetBrains Mono, monospace' }}>{member.memberId}</p>
          </div>
        </div>
        <div className="header-actions">
          {member.status === 'active' && (
            <button className="btn btn-outline" onClick={() => handleStatus('suspended')}>Suspend</button>
          )}
          {member.status === 'suspended' && (
            <button className="btn btn-gold" onClick={() => handleStatus('active')}>Restore</button>
          )}
        </div>
      </div>

      <div className="profile-layout">
        {/* Profile card */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ minHeight: 72, background: 'linear-gradient(135deg, #1A5F6A, #2A8A99)' }} />
            <div style={{ padding: '0 22px 22px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: avatarColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.4rem', fontWeight: 700,
                margin: '-32px auto 12px', border: '3px solid #fff',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              }}>
                {initials}
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 600 }}>
                {member.name}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#7A7A6E', margin: '3px 0 10px' }}>
                {member.memberId}
              </div>
              <Badge status={member.status} />
            </div>
            {[
              ['Phone',    member.phone || '—'],
              ['Email',    member.email || '—'],
              ['Plan',     member.planId?.name || '—'],
              ['Seat',     member.seatId?.seatNumber || '—'],
              ['Joined',   member.joinDate ? new Date(member.joinDate).toLocaleDateString('en-IN') : '—'],
              ['Expires',  member.expiryDate ? new Date(member.expiryDate).toLocaleDateString('en-IN') : '—'],
              ['ID Proof', member.idProofType ? `${member.idProofType.toUpperCase()} — ${member.idProofNumber || ''}` : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                gap: 8,
                padding: '8px 18px', borderTop: '1px solid rgba(0,0,0,0.05)',
                fontSize: '0.78rem', flexWrap: 'wrap',
              }}>
                <span style={{ color: '#7A7A6E', flexShrink: 0 }}>{k}</span>
                <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-word', flex: 1, minWidth: 0 }}>{v}</span>
              </div>
            ))}
            {member.notes && (
              <div style={{ padding: '10px 22px', borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: '0.78rem', color: '#7A7A6E' }}>
                {member.notes}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Attendance */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Attendance</span>
              <span style={{ fontSize: '0.75rem', color: '#7A7A6E' }}>Last 30 records</span>
            </div>
            {attendance.length === 0 ? (
              <div style={{ padding: '20px 22px', color: '#7A7A6E', fontSize: '0.82rem' }}>No attendance records</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a._id}>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{a.date}</td>
                        <td>{new Date(a.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: '#1A6A4A' }}>Active</span>}</td>
                        <td style={{ color: '#7A7A6E', fontSize: '0.78rem' }}>
                          {a.durationMins ? `${Math.floor(a.durationMins / 60)}h ${a.durationMins % 60}m` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment history */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Payment History</span>
            </div>
            {payments.length === 0 ? (
              <div style={{ padding: '20px 22px', color: '#7A7A6E', fontSize: '0.82rem' }}>No payment records</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p._id}>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>{p.invoiceNo}</td>
                        <td style={{ fontSize: '0.78rem' }}>{p.planId?.name || '—'}</td>
                        <td style={{ fontWeight: 600 }}>₹{p.totalAmount?.toLocaleString('en-IN')}</td>
                        <td style={{ textTransform: 'capitalize', fontSize: '0.78rem', color: '#7A7A6E' }}>{p.method}</td>
                        <td style={{ fontSize: '0.78rem', color: '#7A7A6E' }}>
                          {new Date(p.paidAt).toLocaleDateString('en-IN')}
                        </td>
                        <td><Badge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
