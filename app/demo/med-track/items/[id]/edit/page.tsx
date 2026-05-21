import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/medtrack/db";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await pool.query(
    `
    select *
    from medtrack.items
    where id = $1
    limit 1
    `,
    [id]
  );

  const item = result.rows[0];

  if (!item) {
    notFound();
  }

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <p>
        <Link href="/demo/med-track/items">← Back to Items</Link>
      </p>

      <h1>Edit Item</h1>

      <form method="POST" action={`/demo/med-track/api/items/${item.id}`}>
        <p>
          <label>
            Name<br />
            <input name="name" defaultValue={item.name} required style={{ width: 300 }} />
          </label>
        </p>

        <p>
          <label>
            Kind<br />
            <select name="kind" defaultValue={item.kind} required>
              <option value="supplement">Supplement</option>
              <option value="medicine">Medicine</option>
            </select>
          </label>
        </p>

        <p>
          <label>
            Strength<br />
            <input name="strength" defaultValue={item.strength ?? ""} style={{ width: 300 }} />
          </label>
        </p>

        <p>
          <label>
            Form<br />
            <input name="form" defaultValue={item.form ?? ""} style={{ width: 300 }} />
          </label>
        </p>

        <p>
          <label>
            Notes<br />
            <textarea name="notes" defaultValue={item.notes ?? ""} rows={4} style={{ width: 400 }} />
          </label>
        </p>

        <p>
          <label>
            <input
              type="checkbox"
              name="active"
              defaultChecked={item.active}
            />{" "}
            Active
          </label>
        </p>

        <button type="submit">Save Changes</button>
      </form>
    </main>
  );
}
