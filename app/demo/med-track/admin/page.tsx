import Link from "next/link";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";

export default function MedTrackAdminPage() {
  return (
    <AppShell current="admin">
      <PageHeader
        title="MedTrack Admin"
        backHref="/demo/med-track"
        backLabel="Dashboard"
      />

      <p>Admin and data testing area for future OSLAR generic GUI patterns.</p>

      <ul>
        <li>
          <Link href="/demo/med-track/admin/items">Items Table</Link>
        </li>
        <li>
          <Link href="/demo/med-track/admin/schedules">Schedules Table</Link>
        </li>
        <li>
          <Link href="/demo/med-track/admin/dose-logs">Dose Logs Table</Link>
        </li>
        <li>
          <Link href="/demo/med-track/admin/symptoms">Symptoms Table</Link>
        </li>
        <li>
          <Link href="/demo/med-track/admin/users">Users Table</Link>
        </li>
      </ul>
    </AppShell>
  );
}
