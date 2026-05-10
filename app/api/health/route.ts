import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "oslar-site", ts: new Date().toISOString() });
}
