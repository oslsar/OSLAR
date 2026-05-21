export const dynamic = "force-dynamic";

export default function NewItemPage() {
  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <p>
        <a href="/demo/med-track/items">← Back to Items</a>
      </p>

      <h1>New Item</h1>

      <form method="POST" action="/demo/med-track/api/items">
        <p>
          <label>
            Name<br />
            <input name="name" required style={{ width: 300 }} />
          </label>
        </p>

        <p>
          <label>
            Kind<br />
            <select name="kind" required>
              <option value="supplement">Supplement</option>
              <option value="medicine">Medicine</option>
            </select>
          </label>
        </p>

        <p>
          <label>
            Strength<br />
            <input name="strength" placeholder="e.g. 500 mg" style={{ width: 300 }} />
          </label>
        </p>

        <p>
          <label>
            Form<br />
            <input name="form" placeholder="tablet, capsule, liquid..." style={{ width: 300 }} />
          </label>
        </p>

        <p>
          <label>
            Notes<br />
            <textarea name="notes" rows={4} style={{ width: 400 }} />
          </label>
        </p>

        <button type="submit">Save Item</button>
      </form>
    </main>
  );
}
