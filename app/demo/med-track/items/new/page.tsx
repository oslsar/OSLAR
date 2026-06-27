import Link from "next/link";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import FormBuilder from "@/components/medtrack/form-builder";
import Button from "@/components/medtrack/button";
import { itemFormFields } from "@/lib/medtrack/form-config";

export const dynamic = "force-dynamic";

export default function NewItemPage() {
  return (
    <AppShell>
      <PageHeader
        title="New Item"
        backHref="/demo/med-track/items"
        backLabel="Back to Items"
      />

      <form method="POST" action="/demo/med-track/api/items" autoComplete="off">
        <FormBuilder fields={itemFormFields} />

        <Button type="submit" variant="primary">
          Save Item
        </Button>
      </form>
    </AppShell>
  );
}