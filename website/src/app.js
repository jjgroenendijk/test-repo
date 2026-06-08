export function isSpotifyUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const parts = url.pathname.split("/").filter(Boolean);

    return (
      host === "open.spotify.com" &&
      ["track", "album", "playlist", "artist"].includes(parts[0]) &&
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

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(startStr, endStr) {
  if (!startStr || !endStr) return "";
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start) || isNaN(end)) return "";

  const diffMs = Math.max(0, end - start);
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
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
  const downloadZipBtnHtml = job.status === "Completed" ? `<a href="/api/jobs/${escapeHtml(job.id)}/download" download class="download-zip-btn view-files-btn">Download All</a>` : "";

  const progressHtml = job.status === "Running" ? `<div class="job-progress" id="progress-container-${escapeHtml(job.id)}" style="grid-column: 1 / -1; margin-top: 8px; font-size: 0.85rem; color: #476154;">Loading progress...</div>` : "";
  const urlType = classifySpotifyUrl(job.url);
  const durationStr = formatDuration(job.created_at, job.completed_at);
  const completedAtHtml = job.completed_at ? `<p class="job-source" style="margin-top: 4px;">Completed: ${new Date(job.completed_at).toLocaleString()} (Duration: ${durationStr})</p>` : "";

  return `
    <article class="job-card" data-job-id="${escapeHtml(job.id)}">
      <img src="/api/jobs/${escapeHtml(job.id)}/cover" class="track-cover" onerror="this.style.display='none'" alt="Cover art" />
      <div>
        <p class="job-title">
          <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="source-link">${escapeHtml(job.url)}</a>
          <span class="url-type-badge" style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; margin-left: 8px; text-transform: capitalize; vertical-align: middle;">${escapeHtml(urlType)}</span>
          <button type="button" class="copy-url-btn" data-job-url="${escapeHtml(job.url)}" style="font-size: 0.75rem; padding: 2px 6px; margin-left: 8px; vertical-align: middle; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 4px;">Copy</button>
        </p>
        <p class="job-source">Started: ${new Date(job.created_at).toLocaleString()}</p>
        <p class="job-id-display" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">ID: ${escapeHtml(job.id)} <button type="button" class="copy-job-id-btn" data-job-id="${escapeHtml(job.id)}" style="font-size: 0.75rem; padding: 2px 6px; margin-left: 8px; vertical-align: middle; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 4px;">Copy ID</button></p>
        ${completedAtHtml}
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
          <div>
            <button type="button" class="copy-logs-btn" data-job-id="${escapeHtml(job.id)}" style="padding: 4px 8px; font-size: 0.75rem; min-height: auto; margin-right: 8px;">Copy Logs</button>
            <button type="button" class="refresh-logs-btn" data-job-id="${escapeHtml(job.id)}" style="padding: 4px 8px; font-size: 0.75rem; min-height: auto; margin-right: 8px;">Refresh Logs</button>
            <button type="button" class="close-logs-btn" data-job-id="${escapeHtml(job.id)}" style="padding: 4px 8px; font-size: 0.75rem; min-height: auto;">Close</button>
          </div>
        </div>
        <pre class="job-logs-content" id="logs-content-${escapeHtml(job.id)}">Loading...</pre>
      </div>
    </article>
  `;
}

export function showNotification(message, type = "success") {
  let container = document.querySelector(".notification-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  container.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("hiding");
    notification.addEventListener("transitionend", () => {
      notification.remove();
      if (container.childNodes.length === 0) {
        container.remove();
      }
    });
  }, 3000);
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
          <label for="spotify-url">Spotify URLs</label>
          <div class="url-row">
            <textarea
              id="spotify-url"
              name="spotify-url"
              placeholder="https://open.spotify.com/artist/..."
              autocomplete="off"
              required
              rows="3"
            ></textarea>
            <button type="button" id="clear-input-btn" class="clear-history-btn" style="display: none;">Clear input</button>
            <button type="submit">Queue</button>
          </div>
          <p class="hint" id="queue-feedback">Tracks, albums, playlists, and artists will run through the SpotiFLAC module.</p>
        </form>

        <aside class="storage-panel" aria-label="Storage status">
          <span>Data volume</span>
          <strong>/data</strong>
          <div class="storage-progress-bar-bg" aria-hidden="true" style="margin-top: 8px; margin-bottom: 8px;">
            <div class="storage-progress-bar-fill" id="storage-progress-fill" style="width: 0%;"></div>
          </div>
          <p style="margin: 0;">
            <span id="storage-usage-text">Job history, logs, and produced files will persist outside the container.</span>
            <span id="storage-percentage-text" style="color: var(--text-secondary); font-size: 0.85em; margin-left: 4px;"></span>
          </p>
          <div id="job-stats-container" style="margin-top: 16px; font-size: 0.85rem; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div>
              <strong style="color: var(--text-primary);">Total Jobs</strong>
              <p id="stat-total-jobs" style="margin: 2px 0 0 0;">-</p>
            </div>
            <div>
              <strong style="color: var(--text-primary);">Total Files</strong>
              <p id="stat-total-files" style="margin: 2px 0 0 0;">-</p>
            </div>
            <div style="grid-column: 1 / -1;">
              <strong style="color: var(--text-primary);">Success Rate</strong>
              <p id="stat-success-rate" style="margin: 2px 0 0 0;">-</p>
            </div>
          </div>
        </aside>
      </section>

      <section class="jobs" aria-label="Recent jobs">
        <div class="section-heading section-heading-with-action">
          <h2>Recent jobs</h2>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" id="job-search-input" placeholder="Search URL or ID..." class="job-search-input" aria-label="Search jobs" />
            <button type="button" id="clear-search-btn" class="clear-search-btn" style="display: none;" aria-label="Clear search">X</button>
            <select id="job-sort-select" class="job-status-filter clear-history-btn" aria-label="Sort jobs">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <select id="job-type-filter" class="job-status-filter clear-history-btn" aria-label="Filter jobs by type">
              <option value="All Types">All Types</option>
              <option value="Track">Track</option>
              <option value="Album">Album</option>
              <option value="Playlist">Playlist</option>
              <option value="Artist">Artist</option>
            </select>
            <select id="job-status-filter" class="job-status-filter clear-history-btn" aria-label="Filter jobs by status">
              <option value="All">All</option>
              <option value="Queued">Queued</option>
              <option value="Running">Running</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <a href="/api/history/download" id="download-all-btn" class="clear-history-btn" download style="text-decoration: none;">Download all completed</a>
            <a href="/api/history/logs/download" id="download-all-logs-btn" class="clear-history-btn" download style="text-decoration: none;">Download all logs</a>
            <button type="button" id="refresh-jobs-btn" class="clear-history-btn">Refresh jobs</button>
            <label style="display: flex; align-items: center; gap: 4px; margin: 0; font-size: 0.85rem; color: var(--text-primary); cursor: pointer;">
              <input type="checkbox" id="auto-refresh-toggle" style="width: auto; min-height: auto; margin: 0; cursor: pointer;">
              Auto-refresh
            </label>
            <label style="display: flex; align-items: center; gap: 4px; margin: 0; font-size: 0.85rem; color: var(--text-primary); cursor: pointer;">
              <input type="checkbox" id="compact-view-toggle" style="width: auto; min-height: auto; margin: 0; cursor: pointer;">
              Compact view
            </label>
            <button type="button" id="retry-completed-btn" class="clear-history-btn" style="border-color: rgba(16, 185, 129, 0.5); color: #10b981;">Retry completed</button>
            <button type="button" id="clear-completed-btn" class="clear-history-btn" style="border-color: rgba(16, 185, 129, 0.5); color: #10b981;">Clear completed</button>
            <button type="button" id="retry-failed-btn" class="clear-history-btn" style="border-color: rgba(234, 179, 8, 0.5); color: #eab308;">Retry failed</button>
            <button type="button" id="clear-failed-btn" class="clear-history-btn" style="border-color: rgba(220, 38, 38, 0.5); color: #dc2626;">Clear failed</button>
            <button type="button" id="retry-running-btn" class="clear-history-btn" style="border-color: rgba(59, 130, 246, 0.5); color: #3b82f6;">Retry running</button>
            <button type="button" id="clear-running-btn" class="clear-history-btn" style="border-color: rgba(59, 130, 246, 0.5); color: #3b82f6;">Clear running</button>
            <button type="button" id="retry-cancelled-btn" class="clear-history-btn" style="border-color: rgba(156, 163, 175, 0.5); color: #9ca3af;">Retry cancelled</button>
            <button type="button" id="clear-cancelled-btn" class="clear-history-btn" style="border-color: rgba(156, 163, 175, 0.5); color: #9ca3af;">Clear cancelled</button>
            <button type="button" id="cancel-all-queued-btn" class="clear-history-btn" style="border-color: rgba(249, 115, 22, 0.5); color: #f97316;">Cancel all queued</button>
            <button type="button" id="clear-queued-btn" class="clear-history-btn" style="border-color: rgba(249, 115, 22, 0.5); color: #f97316;">Clear queued</button>
            <button type="button" id="clear-history-btn" class="clear-history-btn">Clear history</button>
            <button type="button" id="delete-all-jobs-btn" class="clear-history-btn" style="border-color: rgba(239, 68, 68, 0.5); color: #ef4444;">Delete all jobs</button>
            <a href="/api/history/export" id="export-history-btn" class="clear-history-btn" download style="text-decoration: none; border-color: rgba(139, 92, 246, 0.5); color: #8b5cf6;">Export JSON</a>
          </div>
        </div>
        <div id="queue-status-summary" style="margin-bottom: 16px; font-size: 0.9rem; font-weight: 500; color: var(--text-primary);"></div>
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
  const typeFilter = root.querySelector("#job-type-filter");
  const statusFilter = root.querySelector("#job-status-filter");
  const searchInput = root.querySelector("#job-search-input");
  const clearSearchBtn = root.querySelector("#clear-search-btn");
  const sortSelect = root.querySelector("#job-sort-select");
  const clearInputBtn = root.querySelector("#clear-input-btn");

  if (input && clearInputBtn) {
    input.addEventListener("input", () => {
      if (input.value.length > 0) {
        clearInputBtn.style.display = "inline-block";
      } else {
        clearInputBtn.style.display = "none";
      }
    });
  }

  if (clearInputBtn) {
    clearInputBtn.addEventListener("click", () => {
      input.value = "";
      feedback.textContent = "Tracks, albums, playlists, and artists will run through the SpotiFLAC module.";
      feedback.dataset.state = "";
      clearInputBtn.style.display = "none";
    });
  }

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

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async function updateJobStats() {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();

        const totalJobsEl = root.querySelector("#stat-total-jobs");
        const totalFilesEl = root.querySelector("#stat-total-files");
        const successRateEl = root.querySelector("#stat-success-rate");

        if (totalJobsEl) totalJobsEl.textContent = data.total_jobs;
        if (totalFilesEl) totalFilesEl.textContent = data.total_files;
        if (successRateEl) successRateEl.textContent = `${data.success_rate}%`;
      }
    } catch (err) {
      console.error("Failed to fetch job stats", err);
    }
  }

  async function updateStorageUsage() {
    try {
      const response = await fetch("/api/system/storage");
      if (response.ok) {
        const data = await response.json();
        const textElement = root.querySelector("#storage-usage-text");
        const percentageElement = root.querySelector("#storage-percentage-text");

        if (textElement && data.free !== undefined && data.total !== undefined) {
          textElement.textContent = `${formatBytes(data.free)} free of ${formatBytes(data.total)}`;

          if (data.total > 0) {
            const usedPercentage = ((data.total - data.free) / data.total) * 100;

            if (percentageElement) {
                percentageElement.textContent = `(${Math.round(usedPercentage)}% used)`;
            }

            const fillElement = root.querySelector("#storage-progress-fill");
            if (fillElement) {
              fillElement.style.width = `${Math.min(100, Math.max(0, usedPercentage))}%`;
              if (usedPercentage > 90) {
                fillElement.classList.add("danger");
              } else {
                fillElement.classList.remove("danger");
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch storage usage", err);
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

      // Sort jobs
      const sortOrder = sortSelect ? sortSelect.value : "newest";
      const sortedJobs = [...jobs].sort((a, b) => {
        if (sortOrder === "oldest") {
          return new Date(a.created_at) - new Date(b.created_at);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });

      const statusCounts = jobs.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, { Queued: 0, Running: 0, Completed: 0, Failed: 0 });

      const summaryElement = root.querySelector("#queue-status-summary");
      if (summaryElement) {
        summaryElement.textContent = `Queued: ${statusCounts.Queued} | Running: ${statusCounts.Running} | Completed: ${statusCounts.Completed} | Failed: ${statusCounts.Failed}`;
      }

      const selectedType = typeFilter ? typeFilter.value : "All Types";
      let filteredJobs = selectedType === "All Types" ? sortedJobs : sortedJobs.filter(job => {
        const jobType = classifySpotifyUrl(job.url);
        return jobType.toLowerCase() === selectedType.toLowerCase();
      });

      const selectedStatus = statusFilter ? statusFilter.value : "All";
      filteredJobs = selectedStatus === "All" ? filteredJobs : filteredJobs.filter(job => job.status === selectedStatus);

      const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : "";
      if (searchQuery) {
        filteredJobs = filteredJobs.filter(job =>
          (job.url && job.url.toLowerCase().includes(searchQuery)) ||
          (job.id && job.id.toLowerCase().includes(searchQuery))
        );
      }

      if (filteredJobs.length === 0) {
        if (jobs.length === 0) {
          jobList.innerHTML = `<p class="empty-state">No jobs yet.</p>`;
        } else if (searchQuery) {
          jobList.innerHTML = `<p class="empty-state">No jobs match the search query.</p>`;
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

  if (typeFilter) {
    typeFilter.addEventListener("change", fetchJobs);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", fetchJobs);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", fetchJobs);
  }

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", () => {
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchInput.value.length > 0 ? "inline-block" : "none";
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchJobs, 300);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
      }
      clearSearchBtn.style.display = "none";
      fetchJobs();
    });
  }

  const autoRefreshToggle = root.querySelector("#auto-refresh-toggle");
  let pollInterval;

  function applyAutoRefreshState() {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    if (autoRefreshToggle && autoRefreshToggle.checked) {
      pollInterval = setInterval(() => {
        fetchJobs();
      }, 5000);
    }
  }

  if (autoRefreshToggle) {
    const savedAutoRefresh = localStorage.getItem("autoRefresh");
    autoRefreshToggle.checked = savedAutoRefresh !== "false"; // Default to true

    autoRefreshToggle.addEventListener("change", () => {
      localStorage.setItem("autoRefresh", autoRefreshToggle.checked);
      applyAutoRefreshState();
    });
  }

  const compactViewToggle = root.querySelector("#compact-view-toggle");
  function applyCompactViewState() {
    if (compactViewToggle && compactViewToggle.checked) {
      jobList.classList.add("compact");
    } else {
      jobList.classList.remove("compact");
    }
  }

  if (compactViewToggle) {
    const savedCompactView = localStorage.getItem("compactView");
    compactViewToggle.checked = savedCompactView === "true";

    compactViewToggle.addEventListener("change", () => {
      localStorage.setItem("compactView", compactViewToggle.checked);
      applyCompactViewState();
    });
  }

  // Initial load
  fetchJobs();
  applyCompactViewState();
  updateStorageUsage();
  updateJobStats();
  applyAutoRefreshState();

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

    if (autoRefreshToggle && autoRefreshToggle.checked) {
      updateStorageUsage();
      updateJobStats();
    }
  }, 2000);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Split input by any whitespace, filter out empty strings
    const urls = input.value.split(/[\s,]+/).filter(Boolean);

    if (urls.length === 0) {
      feedback.textContent = "Enter at least one Spotify URL.";
      feedback.dataset.state = "error";
      return;
    }

    const invalidUrls = urls.filter(url => !isSpotifyUrl(url));
    if (invalidUrls.length > 0) {
      feedback.textContent = "One or more URLs are invalid. Ensure they are valid Spotify track, album, or playlist URLs.";
      feedback.dataset.state = "error";
      return;
    }

    const queueBtn = form.querySelector('button[type="submit"]');
    queueBtn.disabled = true;
    queueBtn.textContent = "Queueing...";

    // Clear the text input immediately upon submitting
    input.value = "";
    if (clearInputBtn) {
      clearInputBtn.style.display = "none";
    }

    try {
      const requests = urls.map(url =>
        fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        })
      );

      const responses = await Promise.allSettled(requests);

      const failedCount = responses.filter(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok)).length;
      const successCount = responses.length - failedCount;

      if (successCount === 0) {
        throw new Error("Failed to queue all jobs");
      }

      if (failedCount === 0) {
        feedback.textContent = `Successfully queued ${successCount} job${successCount > 1 ? 's' : ''}.`;
        feedback.dataset.state = "success";
      } else {
        feedback.textContent = `Queued ${successCount} job${successCount > 1 ? 's' : ''}, but failed to queue ${failedCount}.`;
        feedback.dataset.state = "error"; // Show orange/red to indicate partial failure
      }

      // Refresh list immediately
      fetchJobs();
    } catch (err) {
      feedback.textContent = "Error queueing jobs.";
      feedback.dataset.state = "error";
    } finally {
      queueBtn.disabled = false;
      queueBtn.textContent = "Queue";
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

    if (event.target.classList.contains("copy-logs-btn")) {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;

      const logsContent = root.querySelector(`#logs-content-${jobId}`);
      if (logsContent) {
        try {
          await navigator.clipboard.writeText(logsContent.textContent);
          const btn = event.target;
          const originalText = btn.textContent;
          btn.textContent = "Copied!";
          btn.disabled = true;
          showNotification("Copied logs!", "success");

          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
          }, 2000);
        } catch (err) {
          console.error("Failed to copy logs", err);
          showNotification("Failed to copy logs", "error");
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

    if (event.target.classList.contains("refresh-logs-btn")) {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;

      const btn = event.target;
      const logsContent = root.querySelector(`#logs-content-${jobId}`);

      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = "Refreshing...";

      try {
        const response = await fetch(`/api/jobs/${jobId}/log`);
        if (response.ok) {
          const data = await response.json();
          if (logsContent) {
            logsContent.textContent = data.log || "No logs available.";
          }
        } else {
          if (logsContent) {
            logsContent.textContent = "Failed to load logs.";
          }
        }
      } catch (err) {
        console.error("Failed to fetch logs", err);
        if (logsContent) {
          logsContent.textContent = "Failed to load logs.";
        }
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
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
                filesList.innerHTML = data.files.map(fileObj => {
                    // Handle both old format (string) and new format (object)
                    const isObject = typeof fileObj === 'object' && fileObj !== null;
                    const fileNameStr = isObject ? fileObj.name : fileObj;
                    const fileSizeStr = isObject && fileObj.size !== undefined ? ` <span style="color: #666; font-size: 0.85em;">(${formatFileSize(fileObj.size)})</span>` : "";

                    const encodedJobId = encodeURIComponent(jobId);
                    const encodedFile = fileNameStr.split('/').map(encodeURIComponent).join('/');
                    const fileName = fileNameStr.split('/').pop();
                    const fileUrl = `/api/jobs/${encodedJobId}/files/${encodedFile}`;

                    let audioHtml = "";
                    const lowerFile = fileNameStr.toLowerCase();
                    if (lowerFile.endsWith('.flac') || lowerFile.endsWith('.mp3') || lowerFile.endsWith('.wav') || lowerFile.endsWith('.m4a') || lowerFile.endsWith('.ogg')) {
                        audioHtml = `<br><audio controls src="${fileUrl}" style="margin-top: 8px; max-width: 100%; height: 32px;"></audio>`;
                    }

                    return `<li style="margin-bottom: 12px;"><a href="${fileUrl}" download="${escapeHtml(fileName)}" class="file-download-link">${escapeHtml(fileNameStr)}</a>${fileSizeStr}${audioHtml}</li>`;
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

      if (!window.confirm("Are you sure you want to cancel this job?")) {
        return;
      }

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

    if (event.target.classList.contains("copy-url-btn")) {
      const jobUrl = event.target.dataset.jobUrl;
      if (!jobUrl) return;

      try {
        await navigator.clipboard.writeText(jobUrl);
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = "Copied!";
        btn.disabled = true;
        showNotification("Copied URL!", "success");

        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 2000);
      } catch (err) {
        console.error("Failed to copy URL", err);
        showNotification("Failed to copy URL", "error");
      }
    }

    if (event.target.classList.contains("copy-job-id-btn")) {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;

      try {
        await navigator.clipboard.writeText(jobId);
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = "Copied!";
        btn.disabled = true;
        showNotification("Copied Job ID!", "success");

        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
        }, 2000);
      } catch (err) {
        console.error("Failed to copy Job ID", err);
        showNotification("Failed to copy Job ID", "error");
      }
    }
  });


  const refreshJobsBtn = root.querySelector("#refresh-jobs-btn");
  if (refreshJobsBtn) {
    refreshJobsBtn.addEventListener("click", async () => {
      refreshJobsBtn.disabled = true;
      refreshJobsBtn.textContent = "Refreshing...";
      try {
        await fetchJobs();
      } finally {
        refreshJobsBtn.disabled = false;
        refreshJobsBtn.textContent = "Refresh jobs";
      }
    });
  }

  const clearRunningBtn = root.querySelector("#clear-running-btn");
  if (clearRunningBtn) {
    clearRunningBtn.addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to clear all running and queued jobs? This cannot be undone.")) {
        return;
      }
      clearRunningBtn.disabled = true;
      clearRunningBtn.textContent = "Clearing...";
      try {
        const response = await fetch("/api/history/clear-running", { method: "DELETE" });
        if (response.ok) {
          fetchJobs();
        } else {
          console.error("Failed to clear running history");
        }
      } catch (error) {
        console.error("Error clearing running history:", error);
      } finally {
        clearRunningBtn.disabled = false;
        clearRunningBtn.textContent = "Clear running";
      }
    });
  }

  const clearCancelledBtn = root.querySelector("#clear-cancelled-btn");
  if (clearCancelledBtn) {
    clearCancelledBtn.addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to clear all cancelled jobs? This cannot be undone.")) {
        return;
      }
      clearCancelledBtn.disabled = true;
      clearCancelledBtn.textContent = "Clearing...";
      try {
        const response = await fetch("/api/history/clear-cancelled", { method: "DELETE" });
        if (response.ok) {
          fetchJobs();
        } else {
          console.error("Failed to clear cancelled history");
        }
      } catch (error) {
        console.error("Error clearing cancelled history:", error);
      } finally {
        clearCancelledBtn.disabled = false;
        clearCancelledBtn.textContent = "Clear cancelled";
      }
    });
  }

  const cancelAllQueuedBtn = root.querySelector("#cancel-all-queued-btn");
  if (cancelAllQueuedBtn) {
    cancelAllQueuedBtn.addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to cancel all queued jobs? This cannot be undone.")) {
        return;
      }
      cancelAllQueuedBtn.disabled = true;
      cancelAllQueuedBtn.textContent = "Cancelling...";
      try {
        const response = await fetch("/api/jobs/cancel-queued", { method: "POST" });
        if (response.ok) {
          fetchJobs();
        } else {
          console.error("Failed to cancel queued jobs");
        }
      } catch (error) {
        console.error("Error cancelling queued jobs:", error);
      } finally {
        cancelAllQueuedBtn.disabled = false;
        cancelAllQueuedBtn.textContent = "Cancel all queued";
      }
    });
  }

  const clearQueuedBtn = root.querySelector("#clear-queued-btn");
  if (clearQueuedBtn) {
    clearQueuedBtn.addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to clear all queued jobs? This cannot be undone.")) {
        return;
      }
      clearQueuedBtn.disabled = true;
      clearQueuedBtn.textContent = "Clearing...";
      try {
        const response = await fetch("/api/history/clear-queued", { method: "DELETE" });
        if (response.ok) {
          fetchJobs();
        } else {
          console.error("Failed to clear queued history");
        }
      } catch (error) {
        console.error("Error clearing queued history:", error);
      } finally {
        clearQueuedBtn.disabled = false;
        clearQueuedBtn.textContent = "Clear queued";
      }
    });
  }

  const clearHistoryBtn = root.querySelector("#clear-history-btn");
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to clear all non-running job history? This cannot be undone.")) {
        return;
      }
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

  const deleteAllJobsBtn = root.querySelector("#delete-all-jobs-btn");
  if (deleteAllJobsBtn) {
    deleteAllJobsBtn.addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to delete all jobs, including running ones? This cannot be undone.")) {
        return;
      }
      deleteAllJobsBtn.disabled = true;
      deleteAllJobsBtn.textContent = "Deleting...";
      try {
        const response = await fetch("/api/jobs", { method: "DELETE" });
        if (response.ok) {
          fetchJobs();
        } else {
          console.error("Failed to delete all jobs");
        }
      } catch (err) {
        console.error("Error deleting all jobs:", err);
      } finally {
        deleteAllJobsBtn.disabled = false;
        deleteAllJobsBtn.textContent = "Delete all jobs";
      }
    });
  }

  const retryCompletedBtn = root.querySelector("#retry-completed-btn");
  if (retryCompletedBtn) {
    retryCompletedBtn.addEventListener("click", async () => {
      retryCompletedBtn.disabled = true;
      retryCompletedBtn.textContent = "Retrying...";
      try {
        const jobsResponse = await fetch("/api/jobs");
        if (jobsResponse.ok) {
          const jobs = await jobsResponse.json();
          const completedJobs = jobs.filter(job => job.status === "Completed");

          const retryRequests = completedJobs.map(job =>
            fetch("/api/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: job.url })
            })
          );

          await Promise.allSettled(retryRequests);
          fetchJobs();
        }
      } catch (err) {
        console.error("Failed to retry completed jobs", err);
      } finally {
        retryCompletedBtn.disabled = false;
        retryCompletedBtn.textContent = "Retry completed";
      }
    });
  }

  const retryFailedBtn = root.querySelector("#retry-failed-btn");
  if (retryFailedBtn) {
    retryFailedBtn.addEventListener("click", async () => {
      retryFailedBtn.disabled = true;
      retryFailedBtn.textContent = "Retrying...";
      try {
        const jobsResponse = await fetch("/api/jobs");
        if (jobsResponse.ok) {
          const jobs = await jobsResponse.json();
          const failedJobs = jobs.filter(job => job.status === "Failed");

          const retryRequests = failedJobs.map(job =>
            fetch("/api/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: job.url })
            })
          );

          await Promise.allSettled(retryRequests);
          fetchJobs();
        }
      } catch (err) {
        console.error("Failed to retry jobs", err);
      } finally {
        retryFailedBtn.disabled = false;
        retryFailedBtn.textContent = "Retry failed";
      }
    });
  }

  const retryRunningBtn = root.querySelector("#retry-running-btn");
  if (retryRunningBtn) {
    retryRunningBtn.addEventListener("click", async () => {
      retryRunningBtn.disabled = true;
      retryRunningBtn.textContent = "Retrying...";
      try {
        const jobsResponse = await fetch("/api/jobs");
        if (jobsResponse.ok) {
          const jobs = await jobsResponse.json();
          const runningJobs = jobs.filter(job => job.status === "Running");

          const retryRequests = runningJobs.map(async (job) => {
            // First delete the running job
            await fetch(`/api/jobs/${encodeURIComponent(job.id)}`, {
              method: "DELETE",
            });
            // Then re-queue it
            return fetch("/api/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: job.url })
            });
          });

          await Promise.allSettled(retryRequests);
          fetchJobs();
        }
      } catch (err) {
        console.error("Failed to retry running jobs", err);
      } finally {
        retryRunningBtn.disabled = false;
        retryRunningBtn.textContent = "Retry running";
      }
    });
  }

  const retryCancelledBtn = root.querySelector("#retry-cancelled-btn");
  if (retryCancelledBtn) {
    retryCancelledBtn.addEventListener("click", async () => {
      retryCancelledBtn.disabled = true;
      retryCancelledBtn.textContent = "Retrying...";
      try {
        const jobsResponse = await fetch("/api/jobs");
        if (jobsResponse.ok) {
          const jobs = await jobsResponse.json();
          const cancelledJobs = jobs.filter(job => job.status === "Cancelled");

          const retryRequests = cancelledJobs.map(job =>
            fetch("/api/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: job.url })
            })
          );

          await Promise.allSettled(retryRequests);
          fetchJobs();
        }
      } catch (err) {
        console.error("Failed to retry cancelled jobs", err);
      } finally {
        retryCancelledBtn.disabled = false;
        retryCancelledBtn.textContent = "Retry cancelled";
      }
    });
  }

  const clearFailedBtn = root.querySelector("#clear-failed-btn");
  if (clearFailedBtn) {
    clearFailedBtn.addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to clear all failed jobs? This cannot be undone.")) {
        return;
      }
      clearFailedBtn.disabled = true;
      clearFailedBtn.textContent = "Clearing...";
      try {
        const response = await fetch("/api/history/clear-failed", { method: "DELETE" });
        if (response.ok) {
          fetchJobs();
        }
      } catch (err) {
        console.error("Failed to clear failed jobs", err);
      } finally {
        clearFailedBtn.disabled = false;
        clearFailedBtn.textContent = "Clear failed";
      }
    });
  }

  const clearCompletedBtn = root.querySelector("#clear-completed-btn");
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to clear all completed jobs? This cannot be undone.")) {
        return;
      }
      clearCompletedBtn.disabled = true;
      clearCompletedBtn.textContent = "Clearing...";
      try {
        const response = await fetch("/api/history/clear-completed", { method: "DELETE" });
        if (response.ok) {
          fetchJobs();
        }
      } catch (err) {
        console.error("Failed to clear completed jobs", err);
      } finally {
        clearCompletedBtn.disabled = false;
        clearCompletedBtn.textContent = "Clear completed";
      }
    });
  }

  // Return cleanup function

  return () => {
    clearInterval(pollInterval);
    clearInterval(progressPollInterval);
  };
}
