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
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;

    // Mock localStorage and matchMedia
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    global.window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

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

    const badge = document.querySelector('.url-type-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('track');

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

  it("sorts jobs by newest first", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;

    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
    };
    global.window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
    }));

    const root = document.getElementById("root");

    // Mock fetch jobs returning two jobs out of order
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: "older-job",
            url: "https://open.spotify.com/track/old",
            status: "Completed",
            created_at: "2023-01-01T00:00:00Z",
            files: 1
          },
          {
            id: "newer-job",
            url: "https://open.spotify.com/track/new",
            status: "Queued",
            created_at: "2024-01-01T00:00:00Z",
            files: 0
          }
        ])
      })
    );

    const cleanup = renderApp(root);

    await new Promise(resolve => setTimeout(resolve, 0));

    const jobCards = document.querySelectorAll(".job-card");
    expect(jobCards.length).toBe(2);
    // The newer job should be rendered first
    expect(jobCards[0].getAttribute("data-job-id")).toBe("newer-job");
    expect(jobCards[1].getAttribute("data-job-id")).toBe("older-job");

    cleanup();
  });

  it("toggles dark mode and updates localStorage", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const root = document.getElementById("root");
    renderApp(root);
    const themeToggleBtn = document.getElementById("theme-toggle");
    themeToggleBtn.click();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(global.localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("calls the clear-failed endpoint and refreshes when Clear failed is clicked", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    // Mock confirm to simulate user clicking "OK"
    global.window.confirm = vi.fn(() => true);

    const root = document.getElementById("root");

    // Setup fetch mock to track calls
    const fetchMock = vi.fn();
    fetchMock.mockImplementation((url, options) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    global.fetch = fetchMock;

    renderApp(root);

    // The initial fetchJobs triggers fetch('/api/jobs') and updateStorageUsage triggers fetch('/api/system/storage')
    // We want to verify the specific DELETE call when the button is clicked.

    const clearFailedBtn = document.getElementById("clear-failed-btn");
    expect(clearFailedBtn).not.toBeNull();

    clearFailedBtn.click();

    // Allow async handlers to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(global.window.confirm).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/history/clear-failed", { method: "DELETE" });
  });
});
