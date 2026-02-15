import { NextResponse } from "next/server";

import { deleteRecord } from "@/lib/archive-store";
import { getDataPaths, resolveDataDir } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;

  const dataDir = resolveDataDir();
  const paths = getDataPaths(dataDir);

  const deleted = await deleteRecord(paths, id);

  if (!deleted) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
