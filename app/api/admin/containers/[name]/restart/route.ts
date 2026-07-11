import { NextResponse } from "next/server";
import { getAdminAgentUrl } from "@/lib/admin-agent";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  const response = await fetch(
    getAdminAgentUrl(`/containers/${encodeURIComponent(name)}/restart`),
    {
      method: "POST",
      cache: "no-store",
    }
  );

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
