import Link from "next/link";
import { pool } from "@/lib/medtrack/db";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import DataTable from "@/components/medtrack/data-table";
import Alert from "@/components/medtrack/alert";
import DeleteButton from "@/components/medtrack/delete-button";
import Button from "@/components/medtrack/button";
import AddButton from "@/components/medtrack/add-button";


export const dynamic = "force-dynamic";

export default async function SymptomsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    dir?: string;
    page?: string;
    symptom?: string;
    q?: string;
    success?: string;
    severity?: string;
  }>;
})

 {

  const params = await searchParams;

  const q = (params.q || "").trim();
  const sort = params.sort || "logged_at";
  const dir = params.dir === "asc" ? "asc" : "desc";
  const page = Number(params.page || 1);
  const symptomFilter = (params.symptom || "").trim();
  const severityFilter = params.severity || "";


  const result = await pool.query(`
    select *
    from medtrack.symptom_logs
  `);

  let symptoms = result.rows;
  
  if (q) {
    symptoms = symptoms.filter((s: any) =>
      s.symptom.toLowerCase().includes(q.toLowerCase())
    );
  }
  
  if (symptomFilter) {
    symptoms = symptoms.filter(
      (s: any) =>
        s.symptom.toLowerCase() === symptomFilter.toLowerCase()
    );
  }

    if (severityFilter === "mild") {
      symptoms = symptoms.filter(
        (s: any) => Number(s.severity) >= 1 && Number(s.severity) <= 3
      );
    }
    
    if (severityFilter === "moderate") {
      symptoms = symptoms.filter(
        (s: any) => Number(s.severity) >= 4 && Number(s.severity) <= 6
      );
    }
    
    if (severityFilter === "severe") {
      symptoms = symptoms.filter(
        (s: any) => Number(s.severity) >= 7 && Number(s.severity) <= 10
      );
    }
  
  symptoms = [...symptoms].sort((a: any, b: any) => {
    if (sort === "logged_at") {
      const av = new Date(a.logged_at).getTime();
      const bv = new Date(b.logged_at).getTime();
  
      return dir === "desc" ? bv - av : av - bv;
    }
  
    if (sort === "severity") {
      const av = Number(a.severity || 0);
      const bv = Number(b.severity || 0);
  
      return dir === "desc" ? bv - av : av - bv;
    }

  
    const av = String(a[sort] ?? "");
    const bv = String(b[sort] ?? "");
  
    const result = av.localeCompare(bv, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  
    return dir === "desc" ? -result : result;
  });

  return (

    <AppShell current="symptoms">

      <PageHeader
        title="Symptoms"
        backHref="/demo/med-track"
        backLabel="Dashboard"
      />


      {symptomFilter && (
        <p
          style={{
            padding: "8px 12px",
            background: "#eef6ff",
            border: "1px solid #cce0ff",
            borderRadius: 6,
            marginBottom: 12,
            width: "fit-content",
          }}
        >
          Filtering by: <strong>{symptomFilter}</strong>{" "}
          <Link href="/demo/med-track/symptoms">Clear</Link>
        </p>
      )}

      <form
        method="GET"
        style={{
          display:"flex",
          gap:12,
          marginBottom:20
        }}
      >

     <AddButton
       href="/demo/med-track/symptoms/new"
       label="New Symptom"
     />


        <input
          name="q"
          defaultValue={q}
          placeholder="Search symptoms..."
          style={{
            padding:8,
            width:260
          }}
        />

        <select
          name="severity"
          defaultValue={severityFilter}
          style={{
            padding: 8,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          <option value="">All Severities</option>
          <option value="mild">Mild 1-3</option>
          <option value="moderate">Moderate 4-6</option>
          <option value="severe">Severe 7-10</option>
        </select>

        <Button type="submit">
          Search
        </Button>

        {q && (
          <Link href="/demo/med-track/symptoms">
            Clear
          </Link>
        )}

      </form>

      {params.success === "saved" && (
        <Alert variant="success">
          &#10003; Symptom saved successfully
        </Alert>
      )}

      {params.success==="updated" && (
        <Alert variant="info">
          &#10003; Symptom updated successfully
        </Alert>
      )}


      {params.success==="deleted" && (
        <Alert variant="danger">
          &#10003; Symptom deleted successfully
        </Alert>
      )}


      <div
        style={{
          marginBottom: 10,
          color: "#666",
          fontSize: 14,
        }}
      >
        Showing {symptoms.length} symptom record{symptoms.length === 1 ? "" : "s"}
      </div>

      <DataTable
        rows={symptoms}

        page={page}
        pageSize={5}

        currentSort={sort}
        currentDir={dir}

        basePath="/demo/med-track/symptoms"

        query={{
          q,
          sort,
          dir,
          symptom: symptomFilter,
          severity: severityFilter,
        }}

        emptyMessage="No symptoms found."

        columns={[
          {
            key:"logged_at",
            label:"Logged At",
            sortable:true,
            render:(s:any)=>
              new Date(s.logged_at)
              .toLocaleString()
          },

          {
            key:"symptom",
            label:"Symptom",
            sortable:true
          },

          {
            key: "severity",
            label: "Severity",
            sortable: true,
            render: (s: any) => {
              const severity = Number(s.severity || 0);

	      const label =
                severity >= 7
                  ? "Severe"
                  : severity >= 4
                    ? "Moderate"
                    : "Mild";
          
              const color =
                severity >= 7
                  ? "#721c24"
                  : severity >= 4
                    ? "#856404"
                    : "#155724";
          
              const backgroundColor =
                severity >= 7
                  ? "#f8d7da"
                  : severity >= 4
                    ? "#fff3cd"
                    : "#d4edda";
          
              return (
                <span
                  style={{
                    color,
                    backgroundColor,
                    padding: "5px 12px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {label} ({severity})
                </span>
              );
            },
          },

          {
            key: "notes",
            label: "Notes",
            render: (s: any) => (
              <span
                title={s.notes || ""}
                style={{
                  display: "inline-block",
                  maxWidth: 250,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  verticalAlign: "bottom",
                }}
              >
                {s.notes || ""}
              </span>
            ),
          },

          {
            key:"edit",
            label:"Edit",
            render:(s:any)=>(
              <Link
                href={`/demo/med-track/symptoms/${s.id}/edit`}
              >
                Edit
              </Link>
            )
          },

          {
            key:"delete",
            label:"Delete",
            render:(s:any)=>(
              <form
                method="POST"
                action={`/demo/med-track/api/symptoms/${s.id}/delete`}
              >
                <DeleteButton message="Delete symptom?" />
              </form>
            )
          }

        ]}

      />


    </AppShell>
  );
}