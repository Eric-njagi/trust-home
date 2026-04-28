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
  signup: async ({ name, email, password, role, city, phoneNumber, idNumber, hourlyRate }) => {
    const body = { name, email, password, role, city, phoneNumber, idNumber };
    if (role === 'worker' && hourlyRate != null) body.hourlyRate = hourlyRate;
    const data = await request('/api/auth/signup', {
      method: 'POST',
      body,
      sendAuth: false,
    });
    setStoredToken(data.access_token);
    return data.user;
  },
  updateMe: async ({ name, email, city, phoneNumber, idNumber }) => {
    return request('/api/auth/me', {
      method: 'PATCH',
      body: { name, email, city, phoneNumber, idNumber },
    });
  },
};

export const workerApi = {
  listWorkers: async (filters = {}) => {
    const { serviceId, city } = filters;
    const params = new URLSearchParams();
    if (serviceId) params.set('serviceId', serviceId);
    if (city) params.set('city', city);
    const q = params.toString() ? `?${params.toString()}` : '';
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
  completeJob: async (jobId, { hoursWorked, monthlyAmount }) => {
    return request(`/api/workers/me/jobs/${jobId}/complete`, {
      method: 'PATCH',
      body: { hoursWorked, monthlyAmount },
    });
  },
};

export const clientApi = {
  listInvoices: async () => {
    return request('/api/clients/me/invoices');
  },
  listMyJobs: async () => {
    return request('/api/clients/me/jobs');
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
  listContacts: async () => {
    return request('/api/chat/contacts');
  },
  listMessages: async ({ peerUserId }) => {
    const params = new URLSearchParams();
    if (peerUserId) params.set('peerUserId', peerUserId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/chat/messages${q}`);
  },
  sendMessage: async ({ toUserId, text }) => {
    return request('/api/chat/messages', {
      method: 'POST',
      body: { toUserId, text },
    });
  },
};
