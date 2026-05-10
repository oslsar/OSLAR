import { NextResponse } from "next/server";

const constraintsByTable: Record<
  string,
  {
    primaryKey?: string[];
    foreignKeys?: { column: string; references: string }[];
    checks?: string[];
    indexes?: string[];
  }
> = {
  xa: {
    primaryKey: ["id"],
    foreignKeys: [{ column: "id", references: "ha.item_id (demo)" }],
    checks: ["created_at IS NOT NULL"],
    indexes: ["idx_xa_created_at (created_at)"],
  },
  ha: {
    primaryKey: ["item_id"],
    checks: ["length(item_id) > 0"],
    indexes: ["idx_ha_nsn (nsn)"],
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table")?.toLowerCase();

  if (!table) {
    return NextResponse.json({ error: "Missing table" }, { status: 400 });
  }

  const data = constraintsByTable[table];
  if (!data) {
    return NextResponse.json({ error: "Unknown table" }, { status: 404 });
  }

  return NextResponse.json({ table, ...data });
}
