import Link from "next/link";
import { pool } from "@/lib/medtrack/db";
import StatCard from "@/components/medtrack/stat-card";
import AppShell from "@/components/medtrack/app-shell";
import DataTable from "@/components/medtrack/data-table";
import PageHeader from "@/components/medtrack/page-header";
import Button from "@/components/medtrack/button";
import Alert from "@/components/medtrack/alert";



export const dynamic = "force-dynamic";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
   const schedulesResult = await pool.query(`
     select
       s.id as schedule_id,
       s.item_id,
       s.frequency_type,
       s.times_json,
       s.interval_hours,
       s.instructions,
       i.name,
       i.strength,
       i.form,
       exists (
         select 1
         from medtrack.dose_logs dl
         where dl.item_id = s.item_id
           and dl.status = 'taken'
           and dl.taken_at::date = current_date
       ) as taken_today
     from medtrack.schedules s
     join medtrack.items i
       on i.id = s.item_id
     where s.active = true
       and i.active = true
     order by
       coalesce((s.times_json->>0), '99:99'),
       i.name
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

  const activeItemsResult = await pool.query(`
    select count(*)::int as count
    from medtrack.items
    where active = true
  `);
  
  const totalSymptomsResult = await pool.query(`
    select count(*)::int as count
    from medtrack.symptom_logs
  `);
  
  const avgSeverityResult = await pool.query(`
    select round(avg(severity)::numeric, 1) as avg
    from medtrack.symptom_logs
    where severity is not null
  `);

    const activeItems = activeItemsResult.rows[0].count;
    
    const totalSymptoms =
      totalSymptomsResult.rows[0].count;
    
    const avgSeverity =
      avgSeverityResult.rows[0].avg ?? "N/A";

  const symptomTrendResult = await pool.query(`
    select
      logged_at::date as day,
      round(avg(severity)::numeric, 1) as avg_severity,
      min(severity)::int as min_severity,
      max(severity)::int as max_severity,
      count(*)::int as entries
    from medtrack.symptom_logs
      where severity is not null
        and logged_at >= current_date - interval '7 days'
    group by logged_at::date
    order by day desc
  `);

  const topSymptomsResult = await pool.query(`
    select
      symptom,
      count(*)::int as entries,
      round(avg(severity)::numeric, 1) as avg_severity,
      min(severity)::int as min_severity,
      max(severity)::int as max_severity,
      max(logged_at)::date as last_seen
    from medtrack.symptom_logs
    where logged_at >= current_date - interval '30 days'
      and severity is not null
    group by symptom
    order by entries desc, avg_severity desc
    limit 10
  `);

  const schedules = schedulesResult.rows;
  const logs = logsResult.rows;
  const activeSchedules = schedules.length;
  const dosesToday = logs.length;
  const params = await searchParams;
  const symptomTrend = symptomTrendResult.rows;
  const topSymptoms = topSymptomsResult.rows;
  
  const takenToday = logs.filter(
    (l: any) => l.status === "taken"
  ).length;

  const adherence =
    activeSchedules > 0
      ? Math.round((takenToday / activeSchedules) * 100)
      : 0;

  const dueNow = schedules.filter(
    (s: any) => !s.taken_today
  ).length;

  return (
    <AppShell current="dashboard">
      <PageHeader
        title="Dashboard"
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

          {params.success === "taken" && (
            <Alert variant="success">
              Dose logged successfully
            </Alert>
          )}

          <Link href="/demo/med-track/schedules" style={{ textDecoration: "none" }}>
            <StatCard label="Scheduled Today" value={activeSchedules} />
          </Link>
          
          <Link href="/demo/med-track/history" style={{ textDecoration: "none" }}>
            <StatCard label="Taken Today" value={takenToday} />
          </Link>
          
          <Link href="/demo/med-track/schedules" style={{ textDecoration: "none" }}>
            <StatCard label="Remaining" value={dueNow} />
          </Link>
          <Link href="/demo/med-track/items">
            <StatCard label="Items" value={activeItems} />
          </Link>
          
          <Link href="/demo/med-track/symptoms">
            <StatCard label="Symptoms" value={totalSymptoms} />
          </Link>
          
          <StatCard label="Severity" value={avgSeverity} />

          <StatCard
            label="Adherence"
            value={`${adherence}%`}
          />

        </div>

      <h2
        style={{
          marginTop: 32,
          marginBottom: 12,
          fontSize: "1.5rem",
          fontWeight: 700,
        }}
      >
        Scheduled Items
      </h2>

      <DataTable
        rows={schedules}
        emptyMessage="No active schedules."
        columns={[
          {
            key: "time",
            label: "Time",
            render: (s: any) => {
              const time =
                Array.isArray(s.times_json) && s.times_json.length > 0
                  ? String(s.times_json[0])
                  : "";
            
              if (/^\d{4}$/.test(time)) {
                return `${time.slice(0, 2)}:${time.slice(2)}`;
              }
            
              return time;
            },
          },
          { key: "name", label: "Name" },
          { key: "strength", label: "Strength" },          { key: "form", label: "Form" },
          { key: "frequency_type", label: "Frequency" },
          {
            key: "instructions",
            label: "Instructions",
            render: (s: any) => s.instructions || "-",
          },
          {
            key: "status",
            label: "Status",
            render: (s: any) =>
              s.taken_today ? "Taken today" : "Due",
          },
		  {
            key: "actions",
            label: "Actions",
            render: (s: any) =>
              s.taken_today ? (
                ""
              ) : (
                <form method="POST" action="/demo/med-track/api/logs">
                  <input type="hidden" name="item_id" value={s.item_id} />
                  <input type="hidden" name="status" value="taken" />
                  <Button type="submit" variant="success">
                    Take Dose
                  </Button>
                </form>
              ),
          },
        ]}
      />


      <h2
        style={{
          marginTop: 32,
          marginBottom: 12,
          fontSize: "1.5rem",
          fontWeight: 700,
        }}
      >
        7-Day Symptom Trend
      </h2>
        
        <DataTable
          rows={symptomTrend}
          emptyMessage="No symptom trend data found."
          columns={[
            {
              key: "day",
              label: "Date",
              render: (r: any) =>
                r.day ? new Date(r.day).toLocaleDateString() : "",
            },
            {
              key: "avg_severity",
              label: "Avg Severity",
            },
            {
              key: "min_severity",
              label: "Min",
            },
            {
              key: "max_severity",
              label: "Max",
            },
            {
              key: "entries",
              label: "Entries",
            },
          ]}
        />		

      <h2
        style={{
          marginTop: 32,
          marginBottom: 12,
          fontSize: "1.5rem",
          fontWeight: 700,
        }}
      >
        Top Symptoms - 30 Days
      </h2>
        
        <DataTable
          rows={topSymptoms}
          emptyMessage="No top symptom data found."
          columns={[
            {
              key: "symptom",
              label: "Symptom",
              render: (r: any) => (
                <Link
                  href={`/demo/med-track/symptoms?symptom=${encodeURIComponent(r.symptom)}`}
                >
                  {r.symptom}
                </Link>
              ),
            },            { key: "entries", label: "Count" },
            { key: "avg_severity", label: "Avg Severity" },
            { key: "min_severity", label: "Min" },
            { key: "max_severity", label: "Max" },
            {
              key: "last_seen",
              label: "Last Seen",
              render: (r: any) =>
                r.last_seen ? new Date(r.last_seen).toLocaleDateString() : "",
            },
          ]}
        />


      <h2
        style={{
          marginTop: 32,
          marginBottom: 12,
          fontSize: "1.5rem",
          fontWeight: 700,
        }}
      >
        Today's Dose Logs
      </h2>

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