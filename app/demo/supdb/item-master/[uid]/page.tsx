import { pool } from "@/lib/db";
import NamespaceReferenceLookup from "../_components/NamespaceReferenceLookup";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  const { rows } = await pool.query(
    `SELECT * FROM cdm.item_master WHERE uid = $1 LIMIT 1`,
    [uid]
  );

  const row = rows[0];
  if (!row) {
    return <main style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>Not found.</main>;
  }

  // Lookups (return plain strings -> safe to pass to Client Component)
  const nsRes = await pool.query(`
    SELECT uid::text AS uid, code::text AS code, name::text AS name
    FROM cdm.namespace
    ORDER BY code
  `);

  const rsRes = await pool.query(`
    SELECT
      uid::text AS uid,
      namespace_uid::text AS namespace_uid,
      code::text AS code,
      version::text AS version,
      title::text AS title
    FROM cdm.reference_set
    ORDER BY code, version
  `);

  const namespaces = nsRes.rows;
  const referenceSets = rsRes.rows;

  return (
    <main style={{ padding: 16, fontFamily: "Arial, sans-serif", maxWidth: 900 }}>
      <h2>Edit Item</h2>

      <div style={{ marginBottom: 12, fontSize: 12, color: "#666" }}>
        UID: <b>{String(row.uid)}</b>
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

          <label>
            Nomenclature
            <input
              name="nomenclature"
              defaultValue={row.nomenclature ?? ""}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label>
            Item Class (cdm.item_class)
            <input
              name="item_class"
              defaultValue={row.item_class ?? ""}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label>
            UOM
            <input name="uom" defaultValue={row.uom ?? ""} style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Description
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              style={{ width: "100%", padding: 8, minHeight: 80 }}
            />
          </label>

          <label>
            Hazard Note
            <textarea
              name="hazard_note"
              defaultValue={row.hazard_note ?? ""}
              style={{ width: "100%", padding: 8, minHeight: 80 }}
            />
          </label>

          <label>
            Status (cdm.status_active)
            <input name="status" defaultValue={row.status ?? ""} style={{ width: "100%", padding: 8 }} />
          </label>

          {/* ✅ Dynamic filtered lookup */}
          <NamespaceReferenceLookup
            namespaces={namespaces}
            referenceSets={referenceSets}
            defaultNamespaceUid={row.namespace_uid ? String(row.namespace_uid) : ""}
            defaultReferenceSetUid={row.reference_set_uid ? String(row.reference_set_uid) : ""}
          />

          <label>
            Notes (char)
            <input name="notes" defaultValue={row.notes ?? ""} style={{ width: "100%", padding: 8 }} />
          </label>

          <button type="submit" style={{ padding: "8px 12px", width: 160 }}>
            Save
          </button>
        </div>
      </form>

      <form
        action={`/demo/supdb/item-master/api/delete?uid=${encodeURIComponent(uid)}`}
        method="POST"
        style={{ marginTop: 20 }}
      >
        <button
          type="submit"
          style={{
            padding: "8px 12px",
            border: "1px solid #c00",
            color: "#c00",
            background: "transparent",
          }}
        >
          Delete
        </button>
      </form>

      <div style={{ marginTop: 20 }}>
        <a href="/demo/supdb/item-master" style={{ textDecoration: "underline" }}>
          ← Back to list
        </a>
      </div>
    </main>
  );
}