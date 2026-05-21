export default function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        minWidth: 160,
        background: "#fafafa",
      }}
    >
      <div style={{ fontSize: 13, color: "#555" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: "bold", marginTop: 4 }}>
        {value}
      </div>
      {note && <div style={{ fontSize: 12, color: "#777" }}>{note}</div>}
    </div>
  );
}
