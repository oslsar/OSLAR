import EmptyState from "./empty-state";

export type DataTableColumn<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  sortKey?: string;
  render?: (row: T) => React.ReactNode;
};

export default function DataTable<T>({
  columns,
  rows,
  emptyMessage = "No records found.",
  currentSort,
  currentDir = "asc",
  page = 1,
  pageSize = 20,
  basePath,
  query = {},
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  currentSort?: string;
  currentDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  basePath?: string;
  query?: Record<string, string | undefined>;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyMessage} message="Try adding some records." />;
  }

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const startIndex = (currentPage - 1) * pageSize;
  const pagedRows = rows.slice(startIndex, startIndex + pageSize);

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }

    params.set("page", String(targetPage));

    return `${basePath || ""}?${params.toString()}`;
  }

  return (
    <div style={{ overflowX: "auto", marginTop: 12 }}>
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          maxWidth: 1000,
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => {
              const key = col.sortKey || col.key;
              const isActive = currentSort === key;
              const nextDir =
                isActive && currentDir === "asc" ? "desc" : "asc";
        
              return (
                <th
                  key={col.key}
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    backgroundColor: isActive ? "#eef5ff" : "#f1f3f5",
                    fontWeight: 700,
                    padding: "10px 8px",
                    borderBottom: "2px solid #d0d7de",
                  }}
                >
                  {col.sortable ? (
                    <a
                      href={`${basePath || ""}?${new URLSearchParams({
                        ...query,
                        sort: key,
                        dir: nextDir,
                        page: "1",
                      }).toString()}`}
                      style={{
                        color: "#0d6efd",
                        textDecoration: "none",
                        fontWeight: isActive ? 700 : 600,
                        cursor: "pointer",
                      }}
                    >
                      {col.label}
                      {isActive && (
                        <span style={{ marginLeft: 4 }}>
                          {currentDir === "asc" ? "\u2191" : "\u2193"}
                        </span>
                      )}
                    </a>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {pagedRows.map((row: any, index) => (
            <tr
              key={row.id || index}
              style={{
                backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    borderBottom: "1px solid #e5e5e5",
                    padding: "8px 10px",
                    verticalAlign: "top",
                  }}
                >
                  {col.render ? col.render(row) : row[col.key] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          {currentPage > 1 ? (
            <a href={pageHref(currentPage - 1)}>
              &larr; Previous
            </a>
          ) : (
            <span style={{ color: "#999" }}>
              &larr; Previous
            </span>
          )}
      
          <strong>
            Page {currentPage} of {totalPages}
          </strong>
      
          {currentPage < totalPages ? (
            <a href={pageHref(currentPage + 1)}>
              Next &rarr;
            </a>
          ) : (
            <span style={{ color: "#999" }}>
              Next &rarr;
            </span>
          )}
        </div>
      )}
    </div>
  );
}