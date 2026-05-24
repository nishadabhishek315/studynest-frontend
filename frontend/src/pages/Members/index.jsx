import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMembers, getMemberStats, updateStatus, deleteMember } from '../../api/members.api';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import MemberModal from './MemberModal';
import Loader from '../../components/ui/Loader';

const AVATAR_COLORS = ['#1A5F6A','#C9A84C','#C0392B','#2C3E50','#1A6A4A'];

export default function Members() {
  const navigate = useNavigate();
  const [members,  setMembers]  = useState([]);
  const [stats,    setStats]    = useState(null);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [page,     setPage]     = useState(1);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (status) params.status = status;
    Promise.all([getMembers(params), getMemberStats()])
      .then(([res, s]) => {
        setMembers(res.data.members);
        setTotal(res.data.total);
        setStats(s.data.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus(id, newStatus);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this member? This cannot be undone.')) return;
    try {
      await deleteMember(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Members</h1>
          <p>{total} total members</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-gold" onClick={() => { setEditing(null); setModal(true); }}>
            + Add Member
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <StatCard label="Total"     value={stats.total}       icon="👥" accent="gold" />
          <StatCard label="Active"    value={stats.active}      icon="✅" accent="success" />
          <StatCard label="Expired"   value={stats.expired}     icon="⏰" accent="danger" />
          <StatCard label="Exp. Soon" value={stats.expiringSoon} icon="⚠️" accent="gold" />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 180 }}>
          <span>🔍</span>
          <input
            placeholder="Search name, phone, ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="form-input"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ width: 'auto', minWidth: 130, flex: '0 0 auto' }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <Loader text="Loading members…" />
        ) : members.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <div>No members found</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Seat</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={m._id}>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                          {m.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div
                            className="member-name"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/members/${m._id}`)}
                          >
                            {m.name}
                          </div>
                          <div className="member-id">{m.memberId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#7A7A6E', fontSize: '0.78rem' }}>
                      {m.planId?.name || '—'}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                      {m.seatId?.seatNumber || <span style={{ color: '#7A7A6E' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: new Date(m.expiryDate) < new Date() ? '#C0392B' : '#7A7A6E' }}>
                      {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td><Badge status={m.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => { setEditing(m); setModal(true); }}>
                          Edit
                        </button>
                        {m.status === 'active' && (
                          <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange(m._id, 'suspended')}>
                            Suspend
                          </button>
                        )}
                        {m.status === 'suspended' && (
                          <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange(m._id, 'active')}>
                            Restore
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m._id)}>
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 22px' }}>
            <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ alignSelf: 'center', fontSize: '0.82rem', color: '#7A7A6E' }}>{page} / {totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      <MemberModal
        open={modal}
        onClose={() => { setModal(false); setEditing(null); }}
        member={editing}
        onSaved={() => { setModal(false); setEditing(null); load(); }}
      />
    </div>
  );
}
