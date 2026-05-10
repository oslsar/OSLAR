import Section from "@/components/section";

export const metadata = { title: "Changelog" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Changelog</h1>
        <p className="mt-2 text-sm text-zinc-700 max-w-3xl">A strict changelog keeps auditors and integrators happy.</p>
      </div>

      <Section title="Source of truth" subtitle="">
        <p className="text-sm text-zinc-700">In the repo: <code>/docs/changelog.md</code></p>
      </Section>

    </div>
  );
}
