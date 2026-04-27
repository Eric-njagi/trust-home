const TOKEN_KEY = 'trusthome_token';

function getApiBaseUrl() {
  // Vite injects env vars under import.meta.env.* at build time.
  // Default: relative calls to same origin (works with dev proxy / reverse proxy).
  const raw = import.meta?.env?.VITE_API_URL;
  const base = typeof raw === 'string' ? raw.trim() : '';
  return base ? base.replace(/\/+$/, '') : '';
}

function buildApiUrl(path) {
  const base = getApiBaseUrl();
  if (!base) return path;
  if (!path) return base;
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, sendAuth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (sendAuth) {
    const t = getStoredToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(buildApiUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail = data?.detail;
    const msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join(', ')
          : res.statusText;
    throw new Error(msg || 'Request failed');
  }
  return data;
}

export const authApi = {
  login: async ({ email, password, role }) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password, role },
      sendAuth: false,
    });
    setStoredToken(data.access_token);
    return data.user;
  },
  signup: async ({ name, email, password, role, hourlyRate }) => {
    const body = { name, email, password, role };
    if (role === 'worker' && hourlyRate != null) body.hourlyRate = hourlyRate;
    const data = await request('/api/auth/signup', {
      method: 'POST',
      body,
      sendAuth: false,
    });
    setStoredToken(data.access_token);
    return data.user;
  },
};

export const workerApi = {
  listWorkers: async (filters = {}) => {
    const { serviceId } = filters;
    const q = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : '';
    return request(`/api/workers${q}`);
  },
  getMyJobs: async () => {
    return request('/api/workers/me/jobs');
  },
  getMyProfile: async () => {
    return request('/api/workers/me');
  },
  updateMyProfile: async (payload) => {
    return request('/api/workers/me', { method: 'PATCH', body: payload });
  },
  updateJobStatus: async (jobId, status) => {
    return request(`/api/workers/me/jobs/${jobId}`, {
      method: 'PATCH',
      body: { status },
    });
  },
};

export const clientApi = {
  listInvoices: async () => {
    return request('/api/clients/me/invoices');
  },
  createBooking: async (payload) => {
    return request('/api/clients/me/bookings', { method: 'POST', body: payload });
  },
  payInvoice: async (invoiceId, { mpesaPhone }) => {
    return request(`/api/clients/me/invoices/${invoiceId}/pay`, {
      method: 'PATCH',
      body: { mpesaPhone },
    });
  },
};

export const chatApi = {
  listMessages: async () => {
    return request('/api/chat/messages');
  },
  sendMessage: async ({ from, text }) => {
    return request('/api/chat/messages', {
      method: 'POST',
      body: { from, text },
    });
  },
};
