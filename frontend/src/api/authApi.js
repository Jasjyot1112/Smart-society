import API from './axios';

export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const changePassword = (data) => API.put('/auth/change-password', data);
export const updateProfile = (formData) => API.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
