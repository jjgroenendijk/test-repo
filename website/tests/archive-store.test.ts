import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { getStorageUsage } from '../lib/archive-store';

describe('getStorageUsage', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-store-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('returns 0 for an empty directory', async () => {
    const usage = await getStorageUsage(tempDir);
    expect(usage).toBe(0);
  });

  it('calculates size of files in a directory', async () => {
    const file1 = path.join(tempDir, 'file1.txt');
    await fs.writeFile(file1, 'hello', 'utf8'); // 5 bytes
    const usage = await getStorageUsage(tempDir);
    expect(usage).toBe(5);
  });

  it('calculates size of files in nested directories', async () => {
    const subDir = path.join(tempDir, 'subdir');
    await fs.mkdir(subDir);
    const file1 = path.join(tempDir, 'file1.txt');
    const file2 = path.join(subDir, 'file2.txt');

    await fs.writeFile(file1, 'hello', 'utf8'); // 5 bytes
    await fs.writeFile(file2, 'world', 'utf8'); // 5 bytes

    const usage = await getStorageUsage(tempDir);
    expect(usage).toBe(10);
  });

  it('returns 0 if directory does not exist', async () => {
    const nonExistent = path.join(tempDir, 'non-existent');
    const usage = await getStorageUsage(nonExistent);
    expect(usage).toBe(0);
  });
});
