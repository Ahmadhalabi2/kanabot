import axios, { AxiosError } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  MeResponse,
  ProjectWithStats,
  CreateProjectRequest,
  UpdateProjectRequest,
  Todo,
  TodoListQuery,
  CreateTodoRequest,
  UpdateTodoRequest,
  MoveTodoRequest,
  BulkCreateTodosRequest,
  BulkCreateTodosResponse,
  Sprint,
  CreateSprintRequest,
  UpdateSprintRequest,
  StartSprintRequest,
  CompleteSprintRequest,
  SprintBoardResponse,
  AiStatusResponse,
  GenerateTodosResponse,
  PlanSprintResponse,
  SprintSummaryResponse,
  ChatMessage,
  ChatResponse,
  ApiErrorBody,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export const http = axios.create({ baseURL: BASE_URL });

// Attach token to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('kanbot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise error messages + handle expired session (AUTH-6)
http.interceptors.response.use(
  (r) => r,
  (err: AxiosError<ApiErrorBody>) => {
    const status = err.response?.status;
    // 401 on any request except login/register → clear session and redirect
    const url = err.config?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('kanbot_token');
      // Base-aware redirect: strip the basename prefix from the current path so
      // the login page can navigate back to it via react-router, and prefix the
      // login URL with the base path so it works under a subpath (e.g. GitHub
      // Pages project site at "/kanabot/").
      const base = import.meta.env.BASE_URL;
      const basePrefix = base.replace(/\/+$/, '');
      const stripped = window.location.pathname.startsWith(basePrefix)
        ? window.location.pathname.slice(basePrefix.length) || '/'
        : window.location.pathname;
      const redirect = encodeURIComponent(stripped + window.location.search);
      window.location.href = `${base}login?redirect=${redirect}&expired=1`;
    }
    const msg = err.response?.data?.error?.message ?? err.message ?? 'Something went wrong';
    const code = err.response?.data?.error?.code ?? 'INTERNAL_ERROR';
    const details = err.response?.data?.error?.details;
    const enhanced = Object.assign(new Error(msg), { code, details, status });
    return Promise.reject(enhanced);
  },
);

// ── Auth ──────────────────────────────────────────────────────────
export const auth = {
  register: (body: RegisterRequest) =>
    http.post<AuthResponse>('/auth/register', body).then((r) => r.data),
  login: (body: LoginRequest) =>
    http.post<AuthResponse>('/auth/login', body).then((r) => r.data),
  me: () => http.get<MeResponse>('/auth/me').then((r) => r.data),
};

// ── Projects ──────────────────────────────────────────────────────
export const projects = {
  list: () =>
    http.get<{ projects: ProjectWithStats[] }>('/projects').then((r) => r.data.projects),
  get: (id: string) =>
    http.get<{ project: ProjectWithStats }>(`/projects/${id}`).then((r) => r.data.project),
  create: (body: CreateProjectRequest) =>
    http.post<{ project: ProjectWithStats }>('/projects', body).then((r) => r.data.project),
  update: (id: string, body: UpdateProjectRequest) =>
    http.patch<{ project: ProjectWithStats }>(`/projects/${id}`, body).then((r) => r.data.project),
  delete: (id: string) => http.delete(`/projects/${id}`),
};

// ── Todos ─────────────────────────────────────────────────────────
export const todos = {
  list: (projectId: string, query?: TodoListQuery) =>
    http
      .get<{ todos: Todo[] }>(`/projects/${projectId}/todos`, { params: query })
      .then((r) => r.data.todos),
  get: (todoId: string) =>
    http.get<{ todo: Todo }>(`/todos/${todoId}`).then((r) => r.data.todo),
  create: (projectId: string, body: CreateTodoRequest) =>
    http.post<{ todo: Todo }>(`/projects/${projectId}/todos`, body).then((r) => r.data.todo),
  bulk: (projectId: string, body: BulkCreateTodosRequest) =>
    http
      .post<BulkCreateTodosResponse>(`/projects/${projectId}/todos/bulk`, body)
      .then((r) => r.data),
  update: (todoId: string, body: UpdateTodoRequest) =>
    http.patch<{ todo: Todo }>(`/todos/${todoId}`, body).then((r) => r.data.todo),
  move: (todoId: string, body: MoveTodoRequest) =>
    http.post<{ todo: Todo }>(`/todos/${todoId}/move`, body).then((r) => r.data.todo),
  delete: (todoId: string) => http.delete(`/todos/${todoId}`),
};

// ── Sprints ───────────────────────────────────────────────────────
export const sprints = {
  list: (projectId: string) =>
    http
      .get<{ sprints: Sprint[] }>(`/projects/${projectId}/sprints`)
      .then((r) => r.data.sprints),
  get: (sprintId: string) =>
    http.get<{ sprint: Sprint }>(`/sprints/${sprintId}`).then((r) => r.data.sprint),
  board: (sprintId: string) =>
    http.get<SprintBoardResponse>(`/sprints/${sprintId}/todos`).then((r) => r.data),
  create: (projectId: string, body: CreateSprintRequest) =>
    http
      .post<{ sprint: Sprint }>(`/projects/${projectId}/sprints`, body)
      .then((r) => r.data.sprint),
  update: (sprintId: string, body: UpdateSprintRequest) =>
    http.patch<{ sprint: Sprint }>(`/sprints/${sprintId}`, body).then((r) => r.data.sprint),
  delete: (sprintId: string) => http.delete(`/sprints/${sprintId}`),
  start: (sprintId: string, body?: StartSprintRequest) =>
    http.post<{ sprint: Sprint }>(`/sprints/${sprintId}/start`, body ?? {}).then((r) => r.data.sprint),
  complete: (sprintId: string, body: CompleteSprintRequest) =>
    http
      .post<{ sprint: Sprint }>(`/sprints/${sprintId}/complete`, body)
      .then((r) => r.data.sprint),
};

// ── AI ────────────────────────────────────────────────────────────
export const ai = {
  status: () => http.get<AiStatusResponse>('/ai/status').then((r) => r.data),
  generateTodos: (projectId: string, prompt: string, count = 5) =>
    http
      .post<GenerateTodosResponse>(`/projects/${projectId}/ai/generate-todos`, { prompt, count })
      .then((r) => r.data),
  planSprint: (projectId: string, capacity: number, focus?: string) =>
    http
      .post<PlanSprintResponse>(`/projects/${projectId}/ai/plan-sprint`, { capacity, focus })
      .then((r) => r.data),
  summarizeSprint: (sprintId: string) =>
    http
      .post<SprintSummaryResponse>(`/sprints/${sprintId}/ai/summary`)
      .then((r) => r.data),
  chat: (projectId: string, messages: ChatMessage[]) =>
    http
      .post<ChatResponse>(`/projects/${projectId}/ai/chat`, { messages })
      .then((r) => r.data),
};
