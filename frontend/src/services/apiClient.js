import { mockWorkers, mockJobs, mockInvoices, mockMessages } from '../data/mockData.js';

// In later steps, replace these with real HTTP calls to the FastAPI backend.

export const authApi = {
  login: async ({ email, password, role }) => {
    // Mock: accept any credentials and return a basic user object.
    return {
      id: 'u1',
      name: email.split('@')[0] || 'User',
      email,
      role,
    };
  },
  signup: async ({ name, email, password, role }) => {
    // Mock: echo back a created user.
    return {
      id: 'u2',
      name,
      email,
      role,
    };
  },
};

export const workerApi = {
  listWorkers: async (filters = {}) => {
    const { serviceId } = filters;
    let workers = [...mockWorkers];
    if (serviceId) {
      workers = workers.filter((w) => w.services.includes(serviceId));
    }
    return workers;
  },
  getWorkerJobs: async (workerId) => {
    return mockJobs.filter((j) => j.workerId === workerId);
  },
};

export const clientApi = {
  listInvoices: async () => {
    return mockInvoices;
  },
};

export const chatApi = {
  listMessages: async () => {
    return mockMessages;
  },
  sendMessage: async ({ from, text }) => {
    const message = {
      id: `m-${Date.now()}`,
      from,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    // In a real app this would POST to backend /chat; here we just echo.
    return message;
  },
};
