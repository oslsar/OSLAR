import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import FormBuilder from "@/components/medtrack/form-builder";
import Button from "@/components/medtrack/button";
import { symptomFormFields } from "@/lib/medtrack/form-config";

export const dynamic = "force-dynamic";

export default function NewSymptomPage() {
  return (
    <AppShell>
      <PageHeader
        title="Log Symptom"
        backHref="/demo/med-track/symptoms"
        backLabel="Back to Symptoms"
      />

      <form method="POST" action="/demo/med-track/api/symptoms" autoComplete="off">
        <FormBuilder fields={symptomFormFields} />

        <Button type="submit" variant="primary">
          Save Symptom
        </Button>
      </form>
    </AppShell>
  );
}