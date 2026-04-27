import API from './axios';

export const getUsers = (params) => API.get('/users', { params });
export const getUser = (id) => API.get(`/users/${id}`);
export const createUser = (data) => API.post('/auth/register', data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);
export const getDashboardStats = () => API.get('/users/stats');
