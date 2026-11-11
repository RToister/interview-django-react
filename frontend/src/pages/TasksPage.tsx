import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "../api/client";
import type { Page, Task, TaskInput, TaskQuery, TaskStats, TaskStatus } from "../api/types";
import { PAGE_SIZE } from "../api/types";
import { useAuth } from "../auth/useAuth";
import { Pagination } from "../components/Pagination";
import { StatsBar } from "../components/StatsBar";
import { TaskFilters } from "../components/TaskFilters";
import { TaskForm } from "../components/TaskForm";
import { TaskItem } from "../components/TaskItem";
import { useDebouncedValue } from "../hooks";

type Editor = { mode: "closed" } | { mode: "create" } | { mode: "edit"; task: Task };

export function TasksPage() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState<TaskQuery>({ ordering: "-created_at", page: 1 });
  const [data, setData] = useState<Page<Task> | null>(null);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>({ mode: "closed" });

  const debouncedSearch = useDebouncedValue(query.search ?? "");
  const effectiveQuery: TaskQuery = { ...query, search: debouncedSearch };
  const queryKey = JSON.stringify(effectiveQuery);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong.");
    },
    [logout],
  );

  // Bumping the counter re-runs the effect below and refetches the data.
  const [refreshCount, setRefreshCount] = useState(0);
  const requestKey = `${queryKey}#${refreshCount}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== requestKey;
  const reload = useCallback(() => setRefreshCount((count) => count + 1), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listTasks(JSON.parse(queryKey) as TaskQuery), api.taskStats()])
      .then(([page, newStats]) => {
        if (!cancelled) {
          setData(page);
          setStats(newStats);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          handleError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadedKey(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey, requestKey, handleError]);

  async function saveTask(input: TaskInput) {
    if (editor.mode === "edit") {
      await api.updateTask(editor.task.id, input);
    } else {
      await api.createTask(input);
    }
    setEditor({ mode: "closed" });
    reload();
  }

  async function changeStatus(task: Task, status: TaskStatus) {
    try {
      await api.updateTask(task.id, { status });
      reload();
    } catch (err) {
      handleError(err);
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }
    try {
      await api.deleteTask(task.id);
      const isLastOnPage = data?.results.length === 1 && (query.page ?? 1) > 1;
      if (isLastOnPage) {
        setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }));
      } else {
        reload();
      }
    } catch (err) {
      handleError(err);
    }
  }

  const hasFilters = Boolean(query.search || query.status || query.priority);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ✓
          </span>
          Task Manager
        </div>
        <div className="topbar-user">
          <span className="muted">{user?.username}</span>
          <button className="btn btn-small" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="container">
        <div className="page-header">
          <div>
            <h1>My tasks</h1>
            <p className="muted">Plan, prioritise and track your work.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setEditor({ mode: "create" })}>
            + New task
          </button>
        </div>

        <StatsBar stats={stats} />

        {editor.mode !== "closed" && (
          <TaskForm
            key={editor.mode === "edit" ? editor.task.id : "new"}
            task={editor.mode === "edit" ? editor.task : null}
            onSubmit={saveTask}
            onCancel={() => setEditor({ mode: "closed" })}
          />
        )}

        <TaskFilters query={query} onChange={setQuery} />

        {error && (
          <div className="alert" role="alert">
            {error}{" "}
            <button className="btn btn-small" onClick={reload}>
              Retry
            </button>
          </div>
        )}

        {loading && !data ? (
          <p className="muted center">Loading…</p>
        ) : data && data.results.length > 0 ? (
          <ul className={`task-list ${loading ? "is-loading" : ""}`}>
            {data.results.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={(t) => setEditor({ mode: "edit", task: t })}
                onDelete={deleteTask}
                onStatusChange={changeStatus}
              />
            ))}
          </ul>
        ) : (
          <div className="empty card">
            <p>{hasFilters ? "No tasks match your filters." : "No tasks yet."}</p>
            {!hasFilters && (
              <button className="btn btn-primary" onClick={() => setEditor({ mode: "create" })}>
                Create your first task
              </button>
            )}
          </div>
        )}

        {data && (
          <Pagination
            page={query.page ?? 1}
            total={data.count}
            pageSize={PAGE_SIZE}
            onChange={(page) => setQuery((prev) => ({ ...prev, page }))}
          />
        )}
      </main>
    </div>
  );
}
