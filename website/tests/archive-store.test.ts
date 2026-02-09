import { describe, expect, it, afterEach, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { getStorageUsage } from "../lib/archive-store";
import { type DataPaths } from "../lib/ytdlp";

describe("getStorageUsage", () => {
  let tmpDir: string;
  let paths: DataPaths;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "archive-store-test-"));
    paths = {
      root: tmpDir,
      downloadsDir: path.join(tmpDir, "downloads"),
      archiveFile: path.join(tmpDir, "archive.txt"),
      historyFile: path.join(tmpDir, "history.json"),
    };
    await fs.mkdir(paths.downloadsDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns 0 for empty directory", async () => {
    const size = await getStorageUsage(paths.downloadsDir);
    expect(size).toBe(0);
  });

  it("returns correct size for single file", async () => {
    const fileContent = "hello world"; // 11 bytes
    await fs.writeFile(path.join(paths.downloadsDir, "test.txt"), fileContent);
    const size = await getStorageUsage(paths.downloadsDir);
    expect(size).toBe(11);
  });

  it("returns correct size for nested files", async () => {
    const subDir = path.join(paths.downloadsDir, "sub");
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(subDir, "file1.txt"), "A"); // 1 byte
    await fs.writeFile(path.join(paths.downloadsDir, "file2.txt"), "B"); // 1 byte

    const size = await getStorageUsage(paths.downloadsDir);
    expect(size).toBe(2);
  });

  it("handles non-existent directory", async () => {
    const size = await getStorageUsage("/non/existent/path");
    expect(size).toBe(0);
  });
});
