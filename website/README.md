# Website Reset Placeholder

Legacy yt-dlp UI removed.

This Next.js app now exists only as a minimal placeholder while Google Jules rebuilds the product around a self-hosted web UI for the Python module `SpotiFLAC`.

## Current state

- no yt-dlp download UI
- no legacy media workflow code
- minimal placeholder page only
- health endpoint kept for container/runtime checks

## Local development

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

- `DATA_DIR` (optional): future persistent application data root. Defaults to `/data` in production.

## Test commands

```bash
npm run lint
npm run test
npm run test:e2e
```
