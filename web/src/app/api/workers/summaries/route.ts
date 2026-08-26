import { NextResponse } from "next/server";
import { getWorkerSummaries } from "@/lib/workers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const trade = searchParams.get("trade") ?? undefined;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const workers = await getWorkerSummaries({
      limit: Number.isNaN(limit) ? undefined : limit,
      trade,
    });

    return NextResponse.json({ workers }, { status: 200 });
  } catch (error) {
    console.error("[workers/summaries GET]", error);
    return NextResponse.json(
      { message: "Unable to load workers right now." },
      { status: 500 },
    );
  }
}



