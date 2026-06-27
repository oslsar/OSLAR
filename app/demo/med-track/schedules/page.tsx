import Link from "next/link";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import DataTable from "@/components/medtrack/data-table";
import DeleteButton from "@/components/medtrack/delete-button";
import { pool } from "@/lib/medtrack/db";
import Alert from "@/components/medtrack/alert";
import AddButton from "@/components/medtrack/add-button";
import Button from "@/components/medtrack/button";
import ExportButton from "@/components/medtrack/export-button";

export const dynamic = "force-dynamic";

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{
  success?: string;
  q?: string;
  sort?: string;
  dir?: string;
  page?: string;
  pageSize?: string;
}>;
}) {
  const result = await pool.query(`
    select
      s.id,
      s.frequency_type,
      s.times_json,
      s.interval_hours,
      s.instructions,
      s.active,
      i.name,
      i.strength,
      i.form
    from medtrack.schedules s
    join medtrack.items i
      on i.id = s.item_id
    order by i.name, s.created_at desc
  `);

  let schedules = result.rows;

  const params = await searchParams;

  const q = (params.q || "").trim();
  
  const sort = params.sort || "name";
  const dir = params.dir === "desc" ? "desc" : "asc";
  
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 5)

  if (q) {
    schedules = schedules.filter((s: any) =>
      `${s.name} ${s.frequency_type} ${s.instructions || ""}`
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  }

schedules = [...schedules].sort((a: any, b: any) => {
  const av = a[sort] ?? "";
  const bv = b[sort] ?? "";

  const result = String(av).localeCompare(
    String(bv),
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );

  return dir === "desc" ? -result : result;
});

;

  return (
    <AppShell current="schedules">
      <PageHeader
        title="Schedules"
        backHref="/demo/med-track"
        backLabel="Dashboard"
      />

      <form
        method="GET"
        style={{
          marginBottom: 20,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <AddButton
          href="/demo/med-track/schedules/new"
          label="New Schedule"
        />
      
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search schedules..."
          style={{
            padding: "8px 10px",
            border: "1px solid #ccc",
            borderRadius: 6,
            width: 260,
          }}
        />
      
        <select
          name="pageSize"
          defaultValue={String(pageSize)}
          style={{
            padding: "8px 10px",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      
        <Button type="submit" variant="primary">
          Apply
        </Button>
      
        <ExportButton
          rows={schedules}
          filename="medtrack_schedules.csv"
        />
      
        {q && (
          <Link href="/demo/med-track/schedules">
            Clear
          </Link>
        )}
      </form>
      {params.success === "saved" && (
        <Alert variant="success">
          Schedule saved successfully
        </Alert>
      )}
      
      {params.success === "updated" && (
        <Alert variant="info">
          Schedule updated successfully
        </Alert>
      )}

      {params.success === "deleted" && (
        <Alert variant="danger">
          Schedule deleted successfully
        </Alert>
      )}

      <DataTable
        rows={schedules}
        page={page}
        pageSize={pageSize}
        basePath="/demo/med-track/schedules"
        query={{
          q,
          sort,
          dir,
          pageSize: String(pageSize),
        }}
        currentSort={sort}
        currentDir={dir}
        emptyMessage="No schedules found."
        columns={[
          { key: "name", label: "Item", sortable: true },
          { key: "strength", label: "Strength", sortable: true },
          { key: "form", label: "Form", sortable: true },
          { key: "frequency_type", label: "Frequency", sortable: true },
          {
            key: "times_json",
            label: "Times",
            render: (s: any) =>
              Array.isArray(s.times_json)
                ? s.times_json
                    .map((t: string) =>
                      t.length === 4 ? `${t.slice(0, 2)}:${t.slice(2)}` : t
                    )
                    .join(", ")
                : "",
          },
          { key: "interval_hours", label: "Interval Hours" },
          { key: "instructions", label: "Instructions" },
          {
            key: "active",
            label: "Active",
            render: (s: any) => (s.active ? "Yes" : "No"),
          },
          {
            key: "edit",
            label: "Edit",
            render: (s: any) => (
              <Link href={`/demo/med-track/schedules/${s.id}/edit`}>
                Edit
              </Link>
            ),
          },
          {
            key: "delete",
            label: "Delete",
            render: (s: any) => (
              <form
                method="POST"
                action={`/demo/med-track/api/schedules/${s.id}/delete`}
              >
                <DeleteButton message="Delete this schedule?" />
              </form>
            ),
          },
        ]}
      />
    </AppShell>
  );
}