import { useState, type FormEvent } from "react";

import { ApiError } from "../api/client";
import type { Task, TaskInput } from "../api/types";
import { PRIORITY_LABELS, STATUS_LABELS } from "../api/types";

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (data: TaskInput) => Promise<void>;
  onCancel: () => void;
}

const EMPTY: TaskInput = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  due_date: null,
};

export function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const [data, setData] = useState<TaskInput>(() =>
    task
      ? {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date,
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!data.title.trim()) {
      setErrors({ title: ["Title is required."] });
      return;
    }
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      await onSubmit({ ...data, title: data.title.trim() });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setErrors(err.fieldErrors);
      } else {
        setFormError(err instanceof Error ? err.message : "Could not save the task.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card task-form" onSubmit={handleSubmit} noValidate>
      <h2>{task ? "Edit task" : "New task"}</h2>

      {formError && (
        <div className="alert" role="alert">
          {formError}
        </div>
      )}

      <label className="field">
        <span>Title</span>
        <input
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={200}
          aria-invalid={Boolean(errors.title)}
          autoFocus
        />
        {errors.title && <small className="error">{errors.title[0]}</small>}
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          rows={3}
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>

      <div className="form-row">
        <label className="field">
          <span>Status</span>
          <select
            value={data.status}
            onChange={(e) => set("status", e.target.value as TaskInput["status"])}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Priority</span>
          <select
            value={data.priority}
            onChange={(e) => set("priority", e.target.value as TaskInput["priority"])}
          >
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Due date</span>
          <input
            type="date"
            value={data.due_date ?? ""}
            onChange={(e) => set("due_date", e.target.value || null)}
          />
          {errors.due_date && <small className="error">{errors.due_date[0]}</small>}
        </label>
      </div>

      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : task ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}
