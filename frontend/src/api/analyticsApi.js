import API from './axios';

export const getOverview = () => API.get('/analytics/overview');
export const getRevenueTrend = () => API.get('/analytics/revenue');
export const getFacilityStats = () => API.get('/analytics/facilities');
export const getComplaintStats = () => API.get('/analytics/complaints');
export const getVisitorStats = () => API.get('/analytics/visitors');
export const getDefaulters = () => API.get('/analytics/defaulters');
