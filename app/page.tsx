import Section from "@/components/section";
import { Card } from "@/components/card";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
          Defense-safe • Audit-ready • PostgreSQL-first
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Modernize LSAR workflows without breaking traceability.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-700">
          OSLAR provides a standards-aligned data model, tailoring meta-layer, and migration-friendly tooling for
          sustainment and logistics programs.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            className="no-underline rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800"
            href="/demo"
          >
            Explore the platform
          </a>
          <a
            className="no-underline rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900 hover:border-zinc-400"
            href="/docs"
          >
            Read the docs
          </a>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          title="Tailoring built-in"
          body="Select program-specific subsets using oslar_meta.dbinfo + tailoring profiles."
          href="/docs"
        />
        <Card
          title="Migration-friendly"
          body="Source keys + optional raw_payload JSONB for lossless import and audit trails."
          href="/product"
        />
        <Card
          title="Traceability ready"
          body="Requirement → field mapping supports DID/RFP matrices and evidence artifacts."
          href="/docs"
        />
      </div>

      <Section title="What you get" subtitle="A boring, inspectable foundation that procurement teams can live with.">
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
          <li>Canonical PostgreSQL schema and migrations</li>
          <li>Meta layer for tailoring and traceability</li>
          <li>Documentation: dictionary, architecture, changelog</li>
          <li>Conservative language and governance defaults</li>
        </ul>
      </Section>
    </div>
  );
}
