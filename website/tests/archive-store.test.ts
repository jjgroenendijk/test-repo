import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { getStorageUsage, deleteRecord, appendHistory, readHistory, DownloadRecord } from "../lib/archive-store";
import { DataPaths } from "../lib/ytdlp";

const testRoot = path.join(process.cwd(), "test-data-storage");
const downloadsDir = path.join(testRoot, "downloads");

const mockPaths: DataPaths = {
  root: testRoot,
  downloadsDir: downloadsDir,
  archiveFile: path.join(testRoot, "archive.txt"),
  historyFile: path.join(testRoot, "history.json"),
};

describe("getStorageUsage", () => {
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
  beforeEach(async () => {
    await fs.mkdir(downloadsDir, { recursive: true });
    // Initialize history file
    await fs.writeFile(mockPaths.historyFile, "[]\n", "utf8");
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  it("should return false if record does not exist", async () => {
    const result = await deleteRecord(mockPaths, "non-existent-id");
    expect(result).toBe(false);
  });

  it("should delete record and associated files", async () => {
    const file1 = "video.mp4";
    const file2 = "sub/video.mp4"; // nested

    // Create files
    await fs.writeFile(path.join(downloadsDir, file1), "content");
    await fs.mkdir(path.join(downloadsDir, "sub"), { recursive: true });
    await fs.writeFile(path.join(downloadsDir, file2), "content");

    const record: DownloadRecord = {
      id: "test-id",
      createdAt: new Date().toISOString(),
      url: "http://example.com",
      mode: "video",
      includePlaylist: false,
      status: "completed",
      files: [file1, file2],
      logTail: "",
    };

    await appendHistory(mockPaths, record);

    const result = await deleteRecord(mockPaths, "test-id");
    expect(result).toBe(true);

    // Check history
    const history = await readHistory(mockPaths);
    expect(history).toHaveLength(0);

    // Check files
    await expect(fs.access(path.join(downloadsDir, file1))).rejects.toThrow();
    await expect(fs.access(path.join(downloadsDir, file2))).rejects.toThrow();
  });

  it("should ignore missing files and still delete record", async () => {
    const file1 = "missing.mp4";

    const record: DownloadRecord = {
      id: "test-id-2",
      createdAt: new Date().toISOString(),
      url: "http://example.com",
      mode: "video",
      includePlaylist: false,
      status: "completed",
      files: [file1],
      logTail: "",
    };

    await appendHistory(mockPaths, record);

    const result = await deleteRecord(mockPaths, "test-id-2");
    expect(result).toBe(true);

    const history = await readHistory(mockPaths);
    expect(history).toHaveLength(0);
  });

  it("should not delete files outside of downloads directory (traversal attack)", async () => {
    const outsideFile = "../secret.txt";
    const absoluteOutsideFile = path.resolve(downloadsDir, outsideFile);

    // Create a file outside downloadsDir (in testRoot)
    await fs.writeFile(absoluteOutsideFile, "secret", "utf8");

    const record: DownloadRecord = {
      id: "malicious-id",
      createdAt: new Date().toISOString(),
      url: "http://example.com",
      mode: "video",
      includePlaylist: false,
      status: "completed",
      files: [outsideFile],
      logTail: "",
    };

    await appendHistory(mockPaths, record);

    const result = await deleteRecord(mockPaths, "malicious-id");
    expect(result).toBe(true); // Record should still be deleted

    // File should still exist
    await expect(fs.access(absoluteOutsideFile)).resolves.toBeUndefined();
  });
});
