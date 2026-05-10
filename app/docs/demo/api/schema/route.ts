import { NextResponse } from "next/server";

const schema = {
  xa: {
    description: "Provisioning data",
    columns: [
      { name: "id", type: "uuid", nullable: false },
      { name: "name", type: "text", nullable: false },
      { name: "created_at", type: "timestamp", nullable: false },
    ],
  },
  ha: {
    description: "Item master",
    columns: [
      { name: "item_id", type: "varchar(20)", nullable: false },
      { name: "nsn", type: "varchar(13)", nullable: true },
      { name: "description", type: "text", nullable: false },
    ],
  },
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");

  // ✅ No table specified => return a list of tables
  if (!table) {
    const tables = Object.entries(schema).map(([name, def]) => ({
      name,
      description: def.description ?? "",
      columnCount: def.columns.length,
    }));

    // nice stable ordering
    tables.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ tables });
  }

  // ✅ Table specified => return table details
  const key = table.toLowerCase() as keyof typeof schema;
  const def = schema[key];

  if (!def) {
    return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  }

  return NextResponse.json({
    name: key,
    description: def.description ?? "",
    columns: def.columns,
  });
}
