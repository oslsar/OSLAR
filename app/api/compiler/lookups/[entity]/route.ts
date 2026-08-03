import { NextResponse } from "next/server";
import { getLookupItems } from "@/lib/compiler/lookups";

export const dynamic = "force-dynamic";

function parseLimit(value: string | null): number {
  if (!value) {
    return 25;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 25;
  }

  return Math.min(Math.max(parsed, 1), 100);
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{ entity: string }>;
  }
) {
  try {
    const { entity } = await context.params;
    const url = new URL(request.url);

    const result = await getLookupItems(entity, {
      query: url.searchParams.get("q"),
      limit: parseLimit(url.searchParams.get("limit")),
    });

    if (!result) {
      return NextResponse.json(
        {
          error: "Entity not found",
          entity,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Compiler lookup failed:", error);

    return NextResponse.json(
      {
        error: "Unable to load lookup values",
      },
      { status: 500 }
    );
  }
}
