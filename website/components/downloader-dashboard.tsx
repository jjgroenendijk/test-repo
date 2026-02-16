"use client";

import { useEffect, useMemo, useState } from "react";

type DownloadMode = "video" | "audio";
type DownloadStatus = "completed" | "failed";

interface DownloadRecord {
  id: string;
  createdAt: string;
  url: string;
  mode: DownloadMode;
  includePlaylist: boolean;
  status: DownloadStatus;
  files: string[];
  logTail: string;
}

interface ApiResponse {
  record?: DownloadRecord;
  records?: DownloadRecord[];
  storageUsage?: number;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatTimestamp(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function DownloaderDashboard() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<DownloadMode>("video");
  const [includePlaylist, setIncludePlaylist] = useState(false);
  const [history, setHistory] = useState<DownloadRecord[]>([]);
  const [storageUsage, setStorageUsage] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<string>("Idle");

  function handleRetry(record: DownloadRecord) {
    setUrl(record.url);
    setMode(record.mode);
    setIncludePlaylist(record.includePlaylist);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadHistory() {
    const response = await fetch("/api/downloads", { method: "GET" });
    const payload = (await response.json()) as ApiResponse;
    setHistory(payload.records ?? []);
    setStorageUsage(payload.storageUsage ?? 0);
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  const completedCount = useMemo(
    () => history.filter((record) => record.status === "completed").length,
    [history],
  );

  const failedCount = useMemo(
    () => history.filter((record) => record.status === "failed").length,
    [history],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRunning(true);
    setFeedback("Downloading...");

    try {
      const response = await fetch("/api/downloads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          mode,
          includePlaylist,
        }),
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok) {
        setFeedback(payload.error ?? "Download failed.");
        if (payload.record) {
          setHistory((previous) => [payload.record!, ...previous]);
        }
        return;
      }

      if (payload.record) {
        setHistory((previous) => [payload.record!, ...previous]);
      }

      setFeedback("Download complete.");
      setUrl("");
      void loadHistory();
    } catch {
      setFeedback("Request failed. Check network or server logs.");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleClearHistory() {
    if (!confirm("Are you sure you want to clear the history? This cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch("/api/downloads", { method: "DELETE" });
      if (response.ok) {
        setFeedback("History cleared.");
        void loadHistory();
      } else {
        setFeedback("Failed to clear history.");
      }
    } catch {
      setFeedback("Error clearing history.");
    }
  }

  async function handleDeleteRecord(id: string) {
    if (!confirm("Are you sure you want to delete this record and its files?")) {
      return;
    }

    // Optimistic update
    setHistory((prev) => prev.filter((r) => r.id !== id));

    try {
      const response = await fetch(`/api/downloads/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setFeedback("Failed to delete record.");
        void loadHistory(); // Revert on failure
      } else {
        void loadHistory(); // Refresh to update storage usage
      }
    } catch {
      setFeedback("Error deleting record.");
      void loadHistory(); // Revert on failure
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="kicker">Google Jules + yt-dlp</p>
        <h1>Video Archive Console</h1>
        <p>
          Submit a URL, choose media mode, and archive downloads with persistent
          history.
        </p>
      </section>

      <section className="panel-grid">
        <form className="panel" onSubmit={onSubmit}>
          <h2>Start Download</h2>

          <label htmlFor="video-url">Video URL</label>
          <input
            id="video-url"
            name="video-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />

          <label htmlFor="mode">Mode</label>
          <select
            id="mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as DownloadMode)}
          >
            <option value="video">Best Video + Audio</option>
            <option value="audio">Audio (MP3)</option>
          </select>

          <label className="checkbox-row" htmlFor="playlist">
            <input
              id="playlist"
              type="checkbox"
              checked={includePlaylist}
              onChange={(event) => setIncludePlaylist(event.target.checked)}
            />
            Download full playlist
          </label>

          <button type="submit" disabled={isRunning}>
            {isRunning ? "Running yt-dlp..." : "Download and Archive"}
          </button>

          <p className="status-text" data-testid="status-text">
            {feedback}
          </p>
        </form>

        <aside className="panel stats-panel">
          <h2>Archive Snapshot</h2>
          <div className="stats-grid">
            <div>
              <span>Total Runs</span>
              <strong>{history.length}</strong>
            </div>
            <div>
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </div>
            <div>
              <span>Failed</span>
              <strong>{failedCount}</strong>
            </div>
            <div>
              <span>Storage Used</span>
              <strong data-testid="storage-usage">{formatBytes(storageUsage)}</strong>
            </div>
          </div>
          <p>
            Downloads are written to <code>DATA_DIR/downloads</code> and archive
            state is tracked with <code>download-archive.txt</code>.
          </p>
        </aside>
      </section>

      <section className="panel history-panel">
        <header className="flex justify-between items-center"><h2>Recent Jobs</h2>{history.length > 0 && (<button onClick={handleClearHistory} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors">Clear History</button>)}</header>
        {history.length === 0 ? (
          <p>No downloads yet.</p>
        ) : (
          <ul className="history-list" data-testid="history-list">
            {history.map((record) => (
              <li key={record.id} className="history-item">
                <header>
                  <span className={`status-pill ${record.status}`}>
                    {record.status}
                  </span>
                  <span>{formatTimestamp(record.createdAt)}</span>
                  <span>{record.mode}</span>
                  <button
                    type="button"
                    className="retry-btn"
                    onClick={() => handleRetry(record)}
                    title="Retry this download"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDeleteRecord(record.id)}
                    title="Delete this record"
                  >
                    Delete
                  </button>
                </header>
                <p className="url-line">{record.url}</p>
                {record.files.length > 0 ? (
                  <ul className="file-list">
                    {record.files.map((file) => (
                      <li key={`${record.id}-${file}`}>
                        <a href={`/api/files/${file}`} download className="text-blue-600 hover:underline"><code>{file}</code></a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-files">No file paths reported.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
