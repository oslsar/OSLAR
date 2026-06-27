type ButtonVariant = "primary" | "success" | "danger" | "secondary";

export default function Button({
  children,
  type = "button",
  variant = "secondary",
  form,
  name,
  value,
  onClick,
}: {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
  form?: string;
  name?: string;
  value?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
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
      background: "#6c757d",
      color: "#fff",
      border: "1px solid #6c757d",
    },
  };

  return (
    <button
      type={type}
      form={form}
      name={name}
      value={value}
      onClick={onClick}
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