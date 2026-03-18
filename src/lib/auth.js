/**
 * Authentication state management for BuildFlow CRM.
 * Stores JWT in memory (not localStorage) to prevent XSS token theft.
 * Persists a refresh indicator in sessionStorage so page reloads
 * can attempt to restore the session via /api/auth/me.
 */

import { api, setToken, clearToken } from './api';

const SESSION_KEY = 'bf_authenticated';

export async function signup({ email, password, name, companyName, companySlug }) {
  const result = await api.auth.signup({ email, password, name, companyName, companySlug });
  setToken(result.token);
  sessionStorage.setItem(SESSION_KEY, '1');
  return result;
}

export async function login({ email, password }) {
  const result = await api.auth.login({ email, password });
  setToken(result.token);
  sessionStorage.setItem(SESSION_KEY, '1');
  return result;
}

export function logout() {
  clearToken();
  sessionStorage.removeItem(SESSION_KEY);
}

export async function restoreSession() {
  if (!sessionStorage.getItem(SESSION_KEY)) return null;
  try {
    // Token is still in memory if page hasn't fully reloaded.
    // If token is gone, this will fail with 401 and we clear the session.
    return await api.auth.me();
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}
