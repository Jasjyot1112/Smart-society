import API from './axios';

export const createOrder = (data) => API.post('/payments/order', data);
export const verifyPayment = (data) => API.post('/payments/verify', data);
export const getMyPayments = () => API.get('/payments/history');
export const downloadInvoice = (id) => API.get(`/payments/${id}/invoice`, { responseType: 'blob' });
export const getAllPayments = (params) => API.get('/payments', { params });
export const getDefaulters = (params) => API.get('/payments/defaulters', { params });
export const sendReminders = (data) => API.post('/payments/remind', data);
