// ── Reports ────────────────────────────────────────────────────────────────
export const reportsApi = {
  usersHistory: async (token: string) =>
    apiRequest<any[]>('/reports/users-history', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }),
  serviceActivity: async (token: string) =>
    apiRequest<any[]>('/reports/service-activity', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }),
  queueStats: async (token: string) =>
    apiRequest<any>('/reports/queue-stats', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }),
};
// MongoDB backend: port 5001   

import BASE_URL from './config';

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
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
    apiRequest<{ message: string; user: any }>('/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, phone?: string) =>
    apiRequest<{ message: string; user: any }>('/auth/register', {
      method: 'POST',
      body:   JSON.stringify({ name, email, password, phone }),
    }),
};

// ── Services ──────────────────────────────────────────────────────────────────
export const servicesApi = {
  getAll: () =>
    apiRequest<any[]>('/services'),

  getById: (id: string) =>
    apiRequest<any>(`/services/${id}`),

  create: (payload: {
    name:             string;
    description:      string;
    expectedDuration: number;   // renamed from duration
    priorityLevel:    string;   // renamed from priority
  }) =>
    apiRequest<{ message: string; service: any }>('/services', {
      method: 'POST',
      body:   JSON.stringify(payload),
    }),

  update: (
    id: string,
    payload: Partial<{
      name:             string;
      description:      string;
      expectedDuration: number;  // renamed from duration
      priorityLevel:    string;  // renamed from priority
    }>
  ) =>
    apiRequest<{ message: string; service: any }>(`/services/${id}`, {
      method: 'PUT',
      body:   JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string; service: any }>(`/services/${id}`, {
      method: 'DELETE',
    }),
};

// ── Queue ─────────────────────────────────────────────────────────────────────
export const queueApi = {
  /** Get all active queue entries (admin view). */
  getAll: () =>
    apiRequest<any[]>('/queue'),

  /** Get queue entries for a specific user. */
  getForUser: (userId: string) =>
    apiRequest<any[]>(`/queue/user/${userId}`),

  /** User joins a service queue. */
  join: (userId: string, name: string, serviceId: string) =>
    apiRequest<{ message: string; entry: any }>('/queue/join', {
      method: 'POST',
      body:   JSON.stringify({ userId, name, serviceId }),
    }),

  /** User cancels their place by queue entry id. */
  leaveByEntry: (entryId: string) =>
    apiRequest<{ message: string; removed: any }>('/queue/leave-by-id', {
      method: 'POST',
      body:   JSON.stringify({ entryId }),
    }),

  /** User cancels by userId + serviceId. */
  leaveByUser: (userId: string, serviceId: string) =>
    apiRequest<{ message: string; removed: any }>('/queue/leave', {
      method: 'POST',
      body:   JSON.stringify({ userId, serviceId }),
    }),

  /** Admin serves the next waiting user for a service. */
  serveNext: (serviceId: string) =>
    apiRequest<{ message: string; served: any }>('/queue/serve-next', {
      method: 'POST',
      body:   JSON.stringify({ serviceId }),
    }),

  /** Admin force-removes a user by entry id. */
  remove: (entryId: string) =>
    apiRequest<{ message: string; removed: any }>('/queue/remove', {
      method: 'POST',
      body:   JSON.stringify({ entryId }),
    }),

  /** Admin resets all active queues. */
  reset: () =>
    apiRequest<{ message: string }>('/queue/reset', { method: 'POST' }),

  /** Get estimated wait time for a queue entry. */
  getWaitTime: (entryId: string) =>
    apiRequest<{ entryId: string; estimatedWaitMinutes: number }>(
      `/queue/wait-time/${entryId}`
    ),
};

// ── History ───────────────────────────────────────────────────────────────────
export const historyApi = {
  /** All history records (admin). */
  getAll: () =>
    apiRequest<any[]>('/history'),

  /** History for a specific user. */
  getForUser: (userId: string) =>
    apiRequest<any[]>(`/history/user/${userId}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  /** Fetch all unread + recent notifications for a user. */
  getForUser: (userId: string) =>
    apiRequest<any[]>(`/notifications/user/${userId}`),

  /** Mark a notification as viewed (status: sent → viewed). */
  markViewed: (id: string) =>
    apiRequest<{ message: string }>(`/notifications/${id}/viewed`, {
      method: 'PATCH',
    }),

  /** Dismiss (delete) a notification. */
  dismiss: (id: string) =>
    apiRequest<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    }),
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileApi = {
  /** Get full profile for a user (includes role). */
  get: (credentialId: string) =>
    apiRequest<{
      id: string;
      credentialId: string;
      email: string;
      fullName: string;
      phone: string;
      contactInfo: string;
      preferences: Record<string, any>;
      role: string;
      updatedAt: string;
    }>(`/profile/${credentialId}`),

  /** Update editable profile fields (fullName, phone, contactInfo). */
  update: (
    credentialId: string,
    payload: Partial<{ fullName: string; phone: string; contactInfo: string }>
  ) =>
    apiRequest<{ message: string; profile: any }>(`/profile/${credentialId}`, {
      method: 'PATCH',
      body:   JSON.stringify(payload),
    }),
};
