import axios from 'axios';
import {
  initializeLocalStore,
  handleLocalGet,
  handleLocalPost,
  handleLocalPut,
  handleLocalPatch,
  handleLocalDelete,
} from './localStore';

// Initialize local mock cache on load
initializeLocalStore();

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 3000,
});

// Intercept errors and provide seamless fallback to localStore so the app NEVER crashes with network errors
apiClient.interceptors.response.use(
  (response) => {
    window.__BACKEND_ONLINE__ = true;
    return response;
  },
  async (error) => {
    const config = error?.config;
    const status = error?.response?.status;
    const isNetworkOrServerError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('timeout') ||
      status === 404 ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      status >= 500;

    if (config && (isNetworkOrServerError || config.method?.toLowerCase() === 'get')) {
      window.__BACKEND_ONLINE__ = false;
      const method = (config.method || 'get').toLowerCase();
      const url = config.url || '';
      let parsedData = null;

      if (config.data) {
        try {
          parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        } catch {
          parsedData = config.data;
        }
      }

      try {
        let result = null;
        if (method === 'get') {
          result = handleLocalGet(url, config.params);
        } else if (method === 'post') {
          result = handleLocalPost(url, parsedData);
        } else if (method === 'put') {
          result = handleLocalPut(url, parsedData);
        } else if (method === 'patch') {
          result = handleLocalPatch(url, parsedData);
        } else if (method === 'delete') {
          result = handleLocalDelete(url);
        }

        return Promise.resolve({
          data: result,
          status: 200,
          statusText: 'OK (Local Persistent Fallback)',
          headers: {},
          config,
        });
      } catch (localErr) {
        console.warn('Local store fallback error:', localErr);
      }
    }

    const message =
      error?.response?.data?.message ||
      error?.response?.statusText ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
