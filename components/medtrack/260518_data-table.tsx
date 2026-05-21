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
    return <p>{emptyMessage}</p>;
  }

  return (
    <table border={1} cellPadding={6}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row: any, index) => (
          <tr key={row.id || index}>
            {columns.map((col) => (
              <td key={col.key}>
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
