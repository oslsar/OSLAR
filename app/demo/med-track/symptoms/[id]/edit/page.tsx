import { notFound } from "next/navigation";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import FormBuilder from "@/components/medtrack/form-builder";
import Button from "@/components/medtrack/button";
import { symptomFormFields } from "@/lib/medtrack/form-config";
import { pool } from "@/lib/medtrack/db";

export const dynamic = "force-dynamic";

export default async function EditSymptomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await pool.query(
    `
    select *
    from medtrack.symptom_logs
    where id = $1
    limit 1
    `,
    [id]
  );

  const symptom = result.rows[0];

  if (!symptom) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        title="Edit Symptom"
        backHref="/demo/med-track/symptoms"
        backLabel="Back to Symptoms"
      />

      <form method="POST" action={`/demo/med-track/api/symptoms/${symptom.id}`}>
        <FormBuilder fields={symptomFormFields} values={symptom} />

        <Button type="submit" variant="primary">
          Save Changes
        </Button>
      </form>
    </AppShell>
  );
}
