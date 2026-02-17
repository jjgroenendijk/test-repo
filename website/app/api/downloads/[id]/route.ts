import { NextResponse } from "next/server";

import { deleteRecord, ensureDataStorage } from "@/lib/archive-store";
import { getDataPaths, resolveDataDir } from "@/lib/ytdlp";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const dataDir = resolveDataDir();
  const paths = getDataPaths(dataDir);
  await ensureDataStorage(paths);

  const success = await deleteRecord(paths, id);

  if (!success) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
