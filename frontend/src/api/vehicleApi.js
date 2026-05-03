import API from './axios';

export const getMyVehicles = () => API.get('/vehicles/my');
export const addVehicle = (data) => API.post('/vehicles', data);
export const removeVehicle = (id) => API.delete(`/vehicles/${id}`);
export const searchVehicle = (plate) => API.get(`/vehicles/search?plate=${plate}`);
