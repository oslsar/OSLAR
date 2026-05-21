import Link from "next/link";
import { pool } from "@/lib/medtrack/db";
import StatCard from "@/components/medtrack/stat-card";
import AppShell from "@/components/medtrack/app-shell";
import DataTable from "@/components/medtrack/data-table";
import PageHeader from "@/components/medtrack/page-header";
import Button from "@/components/medtrack/button";



export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const schedulesResult = await pool.query(`
    select
      s.id as schedule_id,
      s.item_id,
      s.frequency_type,
      s.instructions,
      i.name,
      i.strength,
      i.form
    from medtrack.schedules s
    join medtrack.items i
      on i.id = s.item_id
    where s.active = true
      and i.active = true
    order by i.name
  `);

  const logsResult = await pool.query(`
    select
      dl.id,
      dl.status,
      dl.taken_at,
      i.name
    from medtrack.dose_logs dl
    join medtrack.items i
      on i.id = dl.item_id
    where dl.created_at::date = current_date
    order by dl.created_at desc
  `);

  const schedules = schedulesResult.rows;
  const logs = logsResult.rows;
  const activeSchedules = schedules.length;
  const dosesToday = logs.length;
  
  const takenToday = logs.filter(
    (l: any) => l.status === "taken"
  ).length;

  return (
    <AppShell>
      <PageHeader
        title="Today Dashboard"
        backHref="/demo/med-track"
        backLabel="MedTrack Home"
      />

      
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 20,
            marginBottom: 32,
          }}
        >
          <StatCard
            label="Active Schedules"
            value={activeSchedules}
          />
        
          <StatCard
            label="Doses Logged Today"
            value={dosesToday}
          />
        
          <StatCard
            label="Taken Today"
            value={takenToday}
          />
        </div>


      <h2>Scheduled Items</h2>

	  <DataTable
        rows={schedules}
        emptyMessage="No active schedules."
        columns={[
          { key: "name", label: "Name" },
          { key: "strength", label: "Strength" },
          { key: "form", label: "Form" },
          { key: "frequency_type", label: "Frequency" },
          { key: "instructions", label: "Instructions" },
          {
            key: "actions",
            label: "Actions",
            render: (s: any) => (
              <form method="POST" action="/demo/med-track/api/logs">
                <input type="hidden" name="item_id" value={s.item_id} />
                <input type="hidden" name="status" value="taken" />
                <Button type="submit" variant="success">Take Dose</Button>
              </form>
            ),
          },
        ]}
      />

      <h2 style={{ marginTop: 32 }}>Today's Dose Logs</h2>

      <DataTable
        rows={logs}
        emptyMessage="No doses logged today."
        columns={[
          { key: "name", label: "Item" },
          { key: "status", label: "Status" },
          {
            key: "taken_at",
            label: "Taken At",
            render: (l: any) =>
              l.taken_at ? new Date(l.taken_at).toLocaleString() : "",
          },
          {
            key: "edit",
            label: "Edit",
            render: (l: any) => (
              <Link href={`/demo/med-track/history/${l.id}/edit`}>
                Edit
              </Link>
            ),
          },
        ]}
      />
    </AppShell>
  );
}