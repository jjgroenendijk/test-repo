import { NextResponse } from "next/server";

import {
  deleteRecord,
  ensureDataStorage,
} from "@/lib/archive-store";
import {
  getDataPaths,
  resolveDataDir,
} from "@/lib/ytdlp";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Record ID is required." },
      { status: 400 },
    );
  }

  const dataDir = resolveDataDir();
  const paths = getDataPaths(dataDir);
  await ensureDataStorage(paths);

  try {
    await deleteRecord(paths, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete record.", details: String(error) },
      { status: 500 },
    );
  }
}
