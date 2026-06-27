import { notFound } from "next/navigation";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import DataTable from "@/components/medtrack/data-table";
import { pool } from "@/lib/medtrack/db";
import { adminTables } from "@/lib/medtrack/admin-config";
import Alert from "@/components/medtrack/alert";
import Link from "next/link";
import Button from "@/components/medtrack/button";
import ExportButton from "@/components/medtrack/export-button";

export const dynamic = "force-dynamic";

export default async function AdminEntityPage({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string }>;
  searchParams: Promise<{
    success?: string;
    name?: string;
    kind?: string;
    active?: string;
    sort?: string;
    dir?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const { entity } = await params;
  const config = adminTables[entity];
  const sp = await searchParams;
  const sort = sp.sort || "name";
  const dir = sp.dir === "desc" ? "desc" : "asc";
  const page = Number(sp.page || 1);
  const pageSize = Number(sp.pageSize || 10); 

  if (!config) {
    notFound();
  }

  const result = await pool.query(config.query);

    let rows = result.rows;
    
    if (entity === "items") {
      const name = (sp.name || "").toLowerCase();
      const kind = (sp.kind || "").toLowerCase();
      const active = sp.active || "";
    
      rows = rows.filter((r: any) => {
        const matchesName =
          !name || String(r.name || "").toLowerCase().includes(name);
    
        const matchesKind =
          !kind || String(r.kind || "").toLowerCase().includes(kind);
    
        const matchesActive =
          !active ||
          (active === "yes" && r.active === true) ||
          (active === "no" && r.active === false);
    
        return matchesName && matchesKind && matchesActive;
      });

      rows = [...rows].sort((a: any, b: any) => {
        const av = a[sort] ?? "";
        const bv = b[sort] ?? "";
      
        const result = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      
        return dir === "desc" ? -result : result;
      });

    }

  return (
    <AppShell>
      <PageHeader
        title={config.title}
        backHref="/demo/med-track/admin"
        backLabel="Admin Home"
      />

      {sp.success === "deleted" && (
        <Alert variant="danger">
          Record deleted successfully
        </Alert>
      )}

      {entity === "items" && (
        <form
          method="GET"
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <input
            name="name"
            defaultValue={sp.name || ""}
            placeholder="Filter name..."
            style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 }}
          />
      
          <input
            name="kind"
            defaultValue={sp.kind || ""}
            placeholder="Filter kind..."
            style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 }}
          />
      
          <select
            name="active"
            defaultValue={sp.active || ""}
            style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 }}
          >
            <option value="">All active</option>
            <option value="yes">Active only</option>
            <option value="no">Inactive only</option>
          </select>

          <select
            name="pageSize"
            defaultValue={String(pageSize)}
            style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 }}
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
            rows={rows}
            filename={`admin_${entity}.csv`}
          />
          
          {(sp.name || sp.kind || sp.active) && (
            <Link href={`/demo/med-track/admin/${entity}`}>
              Clear
            </Link>
          )}
        </form>
      )}



      <DataTable
        rows={rows}
        emptyMessage={`No records found for ${entity}.`}
        columns={config.columns}
        page={page}
        pageSize={pageSize}
        basePath={`/demo/med-track/admin/${entity}`}
        query={{
          name: sp.name,
          kind: sp.kind,
          active: sp.active,
          sort,
          dir,
          pageSize: String(pageSize),
        }}
        currentSort={sort}
        currentDir={dir}
      />
    </AppShell>
  );
}
