export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export type TaskInput = Pick<Task, "title" | "description" | "status" | "priority" | "due_date">;

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface TaskQuery {
  status?: TaskStatus | "";
  priority?: TaskPriority | "";
  search?: string;
  ordering?: string;
  page?: number;
}

export const PAGE_SIZE = 10;

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
