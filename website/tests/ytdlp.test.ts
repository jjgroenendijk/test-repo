import { describe, expect, it } from "vitest";

import {
  buildYtDlpArgs,
  getDataPaths,
  normalizeDownloadedPath,
  parseDownloadedFiles,
  validateVideoUrl,
} from "../lib/ytdlp";

describe("validateVideoUrl", () => {
  it("accepts https URLs", () => {
    expect(validateVideoUrl("https://example.com/watch?v=abc")).toBe(
      "https://example.com/watch?v=abc",
    );
  });

  it("rejects non-http protocols", () => {
    expect(() => validateVideoUrl("ftp://example.com/video")).toThrow(
      "Only http/https URLs are supported.",
    );
  });
});

describe("buildYtDlpArgs", () => {
  it("builds audio extraction flags", () => {
    const paths = getDataPaths("/tmp/archive");
    const args = buildYtDlpArgs(
      {
        url: "https://example.com/watch?v=audio",
        mode: "audio",
        includePlaylist: true,
      },
      paths,
    );

    expect(args).toContain("--extract-audio");
    expect(args).toContain("--yes-playlist");
    expect(args).toContain(paths.archiveFile);
    expect(args.at(-1)).toBe("https://example.com/watch?v=audio");
  });

  it("builds video flags", () => {
    const paths = getDataPaths("/tmp/archive");
    const args = buildYtDlpArgs(
      {
        url: "https://example.com/watch?v=video",
        mode: "video",
        includePlaylist: false,
      },
      paths,
    );

    expect(args).toContain("--format");
    expect(args).toContain("--no-playlist");
  });

  it("builds video flags with resolution limit", () => {
    const paths = getDataPaths("/tmp/archive");
    const args = buildYtDlpArgs(
      {
        url: "https://example.com/watch?v=video",
        mode: "video",
        resolution: "720p",
        includePlaylist: false,
      },
      paths,
    );

    const formatIndex = args.indexOf("--format");
    expect(formatIndex).toBeGreaterThan(-1);
    expect(args[formatIndex + 1]).toBe(
      "bestvideo[height<=720]+bestaudio/best[height<=720]",
    );
  });

  it("builds video flags with default resolution (best)", () => {
    const paths = getDataPaths("/tmp/archive");
    const args = buildYtDlpArgs(
      {
        url: "https://example.com/watch?v=video",
        mode: "video",
        resolution: "best",
        includePlaylist: false,
      },
      paths,
    );

    const formatIndex = args.indexOf("--format");
    expect(formatIndex).toBeGreaterThan(-1);
    expect(args[formatIndex + 1]).toBe("bv*+ba/b");
  });

  it("builds video flags with 4K resolution (2160p)", () => {
    const paths = getDataPaths("/tmp/archive");
    const args = buildYtDlpArgs(
      {
        url: "https://example.com/watch?v=video",
        mode: "video",
        resolution: "2160p",
        includePlaylist: false,
      },
      paths,
    );

    const formatIndex = args.indexOf("--format");
    expect(formatIndex).toBeGreaterThan(-1);
    expect(args[formatIndex + 1]).toBe(
      "bestvideo[height<=2160]+bestaudio/best[height<=2160]",
    );
  });

  it("ignores resolution in audio mode", () => {
    const paths = getDataPaths("/tmp/archive");
    const args = buildYtDlpArgs(
      {
        url: "https://example.com/watch?v=audio",
        mode: "audio",
        resolution: "1080p",
        includePlaylist: false,
      },
      paths,
    );

    expect(args).toContain("--extract-audio");
    expect(args).not.toContain("--format");
  });
});

describe("downloaded file parsing", () => {
  it("normalizes printable file paths to relative archive paths", () => {
    const downloadsDir = "/var/data/downloads";
    const sample = "/var/data/downloads/channel/2026-01-01/video.mp4";

    expect(normalizeDownloadedPath(sample, downloadsDir)).toBe(
      "channel/2026-01-01/video.mp4",
    );
  });

  it("filters invalid output lines", () => {
    const downloadsDir = "/var/data/downloads";
    const output = [
      "[download] 100%",
      "channel/2026-01-01/audio.mp3",
      "WARNING: this is not a file path",
      "../outside/sneaky.mp4",
      "channel/2026-01-01/audio.mp3",
    ].join("\n");

    expect(parseDownloadedFiles(output, downloadsDir)).toEqual([
      "channel/2026-01-01/audio.mp3",
    ]);
  });
});
