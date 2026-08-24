import { useState, useCallback } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const TOKEN_KEY = 'wm_admin_token';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}, token = null) {
  const t = token || getToken();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(t ? { Authorization: `Bearer ${t}` } : {})
  };

  let r;
  try {
    r = await fetch(`${API}${path}`, { ...options, headers });
  } catch (networkErr) {
    throw new Error('Network error. Please check your connection.');
  }

  let d = {};
  try {
    d = await r.json();
  } catch {
    // Empty or non-JSON response
  }

  if (r.status === 401) {
    clearToken();
    throw Object.assign(new Error('Session expired. Please sign in again.'), { code: 401 });
  }
  if (!r.ok) {
    throw new Error(d.error || `Request failed (${r.status})`);
  }
  return d;
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (path, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api(path, options);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error, setError };
}
