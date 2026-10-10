import { NextResponse } from "next/server";
import { buildEntityPreview } from "@/lib/compiler/preview";
import { validateEntityPayload } from "@/lib/compiler/validation";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ entity: string }>;
  }
) {
  try {
    const { entity } = await context.params;
    const preview = await buildEntityPreview(entity);

    if (!preview) {
      return NextResponse.json(
        {
          error: "Entity not found",
          entity,
        },
        { status: 404 }
      );
    }

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

    const result = validateEntityPayload(
      preview,
      body as Record<string, unknown>
    );

    return NextResponse.json(result, {
      status: result.valid ? 200 : 422,
    });
  } catch (error) {
    console.error(
      "Compiler validation failed:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to validate entity data",
      },
      { status: 500 }
    );
  }
}
