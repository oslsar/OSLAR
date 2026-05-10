import Section from "@/components/section";

export const metadata = { title: "Standards" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Standards</h1>
        <p className="mt-2 text-sm text-zinc-700 max-w-3xl">OSLAR documents alignment without redistributing proprietary standards. Users must obtain licensed copies of applicable standards for authoritative definitions.</p>
      </div>

      <Section title="Copyright-safe alignment" subtitle="">
        <div className="text-sm text-zinc-700 space-y-2">
  <p>We do not reproduce standards text or tables. Alignment is described using original language and optional identifier references (e.g., DED numbers) only.</p>
  <p>See the repository <code>/standards</code> folder for baseline notes.</p>
</div>
      </Section>


      <Section title="Common references" subtitle="">
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
  <li>GEIA-STD-0007-C (alignment notes only)</li>
  <li>MIL-STD-1388-2B (legacy migration alignment notes only)</li>
</ul>
      </Section>

    </div>
  );
}
