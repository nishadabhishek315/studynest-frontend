import { useEffect, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { createMember, updateMember } from '../../api/members.api';
import { getPlans } from '../../api/plans.api';
import { parseError } from '../../utils/errorHandler';

const EMPTY = {
  name: '', phone: '', email: '', address: '',
  idProofType: '', idProofNumber: '',
  planId: '', expiryDate: '', notes: '',
};

const ALPHABET_NAME_REGEX = /^[A-Za-z\s]+$/;
const INDIAN_PHONE_REGEX = /^(?:91)?[6-9]\d{9}$/;

export default function MemberModal({ open, onClose, member, onSaved }) {
  const [form,    setForm]    = useState(EMPTY);
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Load plans once on mount
  useEffect(() => {
    getPlans()
      .then(r => setPlans(r.data.plans))
      .catch(() => {});
  }, []);

  // Populate form when editing an existing member
  useEffect(() => {
    if (!open) return;
    setError('');
    if (member) {
      setForm({
        name:          member.name          || '',
        phone:         member.phone         || '',
        email:         member.email         || '',
        address:       member.address       || '',
        idProofType:   member.idProofType   || '',
        idProofNumber: member.idProofNumber || '',
        planId:        member.planId?._id   || member.planId || '',
        expiryDate:    member.expiryDate    ? member.expiryDate.split('T')[0] : '',
        notes:         member.notes         || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [member, open]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!form.name?.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!ALPHABET_NAME_REGEX.test(form.name.trim())) {
      setError('Name must contain alphabet letters only.');
      return;
    }
    if (!form.phone?.trim()) {
      setError('Phone number is required.');
      return;
    }
    const normalizedPhone = form.phone.replace(/[+\-\s]/g, '');
    if (!INDIAN_PHONE_REGEX.test(normalizedPhone)) {
      setError('Please enter a valid Indian phone number (e.g. +91 9876543210).');
      return;
    }
    if (form.idProofNumber?.trim() && !form.idProofType) {
      setError('Please select an ID proof type when providing an ID number.');
      return;
    }
    if (form.idProofType && !form.idProofNumber?.trim()) {
      setError('Please provide an ID number when selecting an ID proof type.');
      return;
    }
    if (form.email && !form.email.match(/^\S+@\S+\.\S+$/)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.expiryDate) delete payload.expiryDate;
      if (!payload.planId)     delete payload.planId;

      if (member) {
        await updateMember(member._id, payload);
      } else {
        await createMember(payload);
      }
      onSaved();
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={member ? 'Edit Member' : 'Add New Member'} width={580}>
      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="form-group">
            <label>Full Name *</label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="Arjun Sharma" pattern="[A-Za-z ]+" required />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" inputMode="tel" required />
          </div>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="arjun@email.com" />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input className="form-input" value={form.address} onChange={set('address')} placeholder="City, State" />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>ID Proof Type</label>
            <select className="form-input" value={form.idProofType} onChange={set('idProofType')}>
              <option value="">Select…</option>
              <option value="aadhaar">Aadhaar</option>
              <option value="pan">PAN</option>
              <option value="passport">Passport</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>ID Number</label>
            <input className="form-input" value={form.idProofNumber} onChange={set('idProofNumber')} placeholder="XXXX XXXX XXXX" />
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Plan</label>
            <select className="form-input" value={form.planId} onChange={set('planId')}>
              <option value="">Select plan…</option>
              {plans.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₹{p.price}/mo
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Expiry Date</label>
            <input className="form-input" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
          </div>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <input className="form-input" value={form.notes} onChange={set('notes')} placeholder="Any special notes" />
        </div>

        {error && (
          <div style={{
            color: '#C0392B',
            fontSize: '0.82rem',
            marginBottom: 12,
            padding: '8px 10px',
            background: 'rgba(192, 57, 43, 0.08)',
            borderRadius: 4,
            borderLeft: '2px solid #C0392B',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-gold" disabled={loading}>
            {loading ? 'Saving…' : member ? 'Update Member' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
