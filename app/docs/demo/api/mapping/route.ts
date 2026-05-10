import { NextResponse } from "next/server";

type MappingRow = {
  column: string;
  geia?: { entity: string; attribute: string };
  mil?: { table: string; field: string; ded?: string };
  matchType: "exact" | "ded" | "heuristic" | "none";
};

const mappingByTable: Record<string, MappingRow[]> = {
  xa: [
    {
      column: "id",
      geia: { entity: "XA", attribute: "ID (demo)" },
      mil: { table: "XA", field: "EIACODXA", ded: "DED-XXXX (demo)" },
      matchType: "heuristic",
    },
    {
      column: "name",
      geia: { entity: "XA", attribute: "NAME (demo)" },
      matchType: "none",
    },
    {
      column: "created_at",
      matchType: "none",
    },
  ],
  ha: [
    {
      column: "item_id",
      geia: { entity: "HA", attribute: "ITEM IDENTIFIER (demo)" },
      mil: { table: "HA", field: "ITEMIDHA", ded: "DED-YYYY (demo)" },
      matchType: "heuristic",
    },
    {
      column: "nsn",
      geia: { entity: "HA", attribute: "NSN (demo)" },
      mil: { table: "HA", field: "NSNHA", ded: "DED-ZZZZ (demo)" },
      matchType: "ded",
    },
    {
      column: "description",
      geia: { entity: "HA", attribute: "DESCRIPTION (demo)" },
      matchType: "exact",
    },
  ],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table")?.toLowerCase();

  if (!table) {
    return NextResponse.json({ error: "Missing table" }, { status: 400 });
  }

  const rows = mappingByTable[table];
  if (!rows) {
    return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  }

  return NextResponse.json({ table, rows });
}
