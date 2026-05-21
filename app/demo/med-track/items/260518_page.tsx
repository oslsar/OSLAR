import Link from "next/link";
import { getItems } from "@/lib/medtrack/queries";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import DataTable from "@/components/medtrack/data-table";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <AppShell title="Items">
      <PageHeader
        title="Items"
        backHref="/demo/med-track"
        backLabel="MedTrack Home"
       />

      <p>
        <Link href="/demo/med-track/items/new">
          Add New Item
        </Link>
      </p>

      {items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Kind</th>
              <th>Strength</th>
              <th>Form</th>
              <th>Active</th>
              <th>Edit</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.kind}</td>
                <td>{item.strength}</td>
                <td>{item.form}</td>
                <td>{item.active ? "Yes" : "No"}</td>
                <td>
                  <Link href={`/demo/med-track/items/${item.id}/edit`}>
                  Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
