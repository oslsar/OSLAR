import Link from "next/link";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LsarPage() {
  const result = await pool.query<{
    entity_code: string;
    navigation_label: string;
  }>(`
    SELECT e.entity_code,
           COALESCE(NULLIF(b.navigation_label, ''), e.entity_name, e.entity_code)
             AS navigation_label
    FROM lsar_meta.entity e
    JOIN lsar_meta.entity_behavior b ON b.entity_code = e.entity_code
    WHERE e.include_entity AND b.active AND b.show_in_navigation
    ORDER BY b.navigation_order NULLS LAST, e.entity_code
  `);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-950">LSAR entities</h1>
      <nav aria-label="LSAR entities" className="mt-8">
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.rows.map((entity) => (
            <li key={entity.entity_code}>
              <Link
                href={`/lsar/entities/${encodeURIComponent(entity.entity_code)}`}
                className="block rounded-lg border border-gray-200 p-5 text-gray-950 hover:bg-gray-50"
              >
                <span className="block font-semibold">{entity.navigation_label}</span>
                <span className="mt-1 block text-sm text-gray-500">{entity.entity_code}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
