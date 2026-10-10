export default function SummaryCard({
  title,
  icon,
  value,
  subtitle,
  tone = "default",
  children,
}: {
  title: string;
  icon?: string;
  value?: string;
  subtitle?: string;
  tone?: "default" | "blue" | "green" | "purple" | "orange";
  children?: React.ReactNode;
}) {
  const tones = {
    default: "border-gray-200 bg-white",
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    purple: "border-purple-200 bg-purple-50",
    orange: "border-orange-200 bg-orange-50",
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-base font-semibold text-gray-700">
        {icon && <span>{icon}</span>}
        <span>{title}</span>
      </div>

      {children ? (
        <div className="mt-3">{children}</div>
      ) : (
        <>
          <div className="mt-2 text-4xl font-bold text-gray-900">{value}</div>
          {subtitle && <div className="mt-1 text-sm text-gray-600">{subtitle}</div>}
        </>
      )}
    </div>
  );
}