import API from './axios';

export const getExpenses = (params) => API.get('/expenses', { params });
export const getExpenseSummary = (year) => API.get('/expenses/summary', { params: { year } });
export const addExpense = (formData) => API.post('/expenses', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateExpense = (id, data) => API.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);
