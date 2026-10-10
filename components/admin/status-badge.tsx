type BadgeColour = "green" | "blue" | "red";

export default function StatusBadge({
  label,
  colour,
}: {
  label: string;
  colour: BadgeColour;
}) {
  const colours = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${colours[colour]}`}>
      {label}
    </span>
  );
}
