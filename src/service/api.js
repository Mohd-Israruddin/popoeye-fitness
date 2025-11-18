import axios from 'axios';

// Configure axios to use the backend server
// Priority: 1. Environment variable (build-time), 2. Runtime detection, 3. Default production URL, 4. Localhost
function getApiBaseUrl() {
  // Check for build-time environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Runtime detection: check if we're on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If on localhost, use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // For production, use the Render backend URL
    return 'https://solsparrow-backend.onrender.com';
  }
  
  // Fallback for SSR or other environments
  return 'http://localhost:5000';
}

const API_BASE_URL = getApiBaseUrl();
axios.defaults.baseURL = `${API_BASE_URL}/api`;

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Request failed:', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

export default axios;
