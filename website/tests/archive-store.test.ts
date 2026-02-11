import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { getStorageUsage } from "../lib/archive-store";
import { DataPaths } from "../lib/ytdlp";

describe("getStorageUsage", () => {
  const testRoot = path.join(process.cwd(), "test-data-storage");
  const downloadsDir = path.join(testRoot, "downloads");

  const mockPaths: DataPaths = {
    root: testRoot,
    downloadsDir: downloadsDir,
    archiveFile: path.join(testRoot, "archive.txt"),
    historyFile: path.join(testRoot, "history.json"),
  };

  beforeEach(async () => {
    await fs.mkdir(downloadsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  it("should return 0 for empty directory", async () => {
    const size = await getStorageUsage(mockPaths);
    expect(size).toBe(0);
  });

  it("should return correct size for single file", async () => {
    const filePath = path.join(downloadsDir, "test.txt");
    await fs.writeFile(filePath, "hello", "utf8"); // 5 bytes
    const size = await getStorageUsage(mockPaths);
    expect(size).toBe(5);
  });

  it("should return correct size for nested files", async () => {
    const subDir = path.join(downloadsDir, "sub");
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(downloadsDir, "a.txt"), "A", "utf8"); // 1 byte
    await fs.writeFile(path.join(subDir, "b.txt"), "BB", "utf8"); // 2 bytes

    const size = await getStorageUsage(mockPaths);
    expect(size).toBe(3);
  });
});
