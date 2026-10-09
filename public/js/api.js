/**
 * AquaVenta - Central API Service & Live Activity Interceptor
 */

const API = (() => {
  const BASE_URL = window.location.origin;
  const TOKEN_KEY = 'aquaventa_jwt_token';
  const USER_KEY = 'aquaventa_auth_user';

  // Activity log subscribers
  const activityLogs = [];
  const logSubscribers = [];

  function notifySubscribers(entry) {
    activityLogs.unshift(entry);
    if (activityLogs.length > 50) activityLogs.pop();
    logSubscribers.forEach(cb => {
      try { cb(entry, activityLogs); } catch (e) { console.error(e); }
    });
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  }

  function setUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  async function rawRequest(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const token = getToken();

    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const startTime = performance.now();
    let status = 0;
    let statusText = '';
    let responseData = null;
    let error = null;

    try {
      const response = await fetch(url, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined
      });

      status = response.status;
      statusText = response.statusText;

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const durationMs = Math.round(performance.now() - startTime);

      // Log activity
      notifySubscribers({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        method,
        endpoint,
        status,
        statusText,
        durationMs,
        requestBody: body,
        responseData
      });

      if (!response.ok) {
        const errorMsg = (responseData && responseData.message) || responseData || `HTTP ${status} ${statusText}`;
        const err = new Error(errorMsg);
        err.status = status;
        err.data = responseData;
        throw err;
      }

      return responseData;
    } catch (err) {
      if (status === 0) {
        const durationMs = Math.round(performance.now() - startTime);
        notifySubscribers({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          method,
          endpoint,
          status: 'ERR',
          statusText: err.message,
          durationMs,
          requestBody: body,
          responseData: { error: err.message }
        });
      }
      throw err;
    }
  }

  return {
    getToken,
    setToken,
    getUser,
    setUser,
    rawRequest,
    onActivity(cb) {
      logSubscribers.push(cb);
      cb(null, activityLogs);
    },
    getActivityLogs() {
      return [...activityLogs];
    },

    // Auth
    async getUsers() {
      return rawRequest('/api/auth/users');
    },
    async signup(payload) {
      return rawRequest('/api/auth/signup', { method: 'POST', body: payload });
    },
    async login(payload) {
      const data = await rawRequest('/api/auth/login', { method: 'POST', body: payload });
      if (data && data.token) {
        setToken(data.token);
        if (data.user) setUser(data.user);
      }
      return data;
    },
    logout() {
      setToken(null);
      setUser(null);
      window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: null } }));
    },

    // Bottles
    async getBottles() {
      return rawRequest('/api/bottle/all');
    },
    async getBottleById(id) {
      return rawRequest(`/api/bottle/${id}`);
    },
    async addBottle(payload) {
      return rawRequest('/api/bottle/add', { method: 'POST', body: payload });
    },
    async updateBottle(id, payload) {
      return rawRequest(`/api/bottle/update/${id}`, { method: 'PUT', body: payload });
    },
    async deleteBottle(id) {
      return rawRequest(`/api/bottle/delete/${id}`, { method: 'DELETE' });
    },

    // Vendors
    async getVendors() {
      return rawRequest('/api/vendor/all');
    },
    async getVendorById(id) {
      return rawRequest(`/api/vendor/${id}`);
    },
    async addVendor(payload) {
      return rawRequest('/api/vendor/add', { method: 'POST', body: payload });
    },
    async updateVendor(id, payload) {
      return rawRequest(`/api/vendor/update/${id}`, { method: 'PUT', body: payload });
    },
    async deleteVendor(id) {
      return rawRequest(`/api/vendor/delete/${id}`, { method: 'DELETE' });
    },

    // Reports
    async getSalesReport(params = {}) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          searchParams.append(k, params[k]);
        }
      });
      const qs = searchParams.toString();
      const endpoint = qs ? `/api/report/sales?${qs}` : '/api/report/sales';
      return rawRequest(endpoint);
    }
  };
})();

window.API = API;
