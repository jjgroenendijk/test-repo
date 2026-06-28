export function isSpotifyUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const parts = url.pathname.split("/").filter(Boolean);

    return (
      host === "open.spotify.com" &&
      ["track", "album", "playlist", "artist", "show", "episode"].includes(parts[0]) &&
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
  let filesText = job.files === 1 ? "1 file" : `${job.files} files`;
  if (job.total_size) {
    filesText += ` (${formatFileSize(job.total_size)})`;
  }
  const canCancel = job.status === "Queued" || job.status === "Running";
  const canRetry = job.status === "Failed" || job.status === "Cancelled" || job.status === "Completed";
  const canDelete = job.status === "Completed" || job.status === "Failed" || job.status === "Cancelled";
  const cancelBtnHtml = canCancel ? `<button type="button" class="cancel-job-btn" data-job-id="${escapeHtml(job.id)}">Cancel</button>` : "";
  const retryText = job.status === "Completed" ? "Re-queue" : "Retry";
  const retryBtnHtml = canRetry ? `<button type="button" class="retry-job-btn" data-job-id="${escapeHtml(job.id)}" data-job-url="${escapeHtml(job.url)}" data-job-service="${escapeHtml(job.service || '')}" data-job-quality="${escapeHtml(job.quality || '')}">${retryText}</button>` : "";
  const deleteBtnHtml = canDelete ? `<button type="button" class="delete-job-btn" data-job-id="${escapeHtml(job.id)}">Delete</button>` : "";
  const viewLogsBtnHtml = `<button type="button" class="view-logs-btn" data-job-id="${escapeHtml(job.id)}">View Logs</button>`;
  const viewFilesBtnHtml = job.status === "Completed" ? `<button type="button" class="view-files-btn" data-job-id="${escapeHtml(job.id)}">View Files</button>` : "";
  const downloadZipBtnHtml = job.status === "Completed" ? `<a href="/api/jobs/${escapeHtml(job.id)}/download" download class="download-zip-btn view-files-btn">Download All</a>` : "";

  const progressHtml = job.status === "Running" ? `<div class="job-progress" id="progress-container-${escapeHtml(job.id)}">Loading progress...</div>` : "";
  const urlType = classifySpotifyUrl(job.url);
  const durationStr = formatDuration(job.created_at, job.completed_at);
  const completedAtHtml = job.completed_at ? `<p class="job-source job-completed-time">Completed: ${new Date(job.completed_at).toLocaleString()} (Duration: ${durationStr})</p>` : "";

  return `
    <article class="job-card" data-job-id="${escapeHtml(job.id)}" tabindex="0" aria-label="Job for ${escapeHtml(job.url)}">
      <input type="checkbox" class="job-select-checkbox" data-job-id="${escapeHtml(job.id)}" aria-label="Select job" style="margin-right: 10px; margin-bottom: 10px; width: 18px; height: 18px; accent-color: var(--primary-color);">
      <a href="/api/jobs/${escapeHtml(job.id)}/cover" download="cover.jpg" class="cover-download-link"><img src="/api/jobs/${escapeHtml(job.id)}/cover" class="track-cover" onerror="this.parentNode.style.display='none'" alt="Cover art" /></a>
      <div>
        <p class="job-title">
          <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="source-link">${escapeHtml(job.url)}</a>
          <span class="url-type-badge">${escapeHtml(urlType)}</span>
          <button type="button" class="copy-url-btn" data-job-url="${escapeHtml(job.url)}">Copy</button>
        </p>
        <p class="job-source">Started: ${new Date(job.created_at).toLocaleString()}</p>
        <p class="job-id-display">ID: ${escapeHtml(job.id)} <button type="button" class="copy-job-id-btn" data-job-id="${escapeHtml(job.id)}">Copy ID</button></p>
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
      <div class="job-files-container glass" id="files-container-${escapeHtml(job.id)}">
        <div class="job-section-header">
          <h3 class="job-section-title">Downloaded Files</h3>
          <button type="button" class="close-files-btn job-section-btn" data-job-id="${escapeHtml(job.id)}">Close</button>
        </div>
        <ul class="job-files-list" id="files-list-${escapeHtml(job.id)}">Loading...</ul>
      </div>
      <div class="job-logs-container" id="logs-container-${escapeHtml(job.id)}">
        <div class="job-section-header">
          <h3 class="job-section-title">Execution Logs</h3>
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="display: flex; align-items: center; cursor: pointer; color: var(--text-color); font-size: 13px;">
              <input type="checkbox" class="auto-refresh-logs-toggle" data-job-id="${escapeHtml(job.id)}" style="margin-right: 4px; accent-color: var(--primary-color);"> Auto-refresh
            </label>
            <button type="button" class="copy-logs-btn job-section-btn job-section-btn-mr" data-job-id="${escapeHtml(job.id)}">Copy Logs</button>
            <button type="button" class="refresh-logs-btn job-section-btn job-section-btn-mr" data-job-id="${escapeHtml(job.id)}">Refresh Logs</button>
            <button type="button" class="close-logs-btn job-section-btn" data-job-id="${escapeHtml(job.id)}">Close</button>
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
          <div id="connection-status" class="connection-status status-online" aria-label="Backend connection status">
            <span class="status-dot"></span>
            <span class="status-text">Online</span>
          </div>
          <select id="theme-selector" class="theme-selector" aria-label="Select theme">
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
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
              autofocus
              required
              rows="3"
            ></textarea>
            <select id="service-select" name="service" class="job-status-filter" aria-label="Provider Service Setting" style="align-self: flex-start; margin-right: 10px; background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-color);">
              <option value="tidal" selected>Tidal</option>
              <option value="qobuz">Qobuz</option>
              <option value="deezer">Deezer</option>
              <option value="amazon">Amazon</option>
              <option value="spoti">Spotify</option>
              <option value="soundcloud">Soundcloud</option>
              <option value="youtube">YouTube</option>
              <option value="apple">Apple</option>
              <option value="pandora">Pandora</option>
            </select>
            <select id="quality-select" name="quality" class="job-status-filter" aria-label="Quality Setting" style="align-self: flex-start; margin-right: 10px; background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-color);">
              <option value="LOSSLESS" selected>LOSSLESS</option>
              <option value="HI_RES_LOSSLESS">HI_RES_LOSSLESS</option>
              <option value="HIGH">HIGH</option>
              <option value="LOW">LOW</option>
            </select>
            <input type="file" id="bulk-url-file-input" accept=".txt" style="display: none;" />
            <button type="button" id="load-file-btn" class="clear-history-btn">Load File</button>
            <button type="button" id="clear-input-btn" class="clear-history-btn hidden-btn">Clear input</button>
            <button type="submit">Queue</button>
          </div>
          <p class="hint" id="queue-feedback">Tracks, albums, playlists, and artists will run through the SpotiFLAC module.</p>
        </form>

        <aside class="storage-panel" aria-label="Storage status">
          <span>Data volume</span>
          <strong>/data</strong>
          <div class="storage-progress-bar-bg storage-progress-wrapper" aria-hidden="true">
            <div class="storage-progress-bar-fill" id="storage-progress-fill" style="width: 0%;"></div>
          </div>
          <p class="storage-info-text">
            <span id="storage-usage-text">Job history, logs, and produced files will persist outside the container.</span>
            <span id="storage-percentage-text" class="storage-percentage-text"></span>
          </p>
          <div id="job-stats-container" class="job-stats-container">
            <div>
              <strong class="job-stat-title">Total Jobs</strong>
              <p id="stat-total-jobs" class="job-stat-value">-</p>
            </div>
            <div>
              <strong class="job-stat-title">Total Files</strong>
              <p id="stat-total-files" class="job-stat-value">-</p>
            </div>
            <div class="job-stat-full-width">
              <strong class="job-stat-title">Success Rate</strong>
              <p id="stat-success-rate" class="job-stat-value">-</p>
            </div>
          </div>
        </aside>
      </section>

      <section class="jobs" aria-label="Recent jobs">
        <div class="section-heading section-heading-with-action">
          <h2>Recent jobs</h2>
          <div class="job-controls-row">
            <input type="text" id="job-search-input" placeholder="Search URL or ID..." class="job-search-input" aria-label="Search jobs" />
            <button type="button" id="clear-search-btn" class="clear-search-btn hidden-btn" aria-label="Clear search">X</button>
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
            <a href="/api/history/download" id="download-all-btn" class="clear-history-btn download-link" download>Download all completed</a>
            <a href="/api/history/logs/download" id="download-all-logs-btn" class="clear-history-btn download-link" download>Download all logs</a>
            <button type="button" id="refresh-jobs-btn" class="clear-history-btn">Refresh jobs</button>
            <button type="button" id="pause-polling-btn" class="clear-history-btn pause-polling-btn">Pause Auto-refresh</button>
            <label class="toggle-label">
              <input type="checkbox" id="compact-view-toggle" class="toggle-input">
              Compact view
            </label>
            <button type="button" id="retry-completed-btn" class="clear-history-btn btn-completed">Retry completed</button>
            <button type="button" id="clear-completed-btn" class="clear-history-btn btn-completed">Clear completed</button>
            <button type="button" id="retry-failed-btn" class="clear-history-btn btn-failed">Retry failed</button>
            <button type="button" id="clear-failed-btn" class="clear-history-btn btn-failed">Clear failed</button>
            <button type="button" id="retry-running-btn" class="clear-history-btn btn-running">Retry running</button>
            <button type="button" id="clear-running-btn" class="clear-history-btn btn-running">Clear running</button>
            <button type="button" id="retry-cancelled-btn" class="clear-history-btn btn-cancelled">Retry cancelled</button>
            <button type="button" id="clear-cancelled-btn" class="clear-history-btn btn-cancelled">Clear cancelled</button>
            <button type="button" id="cancel-all-running-btn" class="clear-history-btn btn-running">Cancel all running</button>
            <button type="button" id="cancel-all-queued-btn" class="clear-history-btn btn-queued">Cancel all queued</button>
            <button type="button" id="clear-queued-btn" class="clear-history-btn btn-queued">Clear queued</button>
            <button type="button" id="clear-history-btn" class="clear-history-btn">Clear history</button>
            <button type="button" id="retry-selected-btn" class="clear-history-btn btn-primary hidden-btn" disabled>Retry selected</button>
            <button type="button" id="delete-selected-btn" class="clear-history-btn btn-danger hidden-btn" disabled>Delete selected</button>
            <button type="button" id="delete-all-jobs-btn" class="clear-history-btn btn-danger">Delete all jobs</button>
            <a href="/api/history/export" id="export-history-btn" class="clear-history-btn btn-export download-link" download>Export JSON</a>
            <a href="/api/history/export/csv" id="export-history-csv-btn" class="clear-history-btn btn-export download-link" download>Export CSV</a>
          </div>
        </div>
        <div id="queue-status-summary" class="queue-status-summary"></div>
        <div class="select-all-container" style="margin-bottom: 15px; display: none;" id="select-all-container">
          <label style="display: flex; align-items: center; cursor: pointer; color: var(--text-color);">
            <input type="checkbox" id="select-all-jobs" style="margin-right: 10px; width: 18px; height: 18px; accent-color: var(--primary-color);"> Select All
          </label>
        </div>
        <div class="job-list" id="job-list">
          <!-- Jobs will be loaded here -->
        </div>
      </section>
      <footer class="system-info" id="system-info-container"></footer>
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
  const loadFileBtn = root.querySelector("#load-file-btn");
  const bulkUrlFileInput = root.querySelector("#bulk-url-file-input");
  const serviceSelect = root.querySelector("#service-select");
  const qualitySelect = root.querySelector("#quality-select");

  if (serviceSelect) {
    const savedService = localStorage.getItem("savedService");
    if (savedService) {
      serviceSelect.value = savedService;
    }
    serviceSelect.addEventListener("change", (e) => {
      localStorage.setItem("savedService", e.target.value);
    });
  }

  if (qualitySelect) {
    const savedQuality = localStorage.getItem("savedQuality");
    if (savedQuality) {
      qualitySelect.value = savedQuality;
    }
    qualitySelect.addEventListener("change", (e) => {
      localStorage.setItem("savedQuality", e.target.value);
    });
  }


  if (input && clearInputBtn) {
    input.addEventListener("input", () => {
      if (input.value.length > 0) {
        clearInputBtn.style.display = "inline-block";
      } else {
        clearInputBtn.style.display = "none";
      }
    });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      form.requestSubmit();
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

  if (loadFileBtn && bulkUrlFileInput) {
    loadFileBtn.addEventListener("click", () => {
      bulkUrlFileInput.click();
    });

    bulkUrlFileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (input.value) {
           input.value = input.value + "\n" + content;
        } else {
           input.value = content;
        }

        if (input.value.length > 0 && clearInputBtn) {
          clearInputBtn.style.display = "inline-block";
        }

        // Reset input so the same file can be loaded again if needed
        bulkUrlFileInput.value = '';
      };
      reader.readAsText(file);
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
            <div class="job-progress-details"><strong>Progress:</strong> [${data.current}/${data.total}]${trackInfo} (${data.percentage}%)</div>
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

  async function checkConnectionStatus() {
    const statusContainer = root.querySelector("#connection-status");
    const statusText = root.querySelector(".status-text");
    if (!statusContainer || !statusText) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch("/api/health", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        statusContainer.classList.remove("status-offline");
        statusContainer.classList.add("status-online");
        statusText.textContent = "Online";
      } else {
        throw new Error("Backend not ok");
      }
    } catch (err) {
      statusContainer.classList.remove("status-online");
      statusContainer.classList.add("status-offline");
      statusText.textContent = "Offline";
    }
  }


  async function fetchSystemInfo() {
    try {
      const response = await fetch("/api/system/info");
      if (response.ok) {
        const data = await response.json();
        const container = root.querySelector("#system-info-container");
        if (container) {
          container.textContent = `SpotiFLAC v${data.version} (${data.platform})`;
        }
      }
    } catch (err) {
      console.error("Failed to fetch system info", err);
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

      const activeJobsCount = jobs.filter(job => job.status === "Running" || job.status === "Queued").length;
      if (activeJobsCount > 0) {
        document.title = `(${activeJobsCount}) SpotiFLAC`;
      } else {
        document.title = "SpotiFLAC";
      }

      const downloadAllBtn = root.querySelector("#download-all-btn");
      if (downloadAllBtn) {
        const hasCompleted = jobs.some(job => job.status === "Completed");
        downloadAllBtn.style.display = hasCompleted ? "inline-flex" : "none";
      }

      const downloadAllLogsBtn = root.querySelector("#download-all-logs-btn");
      if (downloadAllLogsBtn) {
        downloadAllLogsBtn.style.display = jobs.length > 0 ? "inline-flex" : "none";
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

      const selectAllContainer = root.querySelector("#select-all-container");
      if (selectAllContainer) {
        if (filteredJobs.length > 0) {
          selectAllContainer.style.display = "block";
        } else {
          selectAllContainer.style.display = "none";
        }
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

      const selectAllCheckbox = root.querySelector("#select-all-jobs");
      if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
      }

      if (typeof updateDeleteSelectedBtn === "function") {
          updateDeleteSelectedBtn();
      } else {
          // manually reset delete button if update function is out of scope here
          const deleteSelectedBtn = root.querySelector("#delete-selected-btn");
          if (deleteSelectedBtn) {
            deleteSelectedBtn.classList.add("hidden-btn");
            deleteSelectedBtn.disabled = true;
          }
          const retrySelectedBtn = root.querySelector("#retry-selected-btn");
          if (retrySelectedBtn) {
            retrySelectedBtn.classList.add("hidden-btn");
            retrySelectedBtn.disabled = true;
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

  const pausePollingBtn = root.querySelector("#pause-polling-btn");
  let isPollingPaused = localStorage.getItem("isPollingPaused") === "true";
  let pollInterval;

  function applyAutoRefreshState() {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    pollInterval = setInterval(() => {
      if (!isPollingPaused) {
        fetchJobs();
      }
    }, 5000);
  }

  if (pausePollingBtn) {
    // Initial UI state
    if (isPollingPaused) {
      pausePollingBtn.textContent = "Resume Auto-refresh";
      pausePollingBtn.classList.add("paused");
    } else {
      pausePollingBtn.textContent = "Pause Auto-refresh";
      pausePollingBtn.classList.remove("paused");
    }

    pausePollingBtn.addEventListener("click", () => {
      isPollingPaused = !isPollingPaused;
      localStorage.setItem("isPollingPaused", isPollingPaused);
      if (isPollingPaused) {
        pausePollingBtn.textContent = "Resume Auto-refresh";
        pausePollingBtn.classList.add("paused");
      } else {
        pausePollingBtn.textContent = "Pause Auto-refresh";
        pausePollingBtn.classList.remove("paused");
      }
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
  fetchSystemInfo();
  updateJobStats();
  applyAutoRefreshState();
  checkConnectionStatus();
  setInterval(() => {
    if (!isPollingPaused) {
      checkConnectionStatus();
    }
  }, 10000); // Update connection status every 10 seconds

  const themeSelector = root.querySelector("#theme-selector");
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(theme) {
    if (theme === "dark" || (theme === "system" && mediaQuery.matches)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "system";
    if (themeSelector) {
      themeSelector.value = savedTheme;
    }
    applyTheme(savedTheme);
  }

  function handleThemeChange(e) {
    const theme = e.target.value;
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  }

  if (themeSelector) {
    themeSelector.addEventListener("change", handleThemeChange);
  }

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", () => {
      const savedTheme = localStorage.getItem("theme") || "system";
      if (savedTheme === "system") {
        applyTheme("system");
      }
    });
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(() => {
      const savedTheme = localStorage.getItem("theme") || "system";
      if (savedTheme === "system") {
        applyTheme("system");
      }
    });
  }

  initTheme();

  // Poll progress more frequently (e.g., every 2 seconds) for smoother updates
  const progressPollInterval = setInterval(() => {
    if (isPollingPaused) return;

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

    // Auto-refresh logs
    const autoRefreshLogsToggles = root.querySelectorAll('.auto-refresh-logs-toggle:checked');
    autoRefreshLogsToggles.forEach(async (toggle) => {
      const jobId = toggle.dataset.jobId;
      if (!jobId) return;
      const logsContainer = root.querySelector(`#logs-container-${jobId}`);
      if (logsContainer && logsContainer.style.display !== 'none') {
        try {
          const response = await fetch(`/api/jobs/${jobId}/log`);
          if (response.ok) {
            const data = await response.json();
            const logsContent = root.querySelector(`#logs-content-${jobId}`);
            if (logsContent) {
              logsContent.textContent = data.log || "No logs available.";
              // Auto-scroll to bottom
              logsContent.scrollTop = logsContent.scrollHeight;
            }
          }
        } catch (err) {
          console.error("Failed to auto-refresh logs", err);
        }
      }
    });

    if (!isPollingPaused) {
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
      const qualitySelect = form.querySelector('#quality-select');
      const quality = qualitySelect ? qualitySelect.value : "LOSSLESS";
      const serviceSelect = form.querySelector('#service-select');
      const service = serviceSelect ? serviceSelect.value : "tidal";
      const requests = urls.map(url =>
        fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, quality, service })
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

  jobList.addEventListener("keydown", (event) => {
    const card = event.target.closest(".job-card");
    if (!card) return;

    // Only trigger navigation if the card itself has focus
    if (event.target !== card) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const cards = Array.from(jobList.querySelectorAll(".job-card"));
      const currentIndex = cards.indexOf(card);
      let nextIndex;
      if (event.key === "ArrowDown") {
        nextIndex = currentIndex + 1 < cards.length ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : cards.length - 1;
      }
      cards[nextIndex].focus();
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
                    const fileSizeStr = isObject && fileObj.size !== undefined ? ` <span class="file-size-text">(${formatFileSize(fileObj.size)})</span>` : "";

                    const encodedJobId = encodeURIComponent(jobId);
                    const encodedFile = fileNameStr.split('/').map(encodeURIComponent).join('/');
                    const fileName = fileNameStr.split('/').pop();
                    const fileUrl = `/api/jobs/${encodedJobId}/files/${encodedFile}`;

                    let audioHtml = "";
                    const lowerFile = fileNameStr.toLowerCase();
                    if (lowerFile.endsWith('.flac') || lowerFile.endsWith('.mp3') || lowerFile.endsWith('.wav') || lowerFile.endsWith('.m4a') || lowerFile.endsWith('.ogg')) {
                        audioHtml = `<br><audio controls src="${fileUrl}" class="audio-preview"></audio>`;
                    }

                    return `<li class="job-files-list-item"><a href="${fileUrl}" download="${escapeHtml(fileName)}" class="file-download-link">${escapeHtml(fileNameStr)}</a>${fileSizeStr}${audioHtml}</li>`;
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
      const jobService = event.target.dataset.jobService;
      const jobQuality = event.target.dataset.jobQuality;
      if (!jobUrl) return;

      const isRequeue = event.target.textContent.trim() === "Re-queue";
      event.target.disabled = true;
      event.target.textContent = isRequeue ? "Re-queueing..." : "Retrying...";

      try {
        const response = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: jobUrl, service: jobService || undefined, quality: jobQuality || undefined })
        });
        if (response.ok) {
          fetchJobs();
        } else {
          event.target.disabled = false;
          event.target.textContent = isRequeue ? "Re-queue" : "Retry";
        }
      } catch (err) {
        console.error("Failed to retry job", err);
        event.target.disabled = false;
        event.target.textContent = isRequeue ? "Re-queue" : "Retry";
      }
    }

    if (event.target.classList.contains("delete-job-btn")) {
      const jobId = event.target.dataset.jobId;
      if (!jobId) return;

      if (!window.confirm("Are you sure you want to delete this job? This cannot be undone.")) {
        return;
      }

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

  const cancelAllRunningBtn = root.querySelector("#cancel-all-running-btn");
  if (cancelAllRunningBtn) {
    cancelAllRunningBtn.addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to cancel all running jobs? This cannot be undone.")) {
        return;
      }
      cancelAllRunningBtn.disabled = true;
      cancelAllRunningBtn.textContent = "Cancelling...";
      try {
        const response = await fetch("/api/jobs/cancel-running", { method: "POST" });
        if (response.ok) {
          fetchJobs();
        }
      } catch (error) {
        console.error("Error cancelling running jobs:", error);
      } finally {
        cancelAllRunningBtn.disabled = false;
        cancelAllRunningBtn.textContent = "Cancel all running";
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

  const deleteSelectedBtn = root.querySelector("#delete-selected-btn");

  const retrySelectedBtn = root.querySelector("#retry-selected-btn");

  function updateDeleteSelectedBtn() {
    const allCheckboxes = Array.from(root.querySelectorAll(".job-select-checkbox"));
    const anyChecked = allCheckboxes.some(cb => cb.checked);
    const allChecked = allCheckboxes.length > 0 && allCheckboxes.every(cb => cb.checked);

    if (anyChecked) {
      deleteSelectedBtn.classList.remove("hidden-btn");
      deleteSelectedBtn.disabled = false;
      if (retrySelectedBtn) {
        retrySelectedBtn.classList.remove("hidden-btn");
        retrySelectedBtn.disabled = false;
      }
    } else {
      deleteSelectedBtn.classList.add("hidden-btn");
      deleteSelectedBtn.disabled = true;
      if (retrySelectedBtn) {
        retrySelectedBtn.classList.add("hidden-btn");
        retrySelectedBtn.disabled = true;
      }

    }

    const selectAllCheckbox = root.querySelector("#select-all-jobs");
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = allChecked;
    }
  }

  const selectAllCheckbox = root.querySelector("#select-all-jobs");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      const allCheckboxes = Array.from(root.querySelectorAll(".job-select-checkbox"));
      allCheckboxes.forEach(cb => {
        cb.checked = isChecked;
      });
      updateDeleteSelectedBtn();
    });
  }

  if (root.querySelector("#app")) {
    root.querySelector("#app").addEventListener("change", (e) => {
      if (e.target.classList.contains("job-select-checkbox")) {
        updateDeleteSelectedBtn();
      }
    });
  } else {
    root.addEventListener("change", (e) => {
      if (e.target.classList.contains("job-select-checkbox")) {
        updateDeleteSelectedBtn();
      }
    });
  }

  if (retrySelectedBtn) {
    retrySelectedBtn.addEventListener("click", async () => {
      const selectedCheckboxes = Array.from(root.querySelectorAll(".job-select-checkbox:checked"));
      const jobIds = selectedCheckboxes.map(cb => cb.dataset.jobId);
      if (jobIds.length === 0) return;

      retrySelectedBtn.disabled = true;
      retrySelectedBtn.textContent = "Retrying...";
      try {
        const jobsResponse = await fetch("/api/jobs");
        if (jobsResponse.ok) {
          const jobs = await jobsResponse.json();
          // Filter to only the selected jobs that are in a retryable state
          const jobsToRetry = jobs.filter(job => jobIds.includes(job.id) && ["Completed", "Failed", "Cancelled"].includes(job.status));

          const retryRequests = jobsToRetry.map(job =>
            fetch("/api/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: job.url, service: job.service, quality: job.quality })
            })
          );

          await Promise.allSettled(retryRequests);

          if (typeof updateDeleteSelectedBtn === "function") {
            updateDeleteSelectedBtn();
          }
          fetchJobs();
        }
      } catch (err) {
        console.error("Failed to retry selected jobs", err);
      } finally {
        retrySelectedBtn.textContent = "Retry selected";
        retrySelectedBtn.disabled = false;
      }
    });
  }


  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener("click", async () => {
      if (!window.confirm("Are you sure you want to delete the selected jobs? This cannot be undone.")) {
        return;
      }
      const selectedCheckboxes = Array.from(root.querySelectorAll(".job-select-checkbox:checked"));
      const jobIds = selectedCheckboxes.map(cb => cb.dataset.jobId);
      if (jobIds.length === 0) return;

      deleteSelectedBtn.disabled = true;
      deleteSelectedBtn.textContent = "Deleting...";
      try {
        const response = await fetch("/api/jobs/delete-selected", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_ids: jobIds })
        });
        if (response.ok) {
          deleteSelectedBtn.classList.add("hidden-btn");
          fetchJobs();
        } else {
          console.error("Failed to delete selected jobs");
        }
      } catch (err) {
        console.error("Error deleting selected jobs:", err);
      } finally {
        deleteSelectedBtn.textContent = "Delete selected";
        deleteSelectedBtn.disabled = false;
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
              body: JSON.stringify({ url: job.url, service: job.service, quality: job.quality })
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
              body: JSON.stringify({ url: job.url, service: job.service, quality: job.quality })
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
              body: JSON.stringify({ url: job.url, service: job.service, quality: job.quality })
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
              body: JSON.stringify({ url: job.url, service: job.service, quality: job.quality })
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
