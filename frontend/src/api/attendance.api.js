import api from './axios';

export const checkIn             = (data)      => api.post('/attendance/checkin', data);
export const checkOut            = (id)        => api.patch(`/attendance/${id}/checkout`);
export const getAttendance       = (params)    => api.get('/attendance', { params });
export const getLiveAttendance   = ()          => api.get('/attendance/live');
export const getTodayStats       = ()          => api.get('/attendance/today-stats');
export const getMemberAttendance = (memberId, params) => api.get(`/attendance/member/${memberId}`, { params });
