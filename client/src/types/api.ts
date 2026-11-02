/**
 * Kanbot API contract — copied from server/src/types/api.ts
 */

// ───────────────────────────── Errors ─────────────────────────────

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'AI_ERROR'
  | 'INTERNAL_ERROR';

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: { path: string; message: string }[];
  };
}

// ───────────────────────────── Health ─────────────────────────────

export interface HealthResponse {
  status: 'ok';
  version: string;
  time: string;
}

// ───────────────────────────── Auth ─────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

// ───────────────────────────── Projects ─────────────────────────────

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithStats extends Project {
  stats: {
    backlogCount: number;
    totalTodos: number;
    activeSprint: { id: string; name: string } | null;
  };
}

export interface CreateProjectRequest {
  name: string;
  key?: string;
  description?: string;
}

export type UpdateProjectRequest = Partial<CreateProjectRequest>;

// ───────────────────────────── Todos ─────────────────────────────

export const TODO_STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const;
export type TodoStatus = (typeof TODO_STATUSES)[number];

export const TODO_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TodoPriority = (typeof TODO_PRIORITIES)[number];

export const TODO_TYPES = ['task', 'story', 'bug'] as const;
export type TodoType = (typeof TODO_TYPES)[number];

export const STORY_POINTS = [1, 2, 3, 5, 8, 13] as const;
export type StoryPoints = (typeof STORY_POINTS)[number];

export interface Todo {
  id: string;
  projectId: string;
  sprintId: string | null;
  key: string;
  title: string;
  description: string;
  type: TodoType;
  status: TodoStatus;
  priority: TodoPriority;
  storyPoints: StoryPoints | null;
  labels: string[];
  dueDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  type?: TodoType;
  status?: TodoStatus;
  priority?: TodoPriority;
  storyPoints?: StoryPoints | null;
  labels?: string[];
  dueDate?: string | null;
  sprintId?: string | null;
}

export interface BulkCreateTodosRequest {
  todos: CreateTodoRequest[];
}

export interface BulkCreateTodosResponse {
  todos: Todo[];
}

export type UpdateTodoRequest = Partial<CreateTodoRequest>;

export interface MoveTodoRequest {
  sprintId?: string | null;
  status?: TodoStatus;
  position: number;
}

export interface TodoListResponse {
  todos: Todo[];
}

export interface TodoListQuery {
  sprintId?: 'backlog' | string;
  status?: TodoStatus;
  priority?: TodoPriority;
  type?: TodoType;
  search?: string;
}

// ───────────────────────────── Sprints ─────────────────────────────

export type SprintStatus = 'planned' | 'active' | 'completed';

export interface SprintStats {
  totalTodos: number;
  doneTodos: number;
  totalPoints: number;
  donePoints: number;
  byStatus: Record<TodoStatus, number>;
}

export interface SprintSummary {
  content: string;
  source: AiSource;
  generatedAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string | null;
  endDate: string | null;
  status: SprintStatus;
  startedAt: string | null;
  completedAt: string | null;
  completedStats: (SprintStats & { carriedOver: number }) | null;
  summary: SprintSummary | null;
  stats: SprintStats;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintRequest {
  name?: string;
  goal?: string;
  startDate?: string | null;
  endDate?: string | null;
  todoIds?: string[];
}

export type UpdateSprintRequest = Omit<CreateSprintRequest, 'todoIds'>;

export interface StartSprintRequest {
  startDate?: string;
  endDate?: string;
}

export interface CompleteSprintRequest {
  moveUnfinishedTo: 'backlog' | string;
}

export interface SprintListResponse {
  sprints: Sprint[];
}

export interface SprintBoardResponse {
  sprint: Sprint;
  columns: Record<TodoStatus, Todo[]>;
}

// ───────────────────────────── AI assistant ─────────────────────────────

export type AiSource = 'mock' | 'ai';

export interface AiStatusResponse {
  mode: AiSource;
  model: string | null;
}

export interface DraftTodo {
  title: string;
  description: string;
  type: TodoType;
  priority: TodoPriority;
  storyPoints: StoryPoints | null;
}

export interface GenerateTodosResponse {
  todos: DraftTodo[];
  source: AiSource;
}

export interface PlanSprintResponse {
  goal: string;
  todoIds: string[];
  totalPoints: number;
  reasoning: string;
  source: AiSource;
}

export interface SprintSummaryResponse {
  sprint: Sprint;
  summary: SprintSummary;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: ChatMessage;
  source: AiSource;
}
