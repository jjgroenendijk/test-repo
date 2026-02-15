import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { getStorageUsage, deleteRecord, appendHistory, DownloadRecord } from "../lib/archive-store";
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

  it("should delete record and associated files", async () => {
    const file1 = "video.mp4";
    const file2 = "thumb.jpg";
    await fs.writeFile(path.join(downloadsDir, file1), "video data");
    await fs.writeFile(path.join(downloadsDir, file2), "thumb data");

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

    // Verify files are gone
    await expect(fs.access(path.join(downloadsDir, file1))).rejects.toThrow();
    await expect(fs.access(path.join(downloadsDir, file2))).rejects.toThrow();

    // Verify history is updated
    const historyContent = await fs.readFile(mockPaths.historyFile, "utf8");
    const history = JSON.parse(historyContent);
    expect(history).toHaveLength(0);
  });

  it("should return false if record not found", async () => {
    const result = await deleteRecord(mockPaths, "non-existent-id");
    expect(result).toBe(false);
  });

  it("should delete record even if files are missing", async () => {
     const record: DownloadRecord = {
      id: "test-id-missing-files",
      createdAt: new Date().toISOString(),
      url: "http://example.com",
      mode: "video",
      includePlaylist: false,
      status: "completed",
      files: ["missing.mp4"],
      logTail: "",
    };

    await appendHistory(mockPaths, record);

    const result = await deleteRecord(mockPaths, "test-id-missing-files");
    expect(result).toBe(true);

    const historyContent = await fs.readFile(mockPaths.historyFile, "utf8");
    const history = JSON.parse(historyContent);
    expect(history).toHaveLength(0);
  });

  it("should not delete files outside of downloads directory", async () => {
      const outsideFile = path.join(testRoot, "outside.txt");
      await fs.writeFile(outsideFile, "secret");

      const record: DownloadRecord = {
      id: "malicious-id",
      createdAt: new Date().toISOString(),
      url: "http://example.com",
      mode: "video",
      includePlaylist: false,
      status: "completed",
      files: ["../outside.txt"],
      logTail: "",
    };

    await appendHistory(mockPaths, record);

    const result = await deleteRecord(mockPaths, "malicious-id");
    expect(result).toBe(true); // Record deleted

    // File should still exist
    await expect(fs.access(outsideFile)).resolves.toBeUndefined();
  });
});
