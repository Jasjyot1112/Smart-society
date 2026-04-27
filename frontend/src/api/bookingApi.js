import API from './axios';

// Facilities
export const getFacilities = () => API.get('/facilities');
export const getFacility = (id) => API.get(`/facilities/${id}`);
export const createFacility = (data) => API.post('/facilities', data);
export const updateFacility = (id, data) => API.put(`/facilities/${id}`, data);
export const deleteFacility = (id) => API.delete(`/facilities/${id}`);

// Bookings
export const createBooking = (data) => API.post('/bookings', data);
export const getMyBookings = (params) => API.get('/bookings/my', { params });
export const getAllBookings = (params) => API.get('/bookings/all', { params });
export const cancelBooking = (id, data) => API.put(`/bookings/${id}/cancel`, data);
export const getCalendarData = (facilityId, date) => API.get(`/bookings/calendar/${facilityId}`, { params: { date } });
export const getSlotSuggestions = (facilityId, date) => API.get(`/bookings/suggestions/${facilityId}`, { params: { date } });
