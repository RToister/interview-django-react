import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "../App";
import type { Task } from "../api/types";
import { AuthProvider } from "../auth/AuthContext";
import { mockFetch } from "./mockFetch";

const user = { id: 1, username: "alice", email: "" };

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 1,
  title: "Write tests",
  description: "",
  status: "todo",
  priority: "high",
  due_date: null,
  is_overdue: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const stats = { total: 1, todo: 1, in_progress: 0, done: 0, overdue: 0 };

function renderApp(path = "/") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("App", () => {
  it("redirects anonymous users to the login page", async () => {
    renderApp("/");

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("validates the login form before sending a request", async () => {
    const fetchMock = mockFetch({});
    renderApp("/login");

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Username and password are required.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the API error for wrong credentials", async () => {
    mockFetch({
      "POST /api/auth/token/": () => ({
        status: 401,
        body: { detail: "Incorrect username or password." },
      }),
    });
    renderApp("/login");

    await userEvent.type(screen.getByLabelText("Username"), "alice");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect username or password.");
  });

  it("logs in and shows the task list", async () => {
    mockFetch({
      "POST /api/auth/token/": () => ({ body: { access_token: "token", token_type: "bearer" } }),
      "GET /api/auth/me/": () => ({ body: user }),
      "GET /api/tasks/": () => ({
        body: { count: 1, next: null, previous: null, results: [task()] },
      }),
      "GET /api/tasks/stats/": () => ({ body: stats }),
    });
    renderApp("/login");

    await userEvent.type(screen.getByLabelText("Username"), "alice");
    await userEvent.type(screen.getByLabelText("Password"), "S3cure-pass!");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Write tests")).toBeInTheDocument();
    expect(localStorage.getItem("task-manager.token")).toBe("token");
  });

  it("creates a task", async () => {
    localStorage.setItem("task-manager.token", "token");
    const tasks: Task[] = [];
    mockFetch({
      "GET /api/auth/me/": () => ({ body: user }),
      "GET /api/tasks/": () => ({
        body: { count: tasks.length, next: null, previous: null, results: tasks },
      }),
      "GET /api/tasks/stats/": () => ({ body: { ...stats, total: tasks.length } }),
      "POST /api/tasks/": (_url, init) => {
        const created = task({ ...JSON.parse(String(init.body)), id: 2 });
        tasks.push(created);
        return { status: 201, body: created };
      },
    });
    renderApp("/");

    expect(await screen.findByText("No tasks yet.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "+ New task" }));
    await userEvent.type(screen.getByLabelText("Title"), "Prepare demo");
    await userEvent.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByText("Prepare demo")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "New task" })).not.toBeInTheDocument(),
    );
  });
});
