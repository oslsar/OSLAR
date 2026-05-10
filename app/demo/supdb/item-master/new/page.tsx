export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main style={{ padding: 16, fontFamily: "Arial, sans-serif", maxWidth: 900 }}>
      <h2>New Item</h2>

      <form action="/demo/supdb/item-master/api/create" method="POST">
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            Item Code
            <input name="item_code" required style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Name
            <input name="name" style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Nomenclature
            <input name="nomenclature" style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Item Class (cdm.item_class)
            <input name="item_class" style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            UOM
            <input name="uom" style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Description
            <textarea name="description" style={{ width: "100%", padding: 8, minHeight: 80 }} />
          </label>

          <label>
            Hazard Note
            <textarea name="hazard_note" style={{ width: "100%", padding: 8, minHeight: 80 }} />
          </label>

          <label>
            Status (cdm.status_active)
            <input name="status" defaultValue="active" style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Reference Set UID
            <input name="reference_set_uid" style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Namespace UID
            <input name="namespace_uid" style={{ width: "100%", padding: 8 }} />
          </label>

          <label>
            Notes (char)
            <input name="notes" style={{ width: "100%", padding: 8 }} />
          </label>

          <button type="submit" style={{ padding: "8px 12px", width: 160 }}>
            Create
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