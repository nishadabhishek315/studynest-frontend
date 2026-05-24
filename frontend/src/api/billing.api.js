import api from './axios';

export const getPayments       = (params)   => api.get('/billing', { params });
export const getPayment        = (id)       => api.get(`/billing/${id}`);
export const createPayment     = (data)     => api.post('/billing', data);
export const getRevenueSummary = ()         => api.get('/billing/summary');
export const downloadInvoice   = (id)       => api.get(`/billing/${id}/pdf`, { responseType: 'blob' });
