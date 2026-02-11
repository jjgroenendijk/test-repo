import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { getStorageUsage } from "../lib/archive-store";

const TEST_DIR = path.join(__dirname, "temp-test-storage");

describe("getStorageUsage", () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it("calculates size of empty directory", async () => {
    const size = await getStorageUsage(TEST_DIR);
    expect(size).toBe(0);
  });

  it("calculates size of directory with files", async () => {
    await fs.writeFile(path.join(TEST_DIR, "file1.txt"), "hello"); // 5 bytes
    await fs.writeFile(path.join(TEST_DIR, "file2.txt"), "world"); // 5 bytes
    const size = await getStorageUsage(TEST_DIR);
    expect(size).toBe(10);
  });

  it("calculates size of nested directories", async () => {
    const subDir = path.join(TEST_DIR, "sub");
    await fs.mkdir(subDir);
    await fs.writeFile(path.join(subDir, "file.txt"), "nested"); // 6 bytes
    await fs.writeFile(path.join(TEST_DIR, "root.txt"), "root"); // 4 bytes
    const size = await getStorageUsage(TEST_DIR);
    expect(size).toBe(10);
  });
});
