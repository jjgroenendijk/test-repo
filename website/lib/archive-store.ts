import fs from "node:fs/promises";
import path from "node:path";

import { type DataPaths } from "./ytdlp";

export interface DownloadRecord {
  id: string;
  createdAt: string;
  url: string;
  mode: "video" | "audio";
  includePlaylist: boolean;
  status: "completed" | "failed";
  files: string[];
  logTail: string;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDataStorage(paths: DataPaths): Promise<void> {
  await fs.mkdir(paths.root, { recursive: true });
  await fs.mkdir(paths.downloadsDir, { recursive: true });

  if (!(await fileExists(paths.archiveFile))) {
    await fs.writeFile(paths.archiveFile, "", "utf8");
  }

  if (!(await fileExists(paths.historyFile))) {
    await fs.writeFile(paths.historyFile, "[]\n", "utf8");
  }
}

export async function readHistory(paths: DataPaths): Promise<DownloadRecord[]> {
  await ensureDataStorage(paths);
  const raw = await fs.readFile(paths.historyFile, "utf8");

  try {
    const parsed = JSON.parse(raw) as DownloadRecord[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function clearHistory(paths: DataPaths): Promise<void> {
  await ensureDataStorage(paths);
  await fs.writeFile(paths.historyFile, "[]\n", "utf8");
}

export async function appendHistory(
  paths: DataPaths,
  record: DownloadRecord,
): Promise<void> {
  const history = await readHistory(paths);
  history.unshift(record);

  const limited = history.slice(0, 200);
  await fs.writeFile(paths.historyFile, `${JSON.stringify(limited, null, 2)}\n`, "utf8");
}

async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  let entries;

  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return 0;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    try {
      if (entry.isDirectory()) {
        totalSize += await calculateDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    } catch {
      continue;
    }
  }

  return totalSize;
}

export async function getStorageUsage(paths: DataPaths): Promise<number> {
  await ensureDataStorage(paths);
  return calculateDirectorySize(paths.downloadsDir);
}

function isPathSafe(base: string, target: string): boolean {
  const relative = path.relative(base, target);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function deleteRecord(
  paths: DataPaths,
  id: string,
): Promise<boolean> {
  const history = await readHistory(paths);
  const recordIndex = history.findIndex((r) => r.id === id);

  if (recordIndex === -1) {
    return false;
  }

  const record = history[recordIndex];

  // Delete files
  for (const file of record.files) {
    const fullPath = path.resolve(paths.downloadsDir, file);
    if (isPathSafe(paths.downloadsDir, fullPath)) {
      try {
        await fs.unlink(fullPath);
      } catch {
        // Ignore errors if file doesn't exist or permissions issue
      }
    }
  }

  // Remove from history
  history.splice(recordIndex, 1);
  await fs.writeFile(
    paths.historyFile,
    `${JSON.stringify(history, null, 2)}\n`,
    "utf8",
  );

  return true;
}
