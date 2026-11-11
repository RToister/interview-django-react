import type { Task, TaskStatus } from "../api/types";
import { PRIORITY_LABELS, STATUS_LABELS } from "../api/types";

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function TaskItem({ task, onEdit, onDelete, onStatusChange }: TaskItemProps) {
  const done = task.status === "done";

  return (
    <li className={`task ${done ? "task-done" : ""}`}>
      <input
        type="checkbox"
        className="task-check"
        checked={done}
        aria-label={done ? `Mark "${task.title}" as to do` : `Mark "${task.title}" as done`}
        onChange={() => onStatusChange(task, done ? "todo" : "done")}
      />

      <div className="task-body">
        <div className="task-title">{task.title}</div>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-meta">
          <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
          <span className={`badge badge-priority-${task.priority}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.due_date && (
            <span className={`badge ${task.is_overdue ? "badge-overdue" : ""}`}>
              {task.is_overdue ? "Overdue · " : "Due "}
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <button type="button" className="btn btn-small" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button
          type="button"
          className="btn btn-small btn-danger"
          onClick={() => onDelete(task)}
          aria-label={`Delete "${task.title}"`}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
