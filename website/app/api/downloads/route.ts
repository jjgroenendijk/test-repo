import { spawn } from "node:child_process";
import crypto from "node:crypto";

import { NextResponse } from "next/server";

import {
  appendHistory,
  ensureDataStorage,
  readHistory,
  type DownloadRecord,
} from "@/lib/archive-store";
import {
  buildYtDlpArgs,
  getDataPaths,
  parseDownloadedFiles,
  resolveDataDir,
  validateVideoUrl,
  type DownloadMode,
} from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YT_DLP_BIN = process.env.YT_DLP_BIN ?? "yt-dlp";

function parseMode(value: unknown): DownloadMode {
  return value === "audio" ? "audio" : "video";
}

function parsePlaylistFlag(value: unknown): boolean {
  return value === true;
}

function runYtDlp(args: string[]): Promise<{ code: number; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(YT_DLP_BIN, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let output = "";

    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, output });
    });
  });
}

export async function GET() {
  const dataDir = resolveDataDir();
  const paths = getDataPaths(dataDir);
  await ensureDataStorage(paths);
  const records = await readHistory(paths);

  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    url?: string;
    mode?: unknown;
    includePlaylist?: unknown;
  };

  if (!body.url) {
    return NextResponse.json({ error: "A URL is required." }, { status: 400 });
  }

  let validatedUrl: string;
  try {
    validatedUrl = validateVideoUrl(body.url);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid URL." },
      { status: 400 },
    );
  }

  const mode = parseMode(body.mode);
  const includePlaylist = parsePlaylistFlag(body.includePlaylist);

  const dataDir = resolveDataDir();
  const paths = getDataPaths(dataDir);
  await ensureDataStorage(paths);

  const args = buildYtDlpArgs(
    {
      url: validatedUrl,
      mode,
      includePlaylist,
    },
    paths,
  );

  const startedAt = new Date().toISOString();
  const runId = crypto.randomUUID();

  let record: DownloadRecord;

  try {
    const { code, output } = await runYtDlp(args);
    const files = parseDownloadedFiles(output, paths.downloadsDir);

    record = {
      id: runId,
      createdAt: startedAt,
      url: validatedUrl,
      mode,
      includePlaylist,
      status: code === 0 ? "completed" : "failed",
      files,
      logTail: output.slice(-6000),
    };

    await appendHistory(paths, record);

    if (code !== 0) {
      return NextResponse.json(
        { error: "yt-dlp failed. Check logs in history.", record },
        { status: 500 },
      );
    }

    return NextResponse.json({ record });
  } catch (error) {
    record = {
      id: runId,
      createdAt: startedAt,
      url: validatedUrl,
      mode,
      includePlaylist,
      status: "failed",
      files: [],
      logTail: error instanceof Error ? error.message : "Unknown error",
    };

    await appendHistory(paths, record);

    return NextResponse.json(
      {
        error:
          "Failed to start yt-dlp. Ensure yt-dlp is installed in the runtime container.",
        record,
      },
      { status: 500 },
    );
  }
}
