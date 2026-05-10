async function getTables() {
  const res = await fetch("http://localhost:3000/demo/api/schema", {
    cache: "no-store",
  });
  return res.json();
}

export default async function Page() {
  const data = await getTables();

  return (
    <main>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Tables</h1>

      <ul style={{ marginTop: 16 }}>
        {data.tables.map((t: any) => (
          <li key={t.name}>
            <a href={`/demo/browse/tables/${t.name}`}>
              {t.name}
            </a>{" "}
            — {t.description}
          </li>
        ))}
      </ul>
    </main>
  );
}
