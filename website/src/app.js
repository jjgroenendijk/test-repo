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
  const cancelBtnHtml = canCancel ? `<button type="button" class="cancel-job-btn" data-job-id="${escapeHtml(job.id)}">Cancel</button>` : "";

  return `
    <article class="job-card" data-job-id="${escapeHtml(job.id)}">
      <div>
        <p class="job-title">${escapeHtml(job.url)}</p>
        <p class="job-source">Started: ${new Date(job.created_at).toLocaleString()}</p>
      </div>
      <div class="job-meta">
        <span>${escapeHtml(job.status)}</span>
        <span>${filesText}</span>
        ${cancelBtnHtml}
      </div>
      ${errorHtml}
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
        <span class="runtime-badge">Single container</span>
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
        <div class="section-heading">
          <h2>Recent jobs</h2>
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

  async function fetchJobs() {
    try {
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to fetch");
      const jobs = await response.json();

      if (jobs.length === 0) {
        jobList.innerHTML = `<p class="empty-state">No jobs yet.</p>`;
      } else {
        jobList.innerHTML = jobs.map(renderJob).join("");
      }
    } catch (err) {
      console.error(err);
      jobList.innerHTML = `<p class="error-state">Failed to load jobs.</p>`;
    }
  }

  // Initial load
  fetchJobs();
  // Poll every 5 seconds
  const pollInterval = setInterval(fetchJobs, 5000);

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
        }
      } catch (err) {
        console.error("Failed to cancel job", err);
        event.target.disabled = false;
        event.target.textContent = "Cancel";
      }
    }
  });

  // Return cleanup function
  return () => clearInterval(pollInterval);
}
