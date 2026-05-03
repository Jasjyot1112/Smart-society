import API from './axios';

export const getPolls = () => API.get('/polls');
export const createPoll = (data) => API.post('/polls', data);
export const voteOnPoll = (id, optionIndex) => API.post(`/polls/${id}/vote`, { optionIndex });
export const closePoll = (id) => API.put(`/polls/${id}/close`);
export const getPollVoters = (id) => API.get(`/polls/${id}/voters`);
