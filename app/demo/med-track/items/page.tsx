import Link from "next/link";
import { getItems } from "@/lib/medtrack/queries";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import DataTable from "@/components/medtrack/data-table";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <AppShell>
      <PageHeader
        title="Items"
        backHref="/demo/med-track"
        backLabel="MedTrack Home"
      />

      <p>
        <Link href="/demo/med-track/items/new">Add New Item</Link>
      </p>

      <DataTable
        rows={items}
        columns={[
          { key: "name", label: "Name" },
          { key: "kind", label: "Kind" },
          { key: "strength", label: "Strength" },
          { key: "form", label: "Form" },
          {
            key: "active",
            label: "Active",
            render: (item: any) => (item.active ? "Yes" : "No"),
          },
          {
            key: "edit",
            label: "Edit",
            render: (item: any) => (
              <Link href={`/demo/med-track/items/${item.id}/edit`}>
                Edit
              </Link>
            ),
          },
        ]}
      />
    </AppShell>
  );
}