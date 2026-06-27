import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";

export default function ReportsPage() {
  return (
    <AppShell current="reports">
      <PageHeader
        title="Reports"
        backHref="/demo/med-track"
        backLabel="Dashboard"
      />

      <iframe
        src="http://192.168.1.97:3001/public/dashboard/ae571f45-1c1a-4212-ac30-218c9e2731de"
        width="100%"
        height="900"
        style={{
          border: "none",
          borderRadius: 8,
        }}
      />
    </AppShell>
  );
}