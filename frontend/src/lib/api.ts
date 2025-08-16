import axios from 'axios';

// Usa VITE_API_URL si está definida; fallback a Google Cloud Run para producción
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://diabetic-retinopathy-project-488176611125.us-central1.run.app';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: {
    username: string;
    name: string;
    password: string;
    email: string;
  }) => api.post('/auth/register', userData),
  
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  getCurrentUser: () => api.get('/auth/me'),
};

// Patient API
export const patientAPI = {
  create: (patientData: {
    name: string;
    age: number;
    gender: string;
    contact_info: string;
  }) => api.post('/patients', patientData),
  
  getMyPatient: () => api.get('/patients/me'),
};

// Prediction API
export const predictionAPI = {
  predict: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  predictRETFound: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/predict/retfound', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  save: (predictionData: {
    prediction_class: string;
    confidence_score: number;
  }) => api.post('/predictions', predictionData),
  
  getAll: () => api.get('/predictions'),
  
  downloadReport: () => api.get('/predictions/report', {
    responseType: 'blob',
  }),
};

// Models API
export const modelsAPI = {
  getInfo: () => api.get('/models/info'),
};

export default api;