async function getPM(pmCode: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/demo/api/s1000d/pm?code=${encodeURIComponent(pmCode)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Failed to load PM: ${res.status}`);
  }

  return res.json();
}

export default async function Page(
  { params }: { params: Promise<{ pmCode: string }> }
) {
  const { pmCode } = await params;
  const data = await getPM(pmCode);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{data.header?.pm_title || pmCode}</h1>
      <p className="mb-4 text-sm">{data.header?.pm_code || pmCode}</p>
      <div className="space-y-2">
        {data.toc?.map((entry: any) => (
          <div key={entry.seq_no} className="border rounded p-3">
            <div className="font-medium">{entry.title || entry.target_code || entry.entry_type}</div>
            <div className="text-sm">{entry.entry_type}</div>
            {entry.entry_type === "dm" && entry.target_code && (
              <a className="text-blue-600 underline" href={`/demo/s1000d/dm/${encodeURIComponent(entry.target_code)}`}>
                Open {entry.target_code}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
