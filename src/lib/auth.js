/**
 * Authentication state management for BuildFlow CRM.
 * Stores JWT in localStorage so sessions survive page refreshes.
 */

import { api, setToken, clearToken, getToken } from './api';

const TOKEN_KEY = 'bf_token';

export async function signup({ email, password, name, companyName, companySlug }) {
  const result = await api.auth.signup({ email, password, name, companyName, companySlug });
  setToken(result.token);
  localStorage.setItem(TOKEN_KEY, result.token);
  return result;
}

export async function login({ email, password }) {
  const result = await api.auth.login({ email, password });
  setToken(result.token);
  localStorage.setItem(TOKEN_KEY, result.token);
  return result;
}

export function logout() {
  clearToken();
  localStorage.removeItem(TOKEN_KEY);
}

export async function restoreSession() {
  const saved = localStorage.getItem(TOKEN_KEY);
  if (!saved) return null;
  // Put the saved token back in memory so the API client sends it
  setToken(saved);
  try {
    const result = await api.auth.me();
    // Server returns a fresh token — update both stores
    if (result.token) {
      setToken(result.token);
      localStorage.setItem(TOKEN_KEY, result.token);
    }
    return result;
  } catch {
    // Token expired or invalid — clean up
    clearToken();
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}
