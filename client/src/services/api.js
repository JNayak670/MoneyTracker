import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 65000, // 65 seconds to accommodate Render free-tier wake-up latency
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('money_tracker_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle 401 Unauthorized responses & cold-start error tagging
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token only when genuinely rejected as 401 Unauthorized by server
      localStorage.removeItem('money_tracker_token');
    }
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    const err = new Error(message);
    err.response = error.response;
    err.status = error.response?.status;
    err.code = error.code;
    err.isSleepingServer = !error.response || [502, 503, 504].includes(error.response?.status) || error.message === 'Network Error' || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
    return Promise.reject(err);
  }
);

// Map of currently in-flight GET requests: requestKey -> Promise
const inFlightGetRequests = new Map();
const originalGet = api.get.bind(api);

/**
 * In-Flight GET Request Deduplication:
 * If identical GET requests are triggered concurrently (e.g. by different components
 * mounting on the same page, or React 18 StrictMode double-mounting), reuse the single
 * pending promise.
 * The cache entry is immediately cleared the exact moment the request completes,
 * ensuring subsequent calls always fetch fresh data.
 */
api.get = function (url, config = {}) {
  // Option to explicitly bypass deduplication if needed
  if (config && config.skipDedupe) {
    return originalGet(url, config);
  }

  const paramsKey = config?.params ? JSON.stringify(config.params) : '';
  const key = `${url}?${paramsKey}`;

  if (inFlightGetRequests.has(key)) {
    return inFlightGetRequests.get(key);
  }

  const promise = originalGet(url, config).finally(() => {
    // Immediately clear lock once completed (success or failure)
    inFlightGetRequests.delete(key);
  });

  inFlightGetRequests.set(key, promise);
  return promise;
};

export default api;
