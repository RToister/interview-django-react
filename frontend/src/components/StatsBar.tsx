import type { TaskStats } from "../api/types";

export function StatsBar({ stats }: { stats: TaskStats | null }) {
  const items = [
    { label: "Total", value: stats?.total },
    { label: "To do", value: stats?.todo },
    { label: "In progress", value: stats?.in_progress },
    { label: "Done", value: stats?.done },
    { label: "Overdue", value: stats?.overdue, danger: true },
  ];

  return (
    <section className="stats" aria-label="Task statistics">
      {items.map((item) => (
        <div key={item.label} className={`stat ${item.danger && item.value ? "stat-danger" : ""}`}>
          <span className="stat-value">{item.value ?? "–"}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </section>
  );
}
