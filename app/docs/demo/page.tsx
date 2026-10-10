import Link from "next/link";

const areas = [
  {
    title: "LSAR Catalogue",
    description:
      "Browse tables, fields, constraints, relationships and graphical access definitions.",
    href: "/docs/demo/browse",
    status: "Existing prototype",
  },
  {
    title: "Standards & Mappings",
    description:
      "Connect OSLAR tables and fields to GEIA-STD-0007 and MIL-STD-1388 definitions.",
    href: "/docs/demo/standards",
    status: "Phase 2 foundation",
  },
  {
    title: "Tailoring Studio",
    description:
      "Configure labels, fields, forms, validation, relationships and customer extensions.",
    href: "/docs/demo/tailoring",
    status: "Phase 2 foundation",
  },
  {
    title: "Query Studio",
    description:
      "Build safe ad hoc queries using metadata, permissions and validated query plans.",
    href: "/docs/demo/query",
    status: "Prototype",
  },
  {
    title: "Change Requests",
    description:
      "Request general or customer-specific additions for review and future OSLAR releases.",
    href: "/docs/demo/tailoring",
    status: "Planned",
  },
  {
    title: "Administration",
    description:
      "Review server, database, container, backup and storage health.",
    href: "/admin",
    status: "In development",
  },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-gray-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          OSLAR Phase 2
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
          Metadata-driven LSAR workspace
        </h1>

        <p className="mt-3 max-w-3xl text-gray-600">
          Phase 2 will provide rapid table creation, graphical tailoring,
          standards traceability, controlled customer extensions and safe
          ad hoc querying.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => (
          <Link
            key={area.title}
            href={area.href}
            className="rounded-xl border border-gray-200 bg-white p-6 no-underline shadow-sm transition hover:border-gray-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-950">
                {area.title}
              </h2>

              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                {area.status}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {area.description}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-blue-950">
          Phase 2 performance targets
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-2xl font-bold text-blue-950">
              Under 5 minutes
            </div>
            <div className="mt-1 text-sm text-blue-800">
              Add a table and expose it through the graphical interface.
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-blue-950">
              Under 10 minutes
            </div>
            <div className="mt-1 text-sm text-blue-800">
              Tailor an existing table, form or list presentation.
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold text-blue-950">
              Controlled access
            </div>
            <div className="mt-1 text-sm text-blue-800">
              Run validated queries and submit governed change requests.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
