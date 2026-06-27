import Link from "next/link";
import { getItems } from "@/lib/medtrack/queries";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import DataTable from "@/components/medtrack/data-table";
import Alert from "@/components/medtrack/alert";
import DeleteButton from "@/components/medtrack/delete-button";
import Button from "@/components/medtrack/button";
import ExportButton from "@/components/medtrack/export-button";
import AddButton from "@/components/medtrack/add-button";

export const dynamic = "force-dynamic";

export default async function ItemsPage({
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
  const params = await searchParams;
  const q = (params.q || "").trim();

  const allItems = await getItems();

  let items = q
    ? allItems.filter((item: any) =>
        item.name.toLowerCase().includes(q.toLowerCase())
      )
    : allItems;
  
  const sort = params.sort || "name";
  const dir = params.dir === "desc" ? "desc" : "asc";
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 5);
  
  items = [...items].sort((a: any, b: any) => {
    const av = a[sort] ?? "";
    const bv = b[sort] ?? "";
  
    const result = String(av).localeCompare(String(bv), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  
    return dir === "desc" ? -result : result;
  });

  return (
    <AppShell current="items">
      <PageHeader
        title="Items"
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
       href="/demo/med-track/items/new"
       label="New Item"
     />
   
     <input
       type="text"
       name="q"
       defaultValue={q}
       placeholder="Search items..."
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
       rows={items}
       filename="medtrack_items.csv"
     />
   
     {q && <Link href="/demo/med-track/items">Clear</Link>}
   </form>
      {params.success === "saved" && (
        <Alert variant="success">&#10003; Item saved successfully</Alert>
      )}

      {params.success === "updated" && (
        <Alert variant="info">&#10003; Item updated successfully</Alert>
      )}

      {params.success === "deleted" && (
        <Alert variant="danger">&#10003; Item deleted successfully</Alert>
      )}

      <DataTable
        rows={items}
        page={page}
        pageSize={pageSize}
        basePath="/demo/med-track/items"
        query={{
          q,
          sort,
          dir,
          pageSize: String(pageSize),
        }}
        currentSort={sort}
        currentDir={dir}
        emptyMessage="No matching items found."
        columns={[
          { key: "name", label: "Name", sortable: true },
          { key: "kind", label: "Kind", sortable: true },
          { key: "strength", label: "Strength", sortable: true },
          { key: "form", label: "Form", sortable: true },
          {
            key: "active",
            label: "Active",
            render: (item: any) => (item.active ? "Yes" : "No"),
          },
          {
            key: "edit",
            label: "Edit",
            render: (item: any) => (
              <Link href={`/demo/med-track/items/${item.id}/edit`}>Edit</Link>
            ),
          },
          {
            key: "delete",
            label: "Delete",
            render: (item: any) => (
              <form
                method="POST"
                action={`/demo/med-track/api/items/${item.id}/delete`}
              >
                <DeleteButton message="Delete this item?" />
              </form>
            ),
          },
        ]}
      />
    </AppShell>
  );
}