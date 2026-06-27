import Link from "next/link";

export default function AppShell({
  current,
  children,
}: {
  current?: string;
  children: React.ReactNode;
}) {
  const linkStyle = (name: string) => ({
    fontWeight: current === name ? 700 : 400,
    textDecoration: current === name ? "none" : "underline",
    color: current === name ? "#222" : "#0d6efd",
  });

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <nav style={{ marginBottom: 24 }}>

        <Link href="/demo/med-track/dashboard" style={linkStyle("dashboard")}>
          Dashboard
        </Link>{" | "}

        <Link href="/demo/med-track/items" style={linkStyle("items")}>
          Items
        </Link>{" | "}

        <Link href="/demo/med-track/schedules" style={linkStyle("schedules")}>
          Schedules
        </Link>{" | "}

        <Link href="/demo/med-track/symptoms" style={linkStyle("symptoms")}>
          Symptoms
        </Link>{" | "}

        <Link href="/demo/med-track/reports" style={linkStyle("reports")}>
          Reports
        </Link>{" | "}

        <Link href="/demo/med-track/admin" style={linkStyle("admin")}>
          Admin
        </Link>
      </nav>

      {children}
    </main>
  );
}