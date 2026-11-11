import type { Page, Task, TaskInput, TaskQuery, TaskStats, User } from "./types";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || "/api";
const TOKEN_KEY = "task-manager.token";

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Both backends return errors as `{"detail": "..."}` or
 * `{"field": ["message", ...]}`; normalise them into one ApiError.
 */
export function parseError(status: number, body: unknown): ApiError {
  if (body && typeof body === "object") {
    const data = body as Record<string, unknown>;
    if (typeof data.detail === "string") {
      return new ApiError(status, data.detail);
    }
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, value] of Object.entries(data)) {
      const messages = Array.isArray(value) ? value.map(String) : [String(value)];
      fieldErrors[field] = messages;
    }
    const first = Object.values(fieldErrors)[0]?.[0];
    if (first) {
      return new ApiError(status, first, fieldErrors);
    }
  }
  return new ApiError(status, `Request failed with status ${status}`);
}

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = tokenStorage.get();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw parseError(response.status, body);
  }
  return body as T;
}

function toQueryString(query: TaskQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "" && value !== null) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  register: (data: { username: string; email: string; password: string }) =>
    request<User>("/auth/register/", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { username: string; password: string }) =>
    request<{ access_token: string; token_type: string }>("/auth/token/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<User>("/auth/me/"),

  listTasks: (query: TaskQuery = {}) => request<Page<Task>>(`/tasks/${toQueryString(query)}`),

  taskStats: () => request<TaskStats>("/tasks/stats/"),

  createTask: (data: TaskInput) =>
    request<Task>("/tasks/", { method: "POST", body: JSON.stringify(data) }),

  updateTask: (id: number, data: Partial<TaskInput>) =>
    request<Task>(`/tasks/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteTask: (id: number) => request<void>(`/tasks/${id}/`, { method: "DELETE" }),
};
