import Link from "next/link";

export default function AddButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: "#0d6efd",
        color: "#fff",
        padding: "10px 16px",
        borderRadius: 6,
        textDecoration: "none",
        fontWeight: 600,
      }}
    >
      + {label}
    </Link>
  );
}