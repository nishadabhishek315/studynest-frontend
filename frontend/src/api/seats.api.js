import api from './axios';

export const getSeats     = (params)    => api.get('/seats', { params });
export const getSeat      = (id)        => api.get(`/seats/${id}`);
export const getSeatStats = ()          => api.get('/seats/stats');
export const createSeat   = (data)      => api.post('/seats', data);
export const updateSeat   = (id, data)  => api.put(`/seats/${id}`, data);
export const assignSeat   = (id, memberId) => api.patch(`/seats/${id}/assign`, { memberId });
export const releaseSeat  = (id)        => api.patch(`/seats/${id}/release`);
export const deleteSeat   = (id)        => api.delete(`/seats/${id}`);
