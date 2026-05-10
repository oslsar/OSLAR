import Section from "@/components/section";

export const metadata = { title: "Contact" };

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contact</h1>
        <p className="mt-2 text-sm text-zinc-700 max-w-3xl">Request a pilot or ask technical questions. Keep messages high-level (no sensitive data).</p>
      </div>

      <Section title="Email" subtitle="">
        <p className="text-sm text-zinc-700">contact@yourdomain.com</p>
      </Section>


      <Section title="What to include" subtitle="">
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
  <li>Program context (high-level)</li>
  <li>Data sources (LSAR exports, tools)</li>
  <li>Desired outputs (tailored schema, reports, compliance matrix)</li>
</ul>
      </Section>

    </div>
  );
}
