import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  getStorageUsage,
  deleteRecord,
  appendHistory,
  readHistory,
  ensureDataStorage,
  type DownloadRecord,
} from "../lib/archive-store";
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

describe("deleteRecord", () => {
  const testRoot = path.join(process.cwd(), "test-data-delete");
  const downloadsDir = path.join(testRoot, "downloads");

  const mockPaths: DataPaths = {
    root: testRoot,
    downloadsDir: downloadsDir,
    archiveFile: path.join(testRoot, "archive.txt"),
    historyFile: path.join(testRoot, "history.json"),
  };

  beforeEach(async () => {
    await fs.mkdir(testRoot, { recursive: true });
    await ensureDataStorage(mockPaths);
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  it("should delete record and files", async () => {
    const record: DownloadRecord = {
      id: "test-id",
      createdAt: new Date().toISOString(),
      url: "http://example.com",
      mode: "video",
      includePlaylist: false,
      status: "completed",
      files: ["video.mp4"],
      logTail: "",
    };

    // Create file
    await fs.writeFile(path.join(downloadsDir, "video.mp4"), "data", "utf8");

    // Add to history
    await appendHistory(mockPaths, record);

    // Verify it's there
    let history = await readHistory(mockPaths);
    expect(history).toHaveLength(1);

    // Delete
    await deleteRecord(mockPaths, "test-id");

    // Check history
    history = await readHistory(mockPaths);
    expect(history).toHaveLength(0);

    // Check file
    const fileExists = await fs
      .access(path.join(downloadsDir, "video.mp4"))
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(false);
  });
});
