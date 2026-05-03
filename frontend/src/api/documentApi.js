import API from './axios';

export const getDocuments = () => API.get('/documents');

export const uploadDocument = (formData) =>
  API.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteDocument = (id) => API.delete(`/documents/${id}`);
