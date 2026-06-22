import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markRead, markAllRead, deleteNotification } from '../api/notifications.api';
import Loader from '../components/ui/Loader';

const TYPE_ICON = { expiry: '⏰', payment: '💳', checkin: '📋', system: '🔔' };
const TYPE_COLOR = {
  expiry:  { bg: 'rgba(192,57,43,0.08)',   border: 'rgba(192,57,43,0.15)' },
  payment: { bg: 'rgba(26,95,106,0.08)',   border: 'rgba(26,95,106,0.15)' },
  checkin: { bg: 'rgba(26,106,74,0.08)',   border: 'rgba(26,106,74,0.15)' },
  system:  { bg: 'rgba(201,168,76,0.08)',  border: 'rgba(201,168,76,0.15)' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter === 'unread') params.isRead = 'false';
    getNotifications(params)
      .then(r => { setNotifications(r.data.notifications); setUnread(r.data.unread); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleRead = async (id) => {
    await markRead(id);
    setNotifications(n => n.map(x => x._id === id ? { ...x, isRead: true } : x));
    setUnread(u => Math.max(0, u - 1));
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifications(n => n.filter(x => x._id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unread} unread</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setFilter(f => f === 'unread' ? '' : 'unread')}>
            {filter === 'unread' ? 'Show All' : 'Unread Only'}
          </button>
          {unread > 0 && (
            <button className="btn btn-gold" onClick={handleMarkAll}>Mark All Read</button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <Loader text="Loading notifications…" />
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔔</div>
            <div>No notifications</div>
          </div>
        ) : (
          <div>
            {notifications.map(n => {
              const c = TYPE_COLOR[n.type] || TYPE_COLOR.system;
              return (
                <div
                  key={n._id}
                  onClick={() => { if (!n.isRead) handleRead(n._id); }}
                  style={{
                    display: 'flex', gap: 14, padding: '14px 22px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    background: n.isRead ? 'transparent' : 'rgba(201,168,76,0.03)',
                    cursor: n.isRead ? 'default' : 'pointer',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', background: c.bg, border: `1px solid ${c.border}`,
                    position: 'relative',
                  }}>
                    {TYPE_ICON[n.type] || '🔔'}
                    {!n.isRead && (
                      <span style={{
                        position: 'absolute', top: -3, right: -3,
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#C0392B', border: '1.5px solid #fff',
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.84rem', fontWeight: n.isRead ? 400 : 600,
                      color: '#0D0D0D', marginBottom: 2,
                    }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#7A7A6E', lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                    {n.relatedMemberId && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: 6 }}
                        onClick={e => { e.stopPropagation(); navigate(`/members/${n.relatedMemberId._id}`); }}
                      >
                        View Member →
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.68rem', color: '#7A7A6E', whiteSpace: 'nowrap' }}>
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {n.priority === 'high' && (
                      <span style={{ padding: '1px 6px', borderRadius: 10, background: 'rgba(192,57,43,0.1)', color: '#C0392B', fontSize: '0.62rem', fontWeight: 600 }}>
                        HIGH
                      </span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(n._id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7A6E', fontSize: '1rem', padding: 2 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
