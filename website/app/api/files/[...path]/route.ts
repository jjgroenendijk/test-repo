import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { resolveDataDir, getDataPaths } from "@/lib/ytdlp";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const relativePath = pathSegments.join("/");

  const dataDir = resolveDataDir();
  const paths = getDataPaths(dataDir);
  const downloadsDir = paths.downloadsDir;

  // Resolve the absolute path
  // Ensure we don't traverse up
  const safeRelativePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.join(downloadsDir, safeRelativePath);

  // Security check: ensure the path is definitely inside the downloads directory
  if (!absolutePath.startsWith(downloadsDir)) {
     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const stat = await fs.promises.stat(absolutePath);

    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }

    const fileStream = fs.createReadStream(absolutePath);
    const filename = path.basename(absolutePath);

    // Create a ReadableStream from the node stream
    const stream = new ReadableStream({
        start(controller) {
            fileStream.on("data", (chunk) => controller.enqueue(chunk));
            fileStream.on("end", () => controller.close());
            fileStream.on("error", (err) => controller.error(err));
        },
        cancel() {
            fileStream.destroy();
        }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": stat.size.toString(),
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    console.error("File download error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
