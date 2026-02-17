import { NextResponse } from "next/server";

import { deleteHistoryItem } from "@/lib/archive-store";
import { resolveDataDir, getDataPaths } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing ID." }, { status: 400 });
  }

  const dataDir = resolveDataDir();
  const paths = getDataPaths(dataDir);

  try {
    const success = await deleteHistoryItem(paths, id);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Item not found." },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("Failed to delete item:", error);
    return NextResponse.json(
      { error: "Failed to delete item." },
      { status: 500 },
    );
  }
}
