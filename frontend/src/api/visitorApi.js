import API from './axios';

export const createVisitorRequest = (data) => API.post('/visitors', data);
export const respondToVisitor = (id, data) => API.put(`/visitors/${id}/respond`, data);
export const verifyQRCode = (data) => API.post('/visitors/verify-qr', data);
export const markExit = (id) => API.put(`/visitors/${id}/exit`);
export const getVisitors = (params) => API.get('/visitors', { params });
export const getVisitor = (id) => API.get(`/visitors/${id}`);
