import { describe, it, expect, vi, beforeEach } from "vitest";
import { isSpotifyUrl, classifySpotifyUrl, renderApp } from "./app.js";
import { JSDOM } from "jsdom";

// Mock fetch globally for any component tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

describe("isSpotifyUrl", () => {
  it("accepts valid track URLs", () => {
    expect(isSpotifyUrl("https://open.spotify.com/track/1ATL5GLyefJaxhQzSPVrLX")).toBe(true);
  });

  it("rejects invalid hosts", () => {
    expect(isSpotifyUrl("https://soundcloud.com/track/123")).toBe(false);
  });
});

describe("classifySpotifyUrl", () => {
  it("classifies tracks", () => {
    expect(classifySpotifyUrl("https://open.spotify.com/track/123")).toBe("track");
  });
});

describe("renderApp", () => {
  it("renders a job with file links properly formatted", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>');
    global.document = dom.window.document;
    global.window = dom.window;

    const root = document.getElementById("root");

    // Mock fetch jobs returning one job that has completed
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{
          id: "test-job-123",
          url: "https://open.spotify.com/track/123",
          status: "Completed",
          created_at: "2023-01-01T00:00:00Z",
          files: 1
        }])
      })
    );

    const cleanup = renderApp(root);

    // Wait a tick for fetchJobs to complete and render the DOM
    await new Promise(resolve => setTimeout(resolve, 0));

    const viewFilesBtn = document.querySelector('.view-files-btn');
    expect(viewFilesBtn).not.toBeNull();

    // Mock fetch for the specific job files
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ files: ["album/track1.flac"] })
      })
    );

    // Simulate clicking "View Files"
    viewFilesBtn.click();

    // Wait a tick for files to load
    await new Promise(resolve => setTimeout(resolve, 0));

    const filesList = document.querySelector('#files-list-test-job-123');
    expect(filesList).not.toBeNull();

    const link = filesList.querySelector('a.file-download-link');
    expect(link).not.toBeNull();
    expect(link.getAttribute('download')).toBe('track1.flac');
    expect(link.getAttribute('href')).toBe('/api/jobs/test-job-123/files/album/track1.flac');
    expect(link.textContent).toBe('album/track1.flac');

    cleanup();
  });
});
