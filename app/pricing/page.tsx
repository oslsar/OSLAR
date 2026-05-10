import Section from "@/components/section";

export const metadata = { title: "Pricing" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pricing</h1>
        <p className="mt-2 text-sm text-zinc-700 max-w-3xl">Keep pricing simple and procurement-friendly. Start with a pilot, then convert to annual support.</p>
      </div>

      <Section title="Pilot (fixed scope)" subtitle="">
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
  <li>30–60 day pilot</li>
  <li>Migration assessment + schema tailoring profile</li>
  <li>Deliverables: tailored schema, validation checks, traceability matrix</li>
</ul>
      </Section>


      <Section title="Support (annual)" subtitle="">
        <div className="text-sm text-zinc-700 space-y-2">
  <p>Annual support and roadmap alignment (customer-controlled deployments).</p>
  <p>Enterprise features and SLAs available under commercial terms.</p>
</div>
      </Section>

    </div>
  );
}
