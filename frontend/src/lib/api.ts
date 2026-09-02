export type Role = 'MEMBER' | 'MENTOR' | 'MANAGER';
export type AttendanceStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  coins: number;
}

export interface EventAttendance {
  id: string;
  status: AttendanceStatus;
  coinsAwarded: number;
  requestedAt: string;
  confirmedAt: string | null;
  user: { id: string; name: string };
  confirmedBy: { id: string; name: string } | null;
}

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  coinValue: number;
  createdBy: { id: string; name: string };
  attendances: EventAttendance[];
}

export class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.error ?? `Request failed with status ${res.status}`);
  }
  return body as T;
}

export const api = {
  me: () => request<User>('/api/auth/me'),
  login: (email: string, password: string) =>
    request<User>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string, role: Role) =>
    request<User>('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),

  listUsers: () => request<User[]>('/api/users'),

  listEvents: () => request<EventItem[]>('/api/events'),
  createEvent: (data: { title: string; description?: string; location?: string; startsAt: string; endsAt?: string; coinValue?: number }) =>
    request<EventItem>('/api/events', { method: 'POST', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => request<void>(`/api/events/${id}`, { method: 'DELETE' }),

  signUp: (eventId: string, attended: boolean) =>
    request<EventAttendance>(`/api/events/${eventId}/signup`, { method: 'POST', body: JSON.stringify({ attended }) }),
  confirmAttendance: (eventId: string, userId: string) =>
    request<EventAttendance>(`/api/events/${eventId}/attendance/${userId}/confirm`, { method: 'POST' }),
  cancelAttendance: (eventId: string, userId: string) =>
    request<void>(`/api/events/${eventId}/attendance/${userId}`, { method: 'DELETE' }),
};
