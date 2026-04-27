import api from './axios';

// ==========================================
// MARKETPLACE
// ==========================================
export const getMarketplaceItems = (params) => api.get('/marketplace', { params });
export const getMarketplaceItem = (id) => api.get(`/marketplace/${id}`);
export const createMarketplaceItem = (formData) => api.post('/marketplace', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateMarketplaceItem = (id, data) => api.patch(`/marketplace/${id}`, data);
export const deleteMarketplaceItem = (id) => api.delete(`/marketplace/${id}`);

// ==========================================
// ANNOUNCEMENTS
// ==========================================
export const getAnnouncements = (params) => api.get('/announcements', { params });
export const createAnnouncement = (formData) => api.post('/announcements', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteAnnouncement = (id) => api.delete(`/announcements/${id}`);

// ==========================================
// EVENTS
// ==========================================
export const getEvents = (params) => api.get('/events', { params });
export const createEvent = (data) => api.post('/events', data);
export const rsvpEvent = (id, rsvp) => api.post(`/events/${id}/rsvp`, { rsvp });
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// ==========================================
// SERVICES
// ==========================================
export const getServices = (params) => api.get('/services', { params });
export const createService = (data) => api.post('/services', data);
export const deleteService = (id) => api.delete(`/services/${id}`);
