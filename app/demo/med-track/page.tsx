import AppShell from "@/components/medtrack/app-shell";
import Link from "next/link";


export default function MedTrackHome() {
  return (
    <AppShell title="MedTrack">
      <p>
        In-house supplement, medication, and symptom tracking application.
      </p>

      <ul>
        <li>
          <Link href="/demo/med-track/today">Today Dashboard</Link>
        </li>

        <li>
          <Link href="/demo/med-track/items">Items</Link>
        </li>

        <li>
          <Link href="/demo/med-track/schedules">Schedules</Link>
        </li>

        <li>
          <Link href="/demo/med-track/symptoms">Symptoms</Link>
        </li>

        <li>
          <Link href="/demo/med-track/history">History</Link>
        </li>

        <li>
          <Link href="/demo/med-track/admin">Admin</Link>
        </li>
      </ul>
    </AppShell>
  );
}