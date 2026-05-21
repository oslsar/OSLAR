import Link from "next/link";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import DataTable from "@/components/medtrack/data-table";
import { pool } from "@/lib/medtrack/db";
import { doseLogsAdminColumns } from "@/lib/medtrack/table-config";

export const dynamic = "force-dynamic";

export default async function AdminDoseLogsPage() {
  const result = await pool.query(`
    select
      dl.id,
      i.name as item_name,
      dl.status,
      dl.scheduled_at,
      dl.taken_at,
      dl.dose_amount,
      dl.notes,
      dl.created_at
    from medtrack.dose_logs dl
    join medtrack.items i
      on i.id = dl.item_id
    order by dl.created_at desc
    limit 200
  `);

  const rows = result.rows;

  return (
    <AppShell>
      <PageHeader
        title="Admin - Dose Logs"
        backHref="/demo/med-track/admin"
        backLabel="Admin Home"
      />

      <DataTable
        rows={rows}
        emptyMessage="No dose logs found."
        columns={doseLogsAdminColumns}
      />
    </AppShell>
  );
}
