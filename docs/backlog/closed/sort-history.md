# Sort History

## Requirement
Add a sorting dropdown to the history view to allow sorting jobs by creation date (newest first, oldest first).
Currently, jobs are always displayed "newest first" by hardcoding `[...jobs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))`.

## Scope
- Add a `<select>` element to the UI in `website/src/app.js`.
- Modify the `fetchJobs` function in `website/src/app.js` to read the `<select>` value and sort the `sortedJobs` array accordingly.
- Add event listeners so `fetchJobs` is called when the sort selection changes.
- Add Playwright tests to ensure the jobs are ordered correctly when "Oldest First" is selected.