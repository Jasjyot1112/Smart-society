import API from './axios';

export const getStaffList = () => API.get('/staff');
export const getStaffById = (id) => API.get(`/staff/${id}`);
export const getStaffByQRId = (staffId) => API.get(`/staff/qr/${staffId}`);
export const addStaff = (data) => API.post('/staff', data);
export const updateStaff = (id, data) => API.put(`/staff/${id}`, data);
export const deactivateStaff = (id) => API.delete(`/staff/${id}`);
export const markAttendance = (id) => API.post(`/staff/${id}/attendance`);
export const getStaffSalary = (id, month, year) => API.get(`/staff/${id}/salary?month=${month}&year=${year}`);
