/* ── API Client ─────────────────────────────────────────────
   All server communication goes through this module.
   Token is stored in localStorage and sent as Bearer header.
───────────────────────────────────────────────────────────── */
const API = (() => {
  const BASE = '/api';

  function getToken() {
    return localStorage.getItem('qm_token');
  }

  function setToken(token) {
    localStorage.setItem('qm_token', token);
  }

  function clearToken() {
    localStorage.removeItem('qm_token');
    localStorage.removeItem('qm_user');
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && !path.startsWith('/auth/')) {
        clearToken();
        if (typeof logout === 'function') logout();
      }
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  const get    = (path)         => request('GET',    path);
  const post   = (path, body)   => request('POST',   path, body);
  const put    = (path, body)   => request('PUT',    path, body);
  const del    = (path)         => request('DELETE', path);

  return { get, post, put, del, getToken, setToken, clearToken };
})();
