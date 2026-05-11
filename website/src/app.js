export function isSpotifyUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const parts = url.pathname.split("/").filter(Boolean);

    return (
      host === "open.spotify.com" &&
      ["track", "album", "playlist"].includes(parts[0]) &&
      Boolean(parts[1])
    );
  } catch {
    return false;
  }
}

export function classifySpotifyUrl(value) {
  if (!isSpotifyUrl(value)) {
    return "Spotify URL";
  }

  return new URL(value).pathname.split("/").filter(Boolean)[0];
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

function renderJob(job) {
  const errorHtml = job.error_log ? `<pre class="job-error">${escapeHtml(job.error_log)}</pre>` : "";
  const filesText = job.files === 1 ? "1 file" : `${job.files} files`;
  const canCancel = job.status === "Queued" || job.status === "Running";
  const canRetry = job.status === "Failed" || job.status === "Cancelled";
  const canDelete = job.status === "Completed" || job.status === "Failed" || job.status === "Cancelled";
  const cancelBtnHtml = canCancel ? `<button type="button" class="cancel-job-btn" data-job-id="${escapeHtml(job.id)}">Cancel</button>` : "";
  const retryBtnHtml = canRetry ? `<button type="button" class="retry-job-btn" data-job-url="${escapeHtml(job.url)}">Retry</button>` : "";
  const deleteBtnHtml = canDelete ? `<button type="button" class="delete-job-btn" data-job-id="${escapeHtml(job.id)}">Delete</button>` : "";
  const viewLogsBtnHtml = `<button type="button" class="view-logs-btn" data-job-id="${escapeHtml(job.id)}">View Logs</button>`;
  const viewFilesBtnHtml = job.status === "Completed" ? `<button type="button" class="view-files-btn" data-job-id="${escapeHtml(job.id)}">View Files</button>` : "";
  const downloadZipBtnHtml = job.status === "Completed" ? `<a href="/api/jobs/${escapeHtml(job.id)}/download" download class="download-zip-btn view-files-btn">Download ZIP</a>` : "";

  const progressHtml = job.status === "Running" ? `<div class="job-progress" id="progress-container-${escapeHtml(job.id)}" style="grid-column: 1 / -1; margin-top: 8px; font-size: 0.85rem; color: #476154;">Loading progress...</div>` : "";

  return `
    <article class="job-card" data-job-id="${escapeHtml(job.id)}">
      <img src="/api/jobs/${escapeHtml(job.id)}/cover" class="track-cover" onerror="this.style.display='none'" alt="Cover art" />
      <div>
        <p class="job-title">${escapeHtml(job.url)}</p>
        <p class="job-source">Started: ${new Date(job.created_at).toLocaleString()}</p>
      </div>
      <div class="job-meta">
        <span>${escapeHtml(job.status)}</span>
        <span>${filesText}</span>
        <div class="job-actions">
          ${viewLogsBtnHtml}
          ${viewFilesBtnHtml}
          ${downloadZipBtnHtml}
          ${cancelBtnHtml}
          ${retryBtnHtml}
          ${deleteBtnHtml}
        </div>
      </div>
      ${errorHtml}
      ${progressHtml}
      <div class="job-files-container glass" id="files-container-${escapeHtml(job.id)}" style="display: none; grid-column: 1 / -1; margin-top: 12px; padding: 12px; border-radius: 8px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 0.9rem; color: #476154;">Downloaded Files</h3>
          <button type="button" class="close-files-btn" data-job-id="${escapeHtml(job.id)}" style="padding: 4px 8px; font-size: 0.75rem; min-height: auto;">Close</button>
        </div>
        <ul class="job-files-list" id="files-list-${escapeHtml(job.id)}" style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #333;">Loading...</ul>
      </div>
      <div class="job-logs-container" id="logs-container-${escapeHtml(job.id)}" style="display: none; grid-column: 1 / -1;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 0.9rem; color: #476154;">Execution Logs</h3>
          <button type="button" class="close-logs-btn" data-job-id="${escapeHtml(job.id)}" style="padding: 4px 8px; font-size: 0.75rem; min-height: auto;">Close</button>
        </div>
        <pre class="job-logs-content" id="logs-content-${escapeHtml(job.id)}">Loading...</pre>
      </div>
    </article>
  `;
}

export function renderApp(root) {
  root.innerHTML = `
    <section class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Self-hosted music library intake</p>
          <h1>SpotiFLAC</h1>
        </div>
        <div class="topbar-actions">
          <button type="button" id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle dark mode">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon theme-icon-dark"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun theme-icon-light"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          </button>
          <span class="runtime-badge">Single container</span>
        </div>
      </header>

      <section class="workspace" aria-label="SpotiFLAC queue">
        <form class="queue-panel" id="queue-form">
          <label for="spotify-url">Spotify URL</label>
          <div class="url-row">
            <input
              id="spotify-url"
              name="spotify-url"
              type="url"
              placeholder="https://open.spotify.com/album/..."
              autocomplete="off"
              required
            />
            <button type="submit">Queue</button>
          </div>
          <p class="hint" id="queue-feedback">Tracks, albums, and playlists will run through the SpotiFLAC module.</p>
        </form>

        <aside class="storage-panel" aria-label="Storage status">
          <span>Data volume</span>
          <strong>/data</strong>
          <p>Job history, logs, and produced files will persist outside the container.</p>
        </aside>
      </section>

      <section class="jobs" aria-label="Recent jobs">
        <div class="section-heading section-heading-with-action">
          <h2>Recent jobs</h2>
          <div style="display: flex; gap: 8px; align-items: center;">
            <select id="job-status-filter" class="job-status-filter clear-history-btn" aria-label="Filter jobs by status">
              <option value="All">All</option>
              <option value="Queued">Queued</option>
              <option value="Running">Running</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <a href="/api/history/download" id="download-all-btn" class="clear-history-btn" download style="text-decoration: none; display: none;">Download all completed</a>
            <button type="button" id="clear-history-btn" class="clear-history-btn">Clear history</button>
          </div>
        </div>
        <div class="job-list" id="job-list">
          <!-- Jobs will be loaded here -->
        </div>
      </section>
    </section>
  `;

  const form = root.querySelector("#queue-form");
  const input = root.querySelector("#spotify-url");
  const feedback = root.querySelector("#queue-feedback");
  const jobList = root.querySelector("#job-list");
  const statusFilter = root.querySelector("#job-status-filter");

  async function updateProgress(jobId) {
    const container = root.querySelector(`#progress-container-${jobId}`);
    if (!container) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}/progress`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          const trackInfo = data.track ? `: ${escapeHtml(data.track)}` : '';
          container.innerHTML = `
            <div style="margin-bottom: 4px;"><strong>Progress:</strong> [${data.current}/${data.total}]${trackInfo} (${data.percentage}%)</div>
            <div class="progress-bar-bg" aria-hidden="true">
              <div class="progress-bar-fill" style="width: ${data.percentage}%;"></div>
            </div>
          `;
        } else {
          container.innerHTML = 'Starting...';
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchJobs() {
    try {
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to fetch");
      const jobs = await response.json();

      const downloadAllBtn = root.querySelector("#download-all-btn");
      if (downloadAllBtn) {
        const hasCompleted = jobs.some(job => job.status === "Completed");
        downloadAllBtn.style.display = hasCompleted ? "inline-flex" : "none";
      }

      const selectedStatus = statusFilter ? statusFilter.value : "All";
      const filteredJobs = selectedStatus === "All" ? jobs : jobs.filter(job => job.status === selectedStatus);

      if (filteredJobs.length === 0) {
        if (jobs.length === 0) {
          jobList.innerHTML = `<p class="empty-state">No jobs yet.</p>`;
        } else {
          jobList.innerHTML = `<p class="empty-state">No jobs match the selected filter.</p>`;
        }
      } else {
        jobList.innerHTML = filteredJobs.map(renderJob).join("");

        // Fetch progress for running jobs
        for (const job of jobs) {
          if (job.status === "Running") {
            updateProgress(job.id);
          }
        }
      }
    } catch (err) {
      console.error(err);
      jobList.innerHTML = `<p class="error-state">Failed to load jobs.</p>`;
    }
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", fetchJobs);
  }

  // Initial load
  fetchJobs();
  // Poll every 5 seconds
  const pollInterval = setInterval(fetchJobs, 5000);

  const themeToggleBtn = root.querySelector("#theme-toggle");

  function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  initTheme();

  // Poll progress more frequently (e.g., every 2 seconds) for smoother updates
  const progressPollInterval = setInterval(() => {
    const runningJobs = Array.from(root.querySelectorAll('.job-card')).filter(card => {
      const statusText = card.querySelector('.job-meta span:first-child')?.textContent;
      return statusText === 'Running';
    });

    runningJobs.forEach(card => {
      const jobId = card.dataset.jobId;
      if (jobId) {
        updateProgress(jobId);
      }
    });
  }, 2000);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = input.value.trim();

    if (!isSpotifyUrl(value)) {
      feedback.textContent = "Enter a Spotify track, album, or playlist URL.";
      feedback.dataset.state = "error";
      return;
    }

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value })
      });

      if (!response.ok) throw new Error("Failed to queue");

      input.value = "";
      feedback.textContent = "Job queued successfully.";
      feedback.dataset.state = "success";

      // Refresh list immediately
      fetchJobs();
    } catch (err) {
      feedback.textContent = "Error queueing job.";
      feedback.dataset.state = "error";
    }
  });

  jobList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("view-logs-btn")) {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;

      const logsContainer = root.querySelector(`#logs-container-${jobId}`);
      const logsContent = root.querySelector(`#logs-content-${jobId}`);

      if (logsContainer) {
        logsContainer.style.display = "block";
        try {
          const response = await fetch(`/api/jobs/${jobId}/log`);
          if (response.ok) {
            const data = await response.json();
            logsContent.textContent = data.log || "No logs available.";
            // Auto-scroll to bottom
            logsContent.scrollTop = logsContent.scrollHeight;
          } else {
            logsContent.textContent = "Log file not found or error fetching logs.";
          }
        } catch (err) {
          logsContent.textContent = "Error fetching logs.";
          console.error(err);
        }
      }
    }

    if (event.target.classList.contains("close-logs-btn")) {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;

      const logsContainer = root.querySelector(`#logs-container-${jobId}`);
      if (logsContainer) {
        logsContainer.style.display = "none";
      }
    }

    if (event.target.classList.contains("view-files-btn")) {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;

      const filesContainer = root.querySelector(`#files-container-${jobId}`);
      const filesList = root.querySelector(`#files-list-${jobId}`);

      if (filesContainer) {
        filesContainer.style.display = "block";
        try {
          const response = await fetch(`/api/jobs/${jobId}/files`);
          if (response.ok) {
            const data = await response.json();
            if (data.files && data.files.length > 0) {
                filesList.innerHTML = data.files.map(file => {
                    const encodedJobId = encodeURIComponent(jobId);
                    const encodedFile = file.split('/').map(encodeURIComponent).join('/');
                    const fileName = file.split('/').pop();
                    return `<li><a href="/api/jobs/${encodedJobId}/files/${encodedFile}" download="${escapeHtml(fileName)}" class="file-download-link">${escapeHtml(file)}</a></li>`;
                }).join("");
            } else {
                filesList.innerHTML = "<li>No files found.</li>";
            }
          } else {
            filesList.innerHTML = "<li>Error fetching files.</li>";
          }
        } catch (err) {
          filesList.innerHTML = "<li>Error fetching files.</li>";
          console.error(err);
        }
      }
    }

    if (event.target.classList.contains("close-files-btn")) {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;

      const filesContainer = root.querySelector(`#files-container-${jobId}`);
      if (filesContainer) {
        filesContainer.style.display = "none";
      }
    }

    if (event.target.classList.contains("cancel-job-btn")) {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;

      event.target.disabled = true;
      event.target.textContent = "Cancelling...";

      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: "DELETE"
        });
        if (response.ok) {
          fetchJobs();
        } else {
          event.target.disabled = false;
          event.target.textContent = "Cancel";
        }
      } catch (err) {
        console.error("Failed to cancel job", err);
        event.target.disabled = false;
        event.target.textContent = "Cancel";
      }
    }

    if (event.target.classList.contains("retry-job-btn")) {
      const jobUrl = event.target.dataset.jobUrl;
      if (!jobUrl) return;

      event.target.disabled = true;
      event.target.textContent = "Retrying...";

      try {
        const response = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: jobUrl })
        });
        if (response.ok) {
          fetchJobs();
        } else {
          event.target.disabled = false;
          event.target.textContent = "Retry";
        }
      } catch (err) {
        console.error("Failed to retry job", err);
        event.target.disabled = false;
        event.target.textContent = "Retry";
      }
    }

    if (event.target.classList.contains("delete-job-btn")) {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;

      event.target.disabled = true;
      event.target.textContent = "Deleting...";

      try {
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: "DELETE"
        });
        if (response.ok) {
          fetchJobs();
        } else {
          event.target.disabled = false;
          event.target.textContent = "Delete";
        }
      } catch (err) {
        console.error("Failed to delete job", err);
        event.target.disabled = false;
        event.target.textContent = "Delete";
      }
    }
  });


  const clearHistoryBtn = root.querySelector("#clear-history-btn");
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", async () => {
      clearHistoryBtn.disabled = true;
      clearHistoryBtn.textContent = "Clearing...";
      try {
        const response = await fetch("/api/history/clear", { method: "DELETE" });
        if (response.ok) {
          fetchJobs();
        }
      } catch (err) {
        console.error("Failed to clear history", err);
      } finally {
        clearHistoryBtn.disabled = false;
        clearHistoryBtn.textContent = "Clear history";
      }
    });
  }

  // Return cleanup function

  return () => {
    clearInterval(pollInterval);
    clearInterval(progressPollInterval);
  };
}
