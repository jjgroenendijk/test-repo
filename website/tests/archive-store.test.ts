import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getStorageUsage } from "../lib/archive-store";

const TEST_DIR = path.join(__dirname, "test-storage");

describe("getStorageUsage", () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it("should return 0 for empty directory", async () => {
    const size = await getStorageUsage(TEST_DIR);
    expect(size).toBe(0);
  });

  it("should calculate size of files in directory", async () => {
    await fs.writeFile(path.join(TEST_DIR, "file1.txt"), "hello"); // 5 bytes
    await fs.writeFile(path.join(TEST_DIR, "file2.txt"), "world"); // 5 bytes
    const size = await getStorageUsage(TEST_DIR);
    expect(size).toBe(10);
  });

  it("should calculate size recursively", async () => {
    const subDir = path.join(TEST_DIR, "sub");
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(subDir, "file3.txt"), "test"); // 4 bytes
    const size = await getStorageUsage(TEST_DIR);
    expect(size).toBe(4);
  });
});
