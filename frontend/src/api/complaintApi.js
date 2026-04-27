import API from './axios';

export const createComplaint = (formData) => API.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMyComplaints = (params) => API.get('/complaints/my', { params });
export const getAllComplaints = (params) => API.get('/complaints', { params });
export const getComplaint = (id) => API.get(`/complaints/${id}`);
export const updateComplaintStatus = (id, data) => API.put(`/complaints/${id}/status`, data);
export const rateComplaint = (id, data) => API.put(`/complaints/${id}/rate`, data);
export const getComplaintStats = () => API.get('/complaints/stats');
