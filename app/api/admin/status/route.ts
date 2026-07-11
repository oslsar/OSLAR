import { NextResponse } from "next/server";
import { getAdminAgentUrl } from "@/lib/admin-agent";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = await fetch(getAdminAgentUrl("/health"), {
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { ok: false, error: "OSLAR Agent unavailable" },
      { status: 503 }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}