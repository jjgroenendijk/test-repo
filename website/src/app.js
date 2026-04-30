export const demoJobs = [
  {
    title: "Album import",
    source: "spotify.com/album/1ATL5GLyefJaxhQzSPVrLX",
    status: "Waiting for backend",
    files: "0 files",
  },
  {
    title: "Playlist archive",
    source: "spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    status: "Planned",
    files: "Persistent /data history",
  },
];

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

function renderJob(job) {
  return `
    <article class="job-card">
      <div>
        <p class="job-title">${job.title}</p>
        <p class="job-source">${job.source}</p>
      </div>
      <div class="job-meta">
        <span>${job.status}</span>
        <span>${job.files}</span>
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
          <span>Backend integration next</span>
        </div>
        <div class="job-list">
          ${demoJobs.map(renderJob).join("")}
        </div>
      </section>
    </section>
  `;

  const form = root.querySelector("#queue-form");
  const input = root.querySelector("#spotify-url");
  const feedback = root.querySelector("#queue-feedback");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();

    if (!isSpotifyUrl(value)) {
      feedback.textContent = "Enter a Spotify track, album, or playlist URL.";
      feedback.dataset.state = "error";
      return;
    }

    const type = classifySpotifyUrl(value);
    feedback.textContent = `Ready to queue ${type} when the SpotiFLAC backend is connected.`;
    feedback.dataset.state = "ready";
  });
}
