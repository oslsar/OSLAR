import { NextResponse } from "next/server";
import { createEntityRecord } from "@/lib/compiler/create";
import { updateEntityRecord } from "@/lib/compiler/update";

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

export async function PATCH(
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

    const requestBody =
      body as Record<string, unknown>;

    const keyValues = requestBody.keys;
    const values = requestBody.values;

    if (
      typeof keyValues !== "object" ||
      keyValues === null ||
      Array.isArray(keyValues)
    ) {
      return NextResponse.json(
        {
          error: "keys must be a JSON object",
        },
        { status: 400 }
      );
    }

    if (
      typeof values !== "object" ||
      values === null ||
      Array.isArray(values)
    ) {
      return NextResponse.json(
        {
          error: "values must be a JSON object",
        },
        { status: 400 }
      );
    }

    const result = await updateEntityRecord(
      entity,
      keyValues as Record<string, unknown>,
      values as Record<string, unknown>
    );

    return NextResponse.json(
      result,
      { status: result.status }
    );
  } catch (error) {
    console.error(
      "Compiler update failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to update entity record",
      },
      { status: 500 }
    );
  }
}
