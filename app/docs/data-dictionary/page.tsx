import Section from "@/components/section";

export const metadata = { title: "Data Dictionary" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Dictionary</h1>
        <p className="mt-2 text-sm text-zinc-700 max-w-3xl">Define semantics in original language. If you need alignment markers, reference identifiers only (e.g., DED 020).</p>
      </div>

      <Section title="Source of truth" subtitle="">
        <p className="text-sm text-zinc-700">In the repo: <code>/docs/data-dictionary.md</code></p>
      </Section>

    </div>
  );
}
