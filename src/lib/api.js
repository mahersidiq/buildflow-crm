/**
 * API client for BuildFlow CRM.
 * Replaces direct Supabase SDK calls with fetch-based API calls
 * to the Express backend, which enforces tenant isolation.
 */

const API_BASE = '/api';

let accessToken = null;

export function setToken(token) {
  accessToken = token;
}

export function getToken() {
  return accessToken;
}

export function clearToken() {
  accessToken = null;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Session expired');
  }

  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}

function crudResource(path) {
  return {
    list: () => request(path),
    get: (id) => request(`${path}/${id}`),
    create: (data) => request(path, { method: 'POST', body: data }),
    update: (id, data) => request(`${path}/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`${path}/${id}`, { method: 'DELETE' }),
  };
}

export const api = {
  // Auth
  auth: {
    signup: (data) => request('/auth/signup', { method: 'POST', body: data }),
    login: (data) => request('/auth/login', { method: 'POST', body: data }),
    me: () => request('/auth/me'),
    invite: (data) => request('/auth/invite', { method: 'POST', body: data }),
    acceptInvite: (data) => request('/auth/accept', { method: 'POST', body: data }),
  },

  // Tenant settings (organization)
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'PUT', body: data }),
  },

  // Entity CRUD
  projects: crudResource('/projects'),
  contacts: crudResource('/contacts'),
  budgetItems: crudResource('/budget-items'),
  invoices: crudResource('/invoices'),
  changeOrders: crudResource('/change-orders'),
  dailyLogs: crudResource('/daily-logs'),
  documents: crudResource('/documents'),
  photos: crudResource('/photos'),
  rfis: crudResource('/rfis'),
  punchList: crudResource('/punch-list'),
  purchaseOrders: crudResource('/purchase-orders'),
  meetings: crudResource('/meetings'),

  // Estimates (with line items sub-routes)
  estimates: {
    ...crudResource('/estimates'),
    createLineItem: (estimateId, data) =>
      request(`/estimates/${estimateId}/line-items`, { method: 'POST', body: data }),
    updateLineItem: (id, data) =>
      request(`/estimates/line-items/${id}`, { method: 'PUT', body: data }),
    deleteLineItem: (id) =>
      request(`/estimates/line-items/${id}`, { method: 'DELETE' }),
  },

  // Bid packages (with bids sub-routes)
  bidPackages: {
    ...crudResource('/bid-packages'),
    createBid: (packageId, data) =>
      request(`/bid-packages/${packageId}/bids`, { method: 'POST', body: data }),
    updateBid: (id, data) =>
      request(`/bid-packages/bids/${id}`, { method: 'PUT', body: data }),
    deleteBid: (id) =>
      request(`/bid-packages/bids/${id}`, { method: 'DELETE' }),
  },
};
