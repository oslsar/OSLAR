import Link from "next/link";

export default function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          ← {backLabel}
        </Link>
      )}

      <h1 className="text-2xl font-bold text-gray-950">
        {title}
      </h1>

      {description && (
        <p className="mt-1 text-sm text-gray-600">
          {description}
        </p>
      )}
    </div>
  );
}