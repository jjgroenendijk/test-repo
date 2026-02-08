# Website

This Next.js app provides a web interface for running `yt-dlp` and viewing archived download history.

## Local development

1. Install dependencies:

```bash
npm ci
```

2. Run the app:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

- `DATA_DIR` (optional): data root for downloads/history. Defaults to `.data` in development and `/data` in production.
- `YT_DLP_BIN` (optional): binary name/path for `yt-dlp`.

## Test commands

```bash
npm run lint
npm run test
npm run test:e2e
```
