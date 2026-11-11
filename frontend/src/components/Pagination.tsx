interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) {
    return null;
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn btn-small" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Previous
      </button>
      <span className="muted">
        Page {page} of {pages}
      </span>
      <button
        className="btn btn-small"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next →
      </button>
    </nav>
  );
}
