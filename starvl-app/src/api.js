const BASE = process.env.REACT_APP_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');

let _token = null;

export function setApiToken(t)  { _token = t; }
export function clearApiToken() { _token = null; }

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401 && path !== '/api/starvl-users/auth') {
    clearApiToken();
    window.dispatchEvent(new CustomEvent('starvl:unauthorized'));
  }
  return res;
}
