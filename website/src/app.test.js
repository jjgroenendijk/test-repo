import { describe, it, expect, vi, beforeEach } from "vitest";
import { isSpotifyUrl, classifySpotifyUrl, formatFileSize, renderApp } from "./app.js";
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

describe("formatFileSize", () => {
  it("formats bytes correctly", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1048576)).toBe("1 MB");
    expect(formatFileSize(1073741824)).toBe("1 GB");
    expect(formatFileSize(1500)).toBe("1.46 KB");
  });
});

describe("renderApp", () => {
  it("renders the Export JSON button correctly", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const root = document.getElementById("root");

    const cleanup = renderApp(root);

    await new Promise(resolve => setTimeout(resolve, 0));

    const exportBtn = document.getElementById("export-history-btn");
    expect(exportBtn).not.toBeNull();
    expect(exportBtn.getAttribute("href")).toBe("/api/history/export");

    cleanup();
  });

  it("updates the storage progress bar correctly", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const root = document.getElementById("root");

    global.fetch.mockImplementation((url) => {
      if (url === "/api/system/storage") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ total: 1000, free: 100, used: 900 })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    const cleanup = renderApp(root);

    await new Promise(resolve => setTimeout(resolve, 0));

    const textElement = document.getElementById("storage-usage-text");
    expect(textElement).not.toBeNull();
    expect(textElement.textContent).toBe("100 B free of 1000 B");

    const fillElement = document.getElementById("storage-progress-fill");
    expect(fillElement).not.toBeNull();
    // 900 / 1000 = 90%
    expect(fillElement.style.width).toBe("90%");
    // Wait, 90% is not > 90, so it shouldn't have danger class
    expect(fillElement.classList.contains("danger")).toBe(false);

    cleanup();
  });

  it("adds danger class to storage progress bar when over 90%", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const root = document.getElementById("root");

    global.fetch.mockImplementation((url) => {
      if (url === "/api/system/storage") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ total: 1000, free: 50, used: 950 })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });

    const cleanup = renderApp(root);

    await new Promise(resolve => setTimeout(resolve, 0));

    const fillElement = document.getElementById("storage-progress-fill");
    expect(fillElement).not.toBeNull();
    expect(fillElement.style.width).toBe("95%");
    expect(fillElement.classList.contains("danger")).toBe(true);

    cleanup();
  });

  it("renders the queue status summary with correct counts", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const root = document.getElementById("root");

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { status: "Queued" },
          { status: "Running" },
          { status: "Running" },
          { status: "Completed" },
          { status: "Failed" },
          { status: "Failed" },
          { status: "Failed" }
        ])
      })
    );

    const cleanup = renderApp(root);

    await new Promise(resolve => setTimeout(resolve, 0));

    const summaryElement = document.getElementById("queue-status-summary");
    expect(summaryElement).not.toBeNull();
    expect(summaryElement.textContent).toBe("Queued: 1 | Running: 2 | Completed: 1 | Failed: 3");

    cleanup();
  });

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
        json: () => Promise.resolve({ files: [{ name: "album/track1.flac", size: 1048576 }] })
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

    // Check if file size is rendered
    expect(filesList.textContent).toContain('(1 MB)');

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

  it("calls the clear-completed endpoint and refreshes when Clear completed is clicked", async () => {
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

    const clearCompletedBtn = document.getElementById("clear-completed-btn");
    expect(clearCompletedBtn).not.toBeNull();

    clearCompletedBtn.click();

    // Allow async handlers to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(global.window.confirm).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/history/clear-completed", { method: "DELETE" });
  });

  it("calls the retry all cancelled jobs API when Retry cancelled is clicked", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const root = document.getElementById("root");

    const fetchMock = vi.fn();
    fetchMock.mockImplementation((url, options) => {
      if (url === "/api/jobs" && (!options || options.method === "GET")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: "1", url: "https://open.spotify.com/track/1", status: "Cancelled" },
            { id: "2", url: "https://open.spotify.com/track/2", status: "Completed" }
          ])
        });
      }
      if (url === "/api/jobs" && options && options.method === "POST") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    global.fetch = fetchMock;

    renderApp(root);

    // Initial fetch from renderApp
    await new Promise(resolve => setTimeout(resolve, 0));

    const retryCancelledBtn = document.getElementById("retry-cancelled-btn");
    expect(retryCancelledBtn).not.toBeNull();

    retryCancelledBtn.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledWith("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://open.spotify.com/track/1" })
    });

    // Should not retry the completed job
    const calls = fetchMock.mock.calls.filter(call => call[0] === "/api/jobs" && call[1] && call[1].method === "POST");
    expect(calls.length).toBe(1);
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

  it("renders the download all completed button with the correct href", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const root = document.getElementById("root");
    renderApp(root);

    const downloadAllBtn = document.getElementById("download-all-btn");
    expect(downloadAllBtn).not.toBeNull();
    expect(downloadAllBtn.getAttribute("href")).toBe("/api/history/download");
    expect(downloadAllBtn.hasAttribute("download")).toBe(true);
  });

  it("copies job URL to clipboard when copy button is clicked", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    // Mock clipboard API
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue()
      },
      writable: true
    });

    const root = document.getElementById("root");

    const fetchMock = vi.fn();
    fetchMock.mockImplementation((url, options) => {
      if (url === "/api/jobs" && (!options || options.method === "GET")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: "copy-job-1",
              url: "https://open.spotify.com/track/copy123",
              status: "Completed",
              created_at: "2023-01-01T00:00:00Z"
            }
          ])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    global.fetch = fetchMock;

    renderApp(root);

    // Allow async handlers to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    // Use fake timers to test setTimeout, after the async initialization
    vi.useFakeTimers();

    const copyBtn = document.querySelector(".copy-url-btn");
    expect(copyBtn).not.toBeNull();
    expect(copyBtn.getAttribute("data-job-url")).toBe("https://open.spotify.com/track/copy123");
    expect(copyBtn.textContent).toBe("Copy");
    expect(copyBtn.disabled).toBe(false);

    // Simulate click
    copyBtn.click();

    // Verify clipboard was called
    expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith("https://open.spotify.com/track/copy123");

    // Wait for the async click handler to finish the try block
    await Promise.resolve();

    // Verify button text changed
    expect(copyBtn.textContent).toBe("Copied!");
    expect(copyBtn.disabled).toBe(true);

    // Advance time by 2 seconds
    vi.advanceTimersByTime(2000);

    // Verify button reverted
    expect(copyBtn.textContent).toBe("Copy");
    expect(copyBtn.disabled).toBe(false);

    vi.useRealTimers();
  });

  it("calculates and renders the correct execution duration for a completed job", async () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="root"></div>', {
      url: "http://localhost",
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const root = document.getElementById("root");

    const fetchMock = vi.fn();
    fetchMock.mockImplementation((url, options) => {
      if (url === "/api/jobs" && (!options || options.method === "GET")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: "duration-job",
              url: "https://open.spotify.com/track/duration",
              status: "Completed",
              created_at: "2023-01-01T00:00:00.000Z",
              completed_at: "2023-01-01T00:01:23.000Z" // 1m 23s later
            }
          ])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      });
    });
    global.fetch = fetchMock;

    renderApp(root);

    // Allow async handlers to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    const durationText = document.body.textContent;
    expect(durationText).toContain("(Duration: 1m 23s)");
  });
});
