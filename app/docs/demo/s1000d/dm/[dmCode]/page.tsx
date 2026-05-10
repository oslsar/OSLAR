async function getDM(dmCode: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/demo/api/s1000d/dm?code=${encodeURIComponent(dmCode)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Failed to load DM: ${res.status}`);
  }

  return res.json();
}

function RenderBlock({ block }: any) {
  const b = block.block_json;

  switch (block.block_type) {
    case "title":
      return <h1 className="text-2xl font-bold my-4">{b.text}</h1>;
    case "para":
      return <p className="my-2">{b.text}</p>;
    case "warning":
      return <div className="border p-2 my-2 rounded">⚠️ {b.text}</div>;
    case "caution":
      return <div className="border p-2 my-2 rounded">⚠️ {b.text}</div>;
    case "note":
      return <div className="border p-2 my-2 rounded">ℹ️ {b.text}</div>;
    case "step":
      return <div className="my-1">{b.num}. {b.text}</div>;
    case "figure":
      return (
        <figure className="my-4">
          <img
            src={`/demo/api/s1000d/graphic/${encodeURIComponent(b.icn)}`}
            alt={b.title || b.icn}
          />
          <figcaption>{b.title || b.icn}</figcaption>
        </figure>
      );
    default:
      return <pre>{JSON.stringify(b, null, 2)}</pre>;
  }
}

export default async function Page(
  { params }: { params: Promise<{ dmCode: string }> }
) {
  const { dmCode } = await params;
  const data = await getDM(dmCode);

  return (
    <div className="p-6">
      <h2 className="text-xl mb-2">{data.header?.info_name || dmCode}</h2>
      {data.header?.tech_name && (
        <p className="mb-4 text-sm">{data.header.tech_name}</p>
      )}
      {data.blocks?.map((b: any) => (
        <RenderBlock key={b.seq_no} block={b} />
      ))}
    </div>
  );
}
