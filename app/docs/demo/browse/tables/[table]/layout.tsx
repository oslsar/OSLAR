import Link from "next/link";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  const base = `/demo/browse/tables/${table}`;

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Table: {table.toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Demo schema explorer (API-backed)
          </p>
        </div>

        <Link
          href="/demo/browse"
          className="w-fit rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Back to Browse
        </Link>
      </div>

      <div className="mt-6 border-b border-gray-200">
        <nav className="flex gap-6 text-sm">
          <Link href={`${base}/columns`} className="pb-2 hover:text-gray-900">
            Columns
          </Link>
          <Link href={`${base}/constraints`} className="pb-2 hover:text-gray-900">
            Constraints
          </Link>
          <Link href={`${base}/mapping`} className="pb-2 hover:text-gray-900">
            Standards Mapping
          </Link>
          <Link href={`${base}/tailoring`} className="pb-2 hover:text-gray-900">
            Tailoring Impact
          </Link>
        </nav>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
