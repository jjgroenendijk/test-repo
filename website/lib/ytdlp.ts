import path from "node:path";

export type DownloadMode = "video" | "audio";

export interface DownloadRequest {
  url: string;
  mode: DownloadMode;
  includePlaylist: boolean;
  resolution?: string;
}

export interface DataPaths {
  root: string;
  downloadsDir: string;
  archiveFile: string;
  historyFile: string;
}

const SAFE_PATH_PREFIX = "downloads";

export function validateVideoUrl(rawUrl: string): string {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Enter a valid URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https URLs are supported.");
  }

  return parsed.toString();
}

export function resolveDataDir(): string {
  if (process.env.DATA_DIR && process.env.DATA_DIR.trim() !== "") {
    return process.env.DATA_DIR;
  }

  if (process.env.NODE_ENV === "production") {
    return "/data";
  }

  return path.join(process.cwd(), ".data");
}

export function getDataPaths(rootDir: string): DataPaths {
  return {
    root: rootDir,
    downloadsDir: path.join(rootDir, SAFE_PATH_PREFIX),
    archiveFile: path.join(rootDir, "download-archive.txt"),
    historyFile: path.join(rootDir, "history.json"),
  };
}

export function buildYtDlpArgs(
  request: DownloadRequest,
  paths: DataPaths,
): string[] {
  const args = [
    "--newline",
    "--no-warnings",
    "--download-archive",
    paths.archiveFile,
    "--paths",
    paths.downloadsDir,
    "--output",
    "%(uploader|unknown_uploader)s/%(upload_date>%Y-%m-%d,unknown_date)s/%(title).160B [%(id)s].%(ext)s",
    "--print",
    "after_move:filepath",
    "--write-info-json",
    "--write-description",
    "--write-thumbnail",
  ];

  if (request.includePlaylist) {
    args.push("--yes-playlist");
  } else {
    args.push("--no-playlist");
  }

  if (request.mode === "audio") {
    args.push("--extract-audio", "--audio-format", "mp3", "--audio-quality", "0");
  } else {
    const res = request.resolution;
    if (res && res !== "best") {
      // Map "1080p" -> 1080
      const height = res.replace("p", "");
      args.push("--format", `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`);
    } else {
      args.push("--format", "bv*+ba/b");
    }
  }

  args.push(request.url);
  return args;
}

function isPathInsideRoot(candidatePath: string, rootDir: string): boolean {
  const relative = path.relative(rootDir, candidatePath);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function normalizeDownloadedPath(
  rawPath: string,
  downloadsDir: string,
): string | null {
  const trimmed = rawPath.trim();
  if (trimmed === "" || trimmed.startsWith("[") || trimmed.startsWith("WARNING:")) {
    return null;
  }

  const absoluteCandidate = path.isAbsolute(trimmed)
    ? path.normalize(trimmed)
    : path.resolve(downloadsDir, trimmed);

  if (!isPathInsideRoot(absoluteCandidate, downloadsDir)) {
    return null;
  }

  return path.relative(downloadsDir, absoluteCandidate).split(path.sep).join("/");
}

export function parseDownloadedFiles(output: string, downloadsDir: string): string[] {
  const files = new Set<string>();

  for (const line of output.split("\n")) {
    const normalized = normalizeDownloadedPath(line, downloadsDir);
    if (normalized) {
      files.add(normalized);
    }
  }

  return Array.from(files).sort((a, b) => a.localeCompare(b));
}
