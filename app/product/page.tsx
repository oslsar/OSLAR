import Section from "@/components/section";

export const metadata = { title: "Product" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Product</h1>
        <p className="mt-2 text-sm text-zinc-700 max-w-3xl">OSLAR is a PostgreSQL-first data foundation for LSAR modernization. Start with a minimal, tailorable schema and expand as requirements stabilize.</p>
      </div>

      <Section title="Core capabilities" subtitle="">
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
  <li>Canonical schema + migrations (PostgreSQL)</li>
  <li>Tailoring meta-model (dbinfo + profiles)</li>
  <li>Requirement traceability (DID/RFP → fields)</li>
  <li>Migration-friendly import patterns</li>
</ul>
      </Section>


      <Section title="Deployment modes" subtitle="">
        <div className="text-sm text-zinc-700 space-y-2">
  <p><strong>Marketing site:</strong> static content on Vercel/Netlify or self-hosted.</p>
  <p><strong>Product deployments:</strong> customer-controlled environments (cloud or on-prem) with explicit data boundaries.</p>
</div>
      </Section>

    </div>
  );
}
