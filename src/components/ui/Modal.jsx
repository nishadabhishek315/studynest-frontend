import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, width = 520 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else      document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px',
      }}
    >
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14,
          width: '100%', maxWidth: width,
          maxHeight: '92vh', overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          position: 'sticky', top: 0,
          background: '#fff', zIndex: 1,
          borderRadius: '14px 14px 0 0',
        }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 600 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer',
              fontSize: '1.1rem', color: '#7A7A6E', lineHeight: 1,
              padding: '5px 8px', borderRadius: 6,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '20px 20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
