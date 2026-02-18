import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  getStorageUsage,
  deleteRecord,
  appendHistory,
  readHistory,
  DownloadRecord
} from "../lib/archive-store";
import { DataPaths } from "../lib/ytdlp";

const testRoot = path.join(process.cwd(), "test-data-storage");
const downloadsDir = path.join(testRoot, "downloads");

const mockPaths: DataPaths = {
  root: testRoot,
  downloadsDir: downloadsDir,
  archiveFile: path.join(testRoot, "archive.txt"),
  historyFile: path.join(testRoot, "history.json"),
};

describe("Archive Store Tests", () => {
  beforeEach(async () => {
    await fs.mkdir(downloadsDir, { recursive: true });
    // Initialize empty history
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

  describe("deleteRecord", () => {
    it("should delete a record and its files", async () => {
      // Create a dummy file
      const fileName = "video.mp4";
      const filePath = path.join(downloadsDir, fileName);
      await fs.writeFile(filePath, "dummy content");

      const record: DownloadRecord = {
        id: "rec1",
        createdAt: new Date().toISOString(),
        url: "http://example.com",
        mode: "video",
        includePlaylist: false,
        status: "completed",
        files: [fileName],
        logTail: "log",
      };

      await appendHistory(mockPaths, record);

      // Verify file exists
      await expect(fs.access(filePath)).resolves.toBeUndefined();

      // Delete record
      const result = await deleteRecord(mockPaths, "rec1");
      expect(result).toBe(true);

      // Verify record is gone from history
      const history = await readHistory(mockPaths);
      expect(history).toHaveLength(0);

      // Verify file is gone
      await expect(fs.access(filePath)).rejects.toThrow();
    });

    it("should return false if record does not exist", async () => {
      const result = await deleteRecord(mockPaths, "non-existent");
      expect(result).toBe(false);
    });

    it("should delete record even if file is missing", async () => {
      const record: DownloadRecord = {
        id: "rec2",
        createdAt: new Date().toISOString(),
        url: "http://example.com",
        mode: "video",
        includePlaylist: false,
        status: "completed",
        files: ["missing.mp4"],
        logTail: "log",
      };

      await appendHistory(mockPaths, record);

      const result = await deleteRecord(mockPaths, "rec2");
      expect(result).toBe(true);

      const history = await readHistory(mockPaths);
      expect(history).toHaveLength(0);
    });

    it("should prevent directory traversal deletion", async () => {
      // Create a file outside downloads dir
      const outsideFile = path.join(testRoot, "outside.txt");
      await fs.writeFile(outsideFile, "secret");

      const record: DownloadRecord = {
        id: "rec3",
        createdAt: new Date().toISOString(),
        url: "http://example.com",
        mode: "video",
        includePlaylist: false,
        status: "completed",
        files: ["../outside.txt"], // Malicious path
        logTail: "log",
      };

      await appendHistory(mockPaths, record);

      const result = await deleteRecord(mockPaths, "rec3");
      expect(result).toBe(true);

      // Record should be deleted
      const history = await readHistory(mockPaths);
      expect(history).toHaveLength(0);

      // File outside should STILL exist
      await expect(fs.access(outsideFile)).resolves.toBeUndefined();
    });
  });
});
