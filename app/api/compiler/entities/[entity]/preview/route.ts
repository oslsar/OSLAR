import { NextResponse } from "next/server";
import { buildEntityPreview } from "@/lib/compiler/preview";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
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

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Compiler preview failed:", error);

    return NextResponse.json(
      {
        error: "Unable to build compiler preview",
      },
      { status: 500 }
    );
  }
}
