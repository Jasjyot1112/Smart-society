import API from './axios';

export const getNotifications = (params) => API.get('/notifications', { params });
export const markAllRead = () => API.put('/notifications/read');
export const markOneRead = (id) => API.put(`/notifications/${id}/read`);
export const deleteNotification = (id) => API.delete(`/notifications/${id}`);
