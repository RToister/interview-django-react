import type { TaskQuery } from "../api/types";
import { PRIORITY_LABELS, STATUS_LABELS } from "../api/types";

interface TaskFiltersProps {
  query: TaskQuery;
  onChange: (query: TaskQuery) => void;
}

export function TaskFilters({ query, onChange }: TaskFiltersProps) {
  const update = (patch: Partial<TaskQuery>) => onChange({ ...query, ...patch, page: 1 });

  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search tasks…"
        aria-label="Search tasks"
        value={query.search ?? ""}
        onChange={(e) => update({ search: e.target.value })}
      />
      <select
        aria-label="Filter by status"
        value={query.status ?? ""}
        onChange={(e) => update({ status: e.target.value as TaskQuery["status"] })}
      >
        <option value="">All statuses</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by priority"
        value={query.priority ?? ""}
        onChange={(e) => update({ priority: e.target.value as TaskQuery["priority"] })}
      >
        <option value="">All priorities</option>
        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort tasks"
        value={query.ordering ?? "-created_at"}
        onChange={(e) => update({ ordering: e.target.value })}
      >
        <option value="-created_at">Newest first</option>
        <option value="created_at">Oldest first</option>
        <option value="due_date">Due date ↑</option>
        <option value="-due_date">Due date ↓</option>
        <option value="-priority">Priority: high → low</option>
        <option value="priority">Priority: low → high</option>
      </select>
    </div>
  );
}
