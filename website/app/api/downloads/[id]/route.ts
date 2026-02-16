import { NextResponse } from "next/server";
import { resolveDataDir, getDataPaths } from "@/lib/ytdlp";
import { deleteRecord } from "@/lib/archive-store";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const dataDir = resolveDataDir();
  const paths = getDataPaths(dataDir);

  const success = await deleteRecord(paths, id);

  if (!success) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
