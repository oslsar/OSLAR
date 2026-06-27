import Link from "next/link";

export default function PageHeader({
  title,
  backHref,
  backLabel,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      {backHref && (
        <p>
          <Link href={backHref}>
            ← {backLabel || "Back"}
          </Link>
        </p>
      )}

	  <h1
        style={{
          fontSize: "2rem",
          fontWeight: 800,
          marginBottom: 16,
        }}
      >
        {title}
      </h1>
    </div>
  );
}
