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

export async function getStorageUsage(dir: string): Promise<number> {
  let totalSize = 0;

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        totalSize += await getStorageUsage(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch {
    return 0;
  }

  return totalSize;
}
