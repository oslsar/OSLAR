import Section from "@/components/section";

export const metadata = { title: "Architecture" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Architecture</h1>
        <p className="mt-2 text-sm text-zinc-700 max-w-3xl">A conservative, auditable structure: canonical schema + meta-model for tailoring + traceability mappings.</p>
      </div>

      <Section title="Source of truth" subtitle="">
        <p className="text-sm text-zinc-700">In the repo: <code>/docs/architecture.md</code></p>
      </Section>

    </div>
  );
}
