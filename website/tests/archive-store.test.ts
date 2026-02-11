import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { getStorageUsage } from "../lib/archive-store";
import { type DataPaths } from "../lib/ytdlp";

vi.mock("node:fs/promises");

describe("getStorageUsage", () => {
  const mockPaths: DataPaths = {
    root: "/data",
    downloadsDir: "/data/downloads",
    archiveFile: "/data/download-archive.txt",
    historyFile: "/data/history.json",
  };

  it("should calculate total size of files in directory", async () => {
    // Mock fs.readdir to return some files
    vi.mocked(fs.readdir).mockImplementation(async (dirPath, options) => {
      if (dirPath === "/data/downloads") {
        return [
          { name: "file1.mp4", isDirectory: () => false },
          { name: "file2.mp3", isDirectory: () => false },
        ] as any;
      }
      return [] as any;
    });

    // Mock fs.stat to return sizes
    vi.mocked(fs.stat).mockImplementation(async (filePath) => {
        // Normalize path for cross-platform test consistency if needed,
        // but exact match is fine here for mock
        if (filePath.endsWith("file1.mp4")) {
            return { size: 1024 } as any;
        }
        if (filePath.endsWith("file2.mp3")) {
            return { size: 2048 } as any;
        }
        return { size: 0 } as any;
    });

    // Mock ensureDataStorage to do nothing
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const size = await getStorageUsage(mockPaths);
    expect(size).toBe(1024 + 2048);
  });

    it("should handle nested directories recursively", async () => {
    // Mock fs.readdir to return nested structure
    vi.mocked(fs.readdir).mockImplementation(async (dirPath, options) => {
      // Basic check if it's the downloads dir
      if (typeof dirPath === 'string' && dirPath.endsWith("/downloads")) {
        return [
          { name: "folder1", isDirectory: () => true },
          { name: "file1.txt", isDirectory: () => false },
        ] as any;
      }
      if (typeof dirPath === 'string' && dirPath.endsWith("folder1")) {
           return [
          { name: "file2.txt", isDirectory: () => false },
        ] as any;
      }
      return [] as any;
    });

    // Mock fs.stat to return sizes
    vi.mocked(fs.stat).mockImplementation(async (filePath) => {
        if (typeof filePath === 'string' && filePath.endsWith("file1.txt")) {
            return { size: 100 } as any;
        }
        if (typeof filePath === 'string' && filePath.endsWith("file2.txt")) {
            return { size: 200 } as any;
        }
        return { size: 0 } as any;
    });

    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const size = await getStorageUsage(mockPaths);
    expect(size).toBe(100 + 200);
  });

  it("should return 0 if directory is empty", async () => {
     vi.mocked(fs.readdir).mockImplementation(async (dirPath, options) => {
      return [] as any;
    });

    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.access).mockResolvedValue(undefined);

    const size = await getStorageUsage(mockPaths);
    expect(size).toBe(0);
  });
});
