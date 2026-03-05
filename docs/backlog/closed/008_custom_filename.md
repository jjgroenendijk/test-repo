# Custom Filename Format

Implement the ability for users to specify a custom filename format (`customFilename`) in the web interface.

## Requirements
- Update `DownloadRequest` and `DownloadRecord` interfaces to include `customFilename?: string`.
- Update `buildYtDlpArgs` to use `customFilename` for the `--output` flag if provided.
- Strict validation: user-provided `customFilename` must not contain directory traversal (`..`), slashes (`/`, `\`), or be an absolute path.
- Add an input field for `customFilename` in the `DownloaderDashboard`.
- The 'Retry' button must restore the `customFilename` field.
- Add a `.custom-filename-badge` CSS class in `globals.css` to style the custom filename indicator in the history list.
- Display the `customFilename` in the history list using the `.custom-filename-badge` class if one was provided.
