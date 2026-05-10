import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  // Fetch item
  const { rows } = await pool.query(
    `SELECT * FROM cdm.item_master WHERE uid = $1 LIMIT 1`,
    [uid]
  );

  const row = rows[0];
  if (!row) {
    return <main style={{ padding: 16 }}>Not found.</main>;
  }

  // 🔹 Namespace lookup
  const namespaces = await pool.query(`
    SELECT uid, code, name
    FROM cdm.namespace
    ORDER BY code
  `);

  // 🔹 Reference set lookup (filtered by namespace if available)
  const referenceSets = await pool.query(
    `
    SELECT uid, code, version, title, namespace_uid
    FROM cdm.reference_set
    ORDER BY code, version
    `
  );

  return (
    <main style={{ padding: 16, fontFamily: "Arial, sans-serif", maxWidth: 900 }}>
      <h2>Edit Item</h2>

      <div style={{ marginBottom: 12, fontSize: 12, color: "#666" }}>
        UID: <b>{row.uid}</b>
      </div>

      <form
        action={`/demo/supdb/item-master/api/update?uid=${encodeURIComponent(uid)}`}
        method="POST"
      >
        <div style={{ display: "grid", gap: 12 }}>

          <label>
            Item Code
            <input
              name="item_code"
              defaultValue={row.item_code ?? ""}
              required
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label>
            Name
            <input name="name" defaultValue={row.name ?? ""} style={{ width: "100%", padding: 8 }} />
          </label>

          {/* 🔹 Namespace Dropdown */}
          <label>
            Namespace
            <select
              name="namespace_uid"
              defaultValue={row.namespace_uid ?? ""}
              style={{ width: "100%", padding: 8 }}
            >
              <option value="">-- None --</option>
              {namespaces.rows.map((ns: any) => (
                <option key={ns.uid} value={ns.uid}>
                  {ns.code} — {ns.name}
                </option>
              ))}
            </select>
          </label>

          {/* 🔹 Reference Set Dropdown */}
          <label>
            Reference Set
            <select
              name="reference_set_uid"
              defaultValue={row.reference_set_uid ?? ""}
              style={{ width: "100%", padding: 8 }}
            >
              <option value="">-- None --</option>
              {referenceSets.rows.map((rs: any) => (
                <option key={rs.uid} value={rs.uid}>
                  {rs.code} v{rs.version} — {rs.title}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={{ padding: "8px 12px", width: 160 }}>
            Save
          </button>
        </div>
      </form>

      <div style={{ marginTop: 20 }}>
        <a href="/demo/supdb/item-master" style={{ textDecoration: "underline" }}>
          ← Back to list
        </a>
      </div>
    </main>
  );
}