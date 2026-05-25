import api from './axios';

export const login         = (data)    => api.post('/auth/login', data);
export const logout        = ()        => api.post('/auth/logout');
export const getMe         = ()        => api.get('/auth/me');
export const refreshToken  = (data)    => api.post('/auth/refresh', data);
export const changePassword = (data)   => api.put('/auth/password', data);
export const getUsers      = ()        => api.get('/auth/users');
export const createUser    = (data)    => api.post('/auth/users', data);
export const updateUser    = (id, data) => api.put(`/auth/users/${id}`, data);
