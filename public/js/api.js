/**
 * CircleLedger - API Client
 * Interfaces with the Express + SQLite backend
 */

const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // 1. Summary
  getSummary() {
    return this.request('/api/summary');
  },

  // 2. Friends
  getFriends() {
    return this.request('/api/friends');
  },

  getFriendLedger(id) {
    return this.request(`/api/friends/${id}`);
  },

  createFriend(payload) {
    return this.request('/api/friends', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateFriend(id, payload) {
    return this.request(`/api/friends/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteFriend(id) {
    return this.request(`/api/friends/${id}`, {
      method: 'DELETE'
    });
  },

  // 3. Transactions
  getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/transactions?${query}`);
  },

  createTransaction(payload) {
    return this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateTransaction(id, payload) {
    return this.request(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteTransaction(id) {
    return this.request(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
  },

  // 4. Quick Settle
  settleUp(payload) {
    return this.request('/api/settle', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // 5. Analytics
  getAnalytics() {
    return this.request('/api/analytics');
  },

  // 6. Settings
  getSettings() {
    return this.request('/api/settings');
  },

  saveSettings(payload) {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // 7. DB Management
  resetDemo() {
    return this.request('/api/reset-demo', { method: 'POST' });
  },

  clearAll() {
    return this.request('/api/clear-all', { method: 'POST' });
  },

  getBackup() {
    return this.request('/api/backup');
  },

  restoreBackup(payload) {
    return this.request('/api/restore', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

window.API = API;
