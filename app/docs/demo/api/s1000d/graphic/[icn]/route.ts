import { NextRequest } from "next/server";
import { pool } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ icn: string }> }
) {
  const { icn } = await params;
  const decodedIcn = decodeURIComponent(icn);

  try {
    const res = await pool.query(
      `SELECT icn, mime_type, binary_path
       FROM s1kd_core.graphic
       WHERE icn = $1`,
      [decodedIcn]
    );

    if (!res.rows.length) {
      return new Response("Not found", { status: 404 });
    }

    const row = res.rows[0];
    const graphicsRoot = process.env.S1000D_GRAPHICS_ROOT || "/data/s1000d_graphics";

    const filePath =
      row.binary_path && row.binary_path.startsWith("/")
        ? row.binary_path
        : path.join(graphicsRoot, `${row.icn}.png`);

    if (!fs.existsSync(filePath)) {
      return new Response(`Graphic file not found: ${filePath}`, { status: 404 });
    }

    const file = fs.readFileSync(filePath);

    return new Response(file, {
      headers: {
        "Content-Type": row.mime_type || "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return new Response(err.message || "Server error", { status: 500 });
  }
}
