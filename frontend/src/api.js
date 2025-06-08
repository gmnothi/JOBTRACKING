import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getJobs = async () => {
  try {
    const response = await api.get('/jobs');
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

export const deleteJob = async (jobId) => {
  try {
    await api.delete(`/jobs/${jobId}`);
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}; 