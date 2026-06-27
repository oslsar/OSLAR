import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import DataTable from "@/components/medtrack/data-table";
import { pool } from "@/lib/medtrack/db";
import { schedulesAdminColumns } from "@/lib/medtrack/table-config";

export const dynamic = "force-dynamic";

export default async function AdminSchedulesPage() {
  const result = await pool.query(`
    select
      s.id,
      i.name as item_name,
      s.frequency_type,
      s.times_json,
      s.interval_hours,
      s.instructions,
      s.active,
      s.created_at
    from medtrack.schedules s
    join medtrack.items i
      on i.id = s.item_id
    order by s.created_at desc
    limit 200
  `);

  return (
    <AppShell>
      <PageHeader
        title="Admin - Schedules"
        backHref="/demo/med-track/admin"
        backLabel="Admin Home"
      />

      <DataTable
        rows={result.rows}
        emptyMessage="No schedules found."
        columns={schedulesAdminColumns}
      />
    </AppShell>
  );
}
