import EmptyState from "./empty-state";

export type DataTableColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export default function DataTable<T>({
  columns,
  rows,
  emptyMessage = "No records found.",
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        message="Try adding some records."
      />
    );
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
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: "left",
                  borderBottom: "2px solid #ccc",
                  padding: "8px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row: any, index) => (
            <tr key={row.id || index}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    borderBottom: "1px solid #eee",
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
    </div>
  );
}