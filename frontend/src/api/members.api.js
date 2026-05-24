import api from './axios';

export const getMembers       = (params)    => api.get('/members', { params });
export const getMember        = (id)        => api.get(`/members/${id}`);
export const getMemberStats   = ()          => api.get('/members/stats');
export const createMember     = (data)      => api.post('/members', data);
export const updateMember     = (id, data)  => api.put(`/members/${id}`, data);
export const updateStatus     = (id, status) => api.patch(`/members/${id}/status`, { status });
export const deleteMember     = (id)        => api.delete(`/members/${id}`);
