import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  getStorageUsage,
  deleteHistoryItem,
  appendHistory,
  readHistory,
  DownloadRecord,
} from "../lib/archive-store";
import { DataPaths } from "../lib/ytdlp";

describe("Archive Store Tests", () => {
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
    // Initialize history file
    await fs.writeFile(mockPaths.historyFile, "[]\n", "utf8");
  });

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true });
  });

  describe("getStorageUsage", () => {
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

  describe("deleteHistoryItem", () => {
    it("should delete an existing record and its files", async () => {
      const record: DownloadRecord = {
        id: "123",
        createdAt: new Date().toISOString(),
        url: "http://example.com",
        mode: "video",
        includePlaylist: false,
        status: "completed",
        files: ["test.mp4"],
        logTail: "",
      };

      // Create file
      const filePath = path.join(downloadsDir, "test.mp4");
      await fs.writeFile(filePath, "content");

      await appendHistory(mockPaths, record);

      const result = await deleteHistoryItem(mockPaths, "123");
      expect(result).toBe(true);

      const history = await readHistory(mockPaths);
      expect(history).toHaveLength(0);

      try {
        await fs.access(filePath);
        expect.fail("File should have been deleted");
      } catch (e) {
        expect((e as { code: string }).code).toBe("ENOENT");
      }
    });

    it("should return false if record not found", async () => {
      const result = await deleteHistoryItem(mockPaths, "non-existent");
      expect(result).toBe(false);
    });

    it("should not delete files outside of downloads directory", async () => {
      const record: DownloadRecord = {
        id: "bad-path",
        createdAt: new Date().toISOString(),
        url: "http://example.com",
        mode: "video",
        includePlaylist: false,
        status: "completed",
        files: ["../outside.txt"],
        logTail: "",
      };

      const outsideFile = path.join(testRoot, "outside.txt");
      await fs.writeFile(outsideFile, "secret");

      await appendHistory(mockPaths, record);

      await deleteHistoryItem(mockPaths, "bad-path");

      // Check if file still exists
      await fs.access(outsideFile);
    });
  });
});
