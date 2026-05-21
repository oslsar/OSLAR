import Link from "next/link";

export default function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <nav style={{ marginBottom: 24 }}>
        <Link href="/demo/med-track">Home</Link>{" | "}
        <Link href="/demo/med-track/today">Today</Link>{" | "}
        <Link href="/demo/med-track/items">Items</Link>{" | "}
        <Link href="/demo/med-track/schedules">Schedules</Link>{" | "}
        <Link href="/demo/med-track/symptoms">Symptoms</Link>{" | "}
        <Link href="/demo/med-track/admin">Admin</Link>
      </nav>

      
      {children}
    </main>
  );
}
