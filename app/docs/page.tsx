import Section from "@/components/section";

export const metadata = { title: "Docs" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Docs</h1>
        <p className="mt-2 text-sm text-zinc-700 max-w-3xl">Start here for schema, tailoring, and traceability. Keep docs boring and auditable.</p>
      </div>

      <Section title="Repository docs" subtitle="">
        <div className="grid gap-4 md:grid-cols-3">
  <a className="no-underline" href="/docs/data-dictionary"><div className="rounded-2xl border border-zinc-200 p-5 shadow-sm hover:border-zinc-300">
    <div className="text-sm font-semibold">Data Dictionary</div><div className="mt-2 text-sm text-zinc-600">Entity/field definitions in OSLAR language.</div>
  </div></a>
  <a className="no-underline" href="/docs/architecture"><div className="rounded-2xl border border-zinc-200 p-5 shadow-sm hover:border-zinc-300">
    <div className="text-sm font-semibold">Architecture</div><div className="mt-2 text-sm text-zinc-600">Design principles and system boundaries.</div>
  </div></a>
  <a className="no-underline" href="/docs/changelog"><div className="rounded-2xl border border-zinc-200 p-5 shadow-sm hover:border-zinc-300">
    <div className="text-sm font-semibold">Changelog</div><div className="mt-2 text-sm text-zinc-600">Versioned change history.</div>
  </div></a>
</div>
      </Section>

    </div>
  );
}
