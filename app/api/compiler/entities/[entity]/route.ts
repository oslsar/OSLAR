import { NextResponse } from "next/server";
import { createEntityRecord } from "@/lib/compiler/create";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ entity: string }>;
  }
) {
  try {
    const { entity } = await context.params;
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          error: "Request body must be a JSON object",
        },
        { status: 400 }
      );
    }

    const result = await createEntityRecord(
      entity,
      body as Record<string, unknown>
    );

    if (!result.ok) {
      return NextResponse.json(
        result,
        { status: result.status }
      );
    }

    return NextResponse.json(
      result,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Compiler create failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to create entity record",
      },
      { status: 500 }
    );
  }
}
