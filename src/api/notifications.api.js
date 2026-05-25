import api from './axios';

export const getNotifications    = (params) => api.get('/notifications', { params });
export const markRead            = (id)     => api.patch(`/notifications/${id}/read`);
export const markAllRead         = ()       => api.patch('/notifications/read-all');
export const deleteNotification  = (id)     => api.delete(`/notifications/${id}`);
export const createNotification  = (data)   => api.post('/notifications', data);
