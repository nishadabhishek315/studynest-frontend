import api from './axios';

export const getPlans    = ()          => api.get('/plans');
export const createPlan  = (data)      => api.post('/plans', data);
export const updatePlan  = (id, data)  => api.put(`/plans/${id}`, data);
export const deletePlan  = (id)        => api.delete(`/plans/${id}`);
