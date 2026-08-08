import { NextResponse } from "next/server";
import { buildEntityPreview } from "@/lib/compiler/preview";
import { validateEntityPayload } from "@/lib/compiler/validation";
import { coerceEntityPayload } from "@/lib/compiler/coercion";
import { validateForeignKeys } from "@/lib/compiler/foreign-keys";

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

    const payload =
      body as Record<string, unknown>;

    const validation = validateEntityPayload(
      preview,
      payload
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          valid: false,
          stage: "validation",
          errors: validation.errors,
        },
        { status: 422 }
      );
    }

    const coercion = coerceEntityPayload(
      preview,
      payload
    );

    if (!coercion.valid) {
      return NextResponse.json(
        {
          valid: false,
          stage: "coercion",
          errors: coercion.errors,
        },
        { status: 422 }
      );
    }

    const foreignKeys = await validateForeignKeys(
      preview,
      coercion.values
    );

    if (!foreignKeys.valid) {
      return NextResponse.json(
        {
          valid: false,
          stage: "foreign_keys",
          errors: foreignKeys.errors,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      valid: true,
      stage: "ready",
      values: coercion.values,
      errors: [],
    });
  } catch (error) {
    console.error(
      "Compiler payload preparation failed:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to prepare entity data",
      },
      { status: 500 }
    );
  }
}
