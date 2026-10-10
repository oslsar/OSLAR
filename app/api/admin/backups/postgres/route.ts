import { NextResponse } from "next/server";
import { getAdminAgentUrl } from "@/lib/admin-agent";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = await fetch(getAdminAgentUrl("/backups/postgres"), {
    method: "POST",
    cache: "no-store",
  });

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
