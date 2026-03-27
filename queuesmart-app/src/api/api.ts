// src/api/api.ts
// Central API client for QueueSmart backend (http://127.0.0.1:5001)

const BASE_URL = 'http://127.0.0.1:5001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ message: string; user: any }>('/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<{ message: string; user: any }>('/auth/register', {
      method: 'POST',
      body:   JSON.stringify({ name, email, password }),
    }),
};

// ── Services ──────────────────────────────────────────────────────────────────
export const servicesApi = {
  getAll: () => request<any[]>('/services'),

  getById: (id: number) => request<any>(`/services/${id}`),

  create: (payload: { name: string; description: string; duration: number; priority: string }) =>
    request<{ message: string; service: any }>('/services', {
      method: 'POST',
      body:   JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<{ name: string; description: string; duration: number; priority: string }>) =>
    request<{ message: string; service: any }>(`/services/${id}`, {
      method: 'PUT',
      body:   JSON.stringify(payload),
    }),

  // ── ADDED: delete service endpoint
  delete: (id: number) =>
    request<{ message: string; service: any }>(`/services/${id}`, {
      method: 'DELETE',
    }),
};

// ── Queue ─────────────────────────────────────────────────────────────────────
export const queueApi = {
  getAll: () => request<any[]>('/queue'),

  getForUser: (userId: number | string) => request<any[]>(`/queue/user/${userId}`),

  join: (userId: number | string, name: string, serviceId: number) =>
    request<{ message: string; entry: any; queue: any[] }>('/queue/join', {
      method: 'POST',
      body:   JSON.stringify({ userId, name, serviceId }),
    }),

  leaveByEntry: (entryId: number) =>
    request<{ message: string; removed: any }>('/queue/leave-by-id', {
      method: 'POST',
      body:   JSON.stringify({ entryId }),
    }),

  leaveByUser: (userId: number | string, serviceId: number) =>
    request<{ message: string; removed: any }>('/queue/leave', {
      method: 'POST',
      body:   JSON.stringify({ userId, serviceId }),
    }),

  serveNext: (serviceId: number) =>
    request<{ message: string; served: any; queue: any[] }>('/queue/serve-next', {
      method: 'POST',
      body:   JSON.stringify({ serviceId }),
    }),

  remove: (entryId: number) =>
    request<{ message: string; removed: any }>('/queue/remove', {
      method: 'POST',
      body:   JSON.stringify({ entryId }),
    }),

  reset: () => request<{ message: string }>('/queue/reset', { method: 'POST' }),

  getWaitTime: (entryId: number) =>
    request<{ entryId: number; estimatedWaitMinutes: number }>(`/queue/wait-time/${entryId}`),
};

// ── History ───────────────────────────────────────────────────────────────────
export const historyApi = {
  getAll:       ()                    => request<any[]>('/history'),
  getForUser:   (userId: number | string) => request<any[]>(`/history/user/${userId}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  getForUser: (userId: number | string) => request<any[]>(`/notifications/user/${userId}`),
  dismiss:    (id: number)              => request<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),
};