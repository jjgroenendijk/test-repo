# Make job source URLs clickable links

**Goal**: Make the job source URLs displayed in the SpotiFLAC web UI clickable links that open in a new tab.

**Details**:
Currently, the URLs (like `https://open.spotify.com/...`) are displayed as plain text in the `.job-title` element. To improve user experience, these should be rendered as clickable `<a>` tags with `target="_blank"` and `rel="noopener noreferrer"`. The link should inherit text styling so it integrates smoothly with the existing liquid glass design.
