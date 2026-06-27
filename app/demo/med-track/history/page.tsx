import Link from "next/link";
import { pool } from "@/lib/medtrack/db";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import DataTable from "@/components/medtrack/data-table";
import Alert from "@/components/medtrack/alert";

export const dynamic = "force-dynamic";

export default async function MedTrackHistoryPage() {
  const userId = "11111111-1111-1111-1111-111111111111";

  let rows: any[] = [];
  let error = "";

  try {
    const result = await pool.query(
      `
      select
        dl.id,
        dl.item_id,
        i.name as item_name,
        dl.status,
        dl.dose_amount,
        dl.notes,
        dl.taken_at,
        dl.created_at
      from medtrack.dose_logs dl
      join medtrack.items i
        on i.id = dl.item_id
      where dl.user_id = $1
      order by coalesce(dl.taken_at, dl.created_at) desc
      limit 100
      `,
      [userId]
    );

    rows = result.rows;
  } catch (err: any) {
    error = err.message || "Unknown error";
  }

  return (
    <AppShell current="history">
      <PageHeader
        title="History"
        backHref="/demo/med-track/dashboard"
        backLabel="Back to Dashboard"
      />

      {error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <DataTable
          rows={rows}
          emptyMessage="No dose history yet."
          columns={[
            {
              key: "item_name",
              label: "Item",
            },
            {
              key: "status",
              label: "Status",
              render: (row: any) => {
                const isTaken = row.status === "taken";
            
                return (
                  <span
                    style={{
                      color: isTaken ? "#155724" : "#856404",
                      backgroundColor: isTaken ? "#d4edda" : "#fff3cd",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    {row.status}
                  </span>
                );
              },
            },            {
              key: "taken_at",
              label: "Taken At",
              render: (row: any) =>
                row.taken_at
                  ? new Date(row.taken_at).toLocaleString("en-CA", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : new Date(row.created_at).toLocaleString("en-CA", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
            },
            {
              key: "dose_amount",
              label: "Dose",
              render: (row: any) => row.dose_amount || "",
            },
            {
              key: "notes",
              label: "Notes",
              render: (row: any) => row.notes || "",
            },
            {
              key: "actions",
              label: "Actions",
              render: (row: any) => (
                <Link href={`/demo/med-track/history/${row.id}/edit`}>
                  Edit
                </Link>
              ),
            },
          ]}
        />
      )}
    </AppShell>
  );
}