type ButtonVariant = "primary" | "success" | "danger" | "secondary";

export default function Button({
  children,
  type = "button",
  variant = "secondary",
}: {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
}) {
  const styles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: "#1f6feb",
      color: "white",
      border: "1px solid #1f6feb",
    },
    success: {
      background: "#238636",
      color: "white",
      border: "1px solid #238636",
    },
    danger: {
      background: "#da3633",
      color: "white",
      border: "1px solid #da3633",
    },
    secondary: {
      background: "#f5f5f5",
      color: "#111",
      border: "1px solid #ccc",
    },
  };

  return (
    <button
      type={type}
      style={{
        padding: "8px 14px",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 14,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}
