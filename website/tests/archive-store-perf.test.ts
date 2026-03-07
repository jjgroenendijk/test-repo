import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  getStorageUsage
} from "../lib/archive-store";
import { DataPaths } from "../lib/ytdlp";

const testRoot = path.join(process.cwd(), "test-data-storage-perf");
const downloadsDir = path.join(testRoot, "downloads");

const mockPaths: DataPaths = {
  root: testRoot,
  downloadsDir: downloadsDir,
  archiveFile: path.join(testRoot, "archive.txt"),
  historyFile: path.join(testRoot, "history.json"),
};

describe("Archive Store Performance", () => {
  beforeEach(async () => {
    await fs.mkdir(downloadsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  it("should calculate size of many files efficiently", async () => {
    const numDirs = 20;
    const numFilesPerDir = 1000;

    // Create deeply nested structure and many files
    for (let i = 0; i < numDirs; i++) {
        const dirPath = path.join(downloadsDir, `dir_${i}`);
        await fs.mkdir(dirPath, { recursive: true });

        const filePromises = [];
        for (let j = 0; j < numFilesPerDir; j++) {
            filePromises.push(fs.writeFile(path.join(dirPath, `file_${j}.txt`), "dummy content", "utf8"));
        }
        await Promise.all(filePromises);
    }

    const start = performance.now();
    const size = await getStorageUsage(mockPaths);
    const end = performance.now();

    const duration = end - start;
    console.log(`Calculating size of ${numDirs * numFilesPerDir} files across ${numDirs} directories took ${duration.toFixed(2)}ms`);

    expect(size).toBe(numDirs * numFilesPerDir * 13); // "dummy content" is 13 bytes
  }, 30000); // Increased timeout
});
