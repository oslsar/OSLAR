type AlertVariant = "success" | "info" | "danger";

export default function Alert({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: AlertVariant;
}) {
  const styles: Record<AlertVariant, React.CSSProperties> = {
    success: {
      background: "#dcfce7",
      border: "1px solid #86efac",
      color: "#166534",
    },
    info: {
      background: "#dbeafe",
      border: "1px solid #93c5fd",
      color: "#1d4ed8",
    },
    danger: {
      background: "#fee2e2",
      border: "1px solid #fca5a5",
      color: "#991b1b",
    },
  };

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 6,
        marginBottom: 20,
        width: "fit-content",
        ...styles[variant],
      }}
    >
      {children}
    </div>
  );
}
