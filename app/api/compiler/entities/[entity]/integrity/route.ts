import { NextResponse } from "next/server";
import { checkEntityIntegrity } from "@/lib/compiler/integrity";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ entity: string }>;
  }
) {
  try {
    const { entity } = await context.params;

    const result =
      await checkEntityIntegrity(entity);

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
    console.error(
      "Compiler integrity check failed:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to check entity integrity",
      },
      { status: 500 }
    );
  }
}
