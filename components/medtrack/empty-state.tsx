export default function EmptyState({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div
      style={{
        padding: 32,
        border: "1px dashed #ccc",
        borderRadius: 8,
        background: "#fafafa",
        marginTop: 12,
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>

      {message && (
        <p style={{ marginBottom: 0, color: "#666" }}>
          {message}
        </p>
      )}
    </div>
  );
}
