import api from './axios';

export const getDashboardStats  = ()         => api.get('/reports/dashboard');
export const getRevenueReport   = (params)   => api.get('/reports/revenue', { params });
export const getOccupancyReport = ()         => api.get('/reports/occupancy');
export const getExpiringMembers = (params)   => api.get('/reports/expiring', { params });
export const getAttendanceReport = (params)  => api.get('/reports/attendance', { params });
