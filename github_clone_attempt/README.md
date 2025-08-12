# iWork ➜ Office Converter

Convert Apple iWork files (Pages, Numbers, Keynote) into Microsoft Office formats with an Apple-style UI and light/dark mode.

## Features

- Batch conversion with per-file target format and reordering
- Granular progress: queued → uploading → converting → done/failed
- Light/dark theme toggle with persistence
- "Download all" zip and individual download links
- Optional virus scan, file size/type enforcement, IP rate limiting
- Storage adapters (memory, disk, S3) and auto-cleanup scaffold
- Optional backends: Cloud (CloudConvert wrapper) and local macOS (osascript/JXA) — provided as stubs; default uses a mock cloud service for demo

## Tech Stack

- Next.js (App Router) + React + TypeScript + Tailwind CSS
- API routes with SSE for progress
- Headless UI-inspired accessible components

## Getting Started

1. Clone and install

```bash
pnpm i # or npm i / yarn
```

2. Create your env file

```bash
cp .env.example .env.local
```

3. (Optional) Generate the Open Graph image

```bash
npm run prepare-assets
```

4. Run dev

```bash
npm run dev
```

Open http://localhost:3000.

## Backends

The app uses `CONVERSION_BACKEND` to choose the conversion backend.

- `cloudconvert` (default): wraps CloudConvert API. In this repository, a mock cloud converter is used by default to avoid external calls. Swap in a real implementation in `lib/conversion/providers/cloudconvert.ts` (stub location) and wire it in `app/api/convert/route.ts`.
- `local` (macOS only): uses AppleScript/JXA to drive iWork apps. See `lib/conversion/providers/local-macos.ts` for a queue-based executor (stubbed).

Both backends must implement the `ConversionService` interface.

## Storage

Set `STORAGE_DRIVER` to one of:

- `memory` (default): in-process map, good for local dev and demos
- `disk`: stores files in `.data/storage` (configurable via `DISK_STORAGE_PATH`)
- `s3`: uses AWS SDK v3; set `AWS_*` variables accordingly

## Security & Privacy

- No file contents are logged. Outputs include a small banner header in the demo backend for safety.
- Optional ClamAV scan: set `ENABLE_VIRUS_SCAN=true` (requires `clamscan` installed on server).
- Files are auto-deleted by your storage retention policy; a periodic cleanup worker scaffold can be added (see `lib/storage`).
- IP-based rate limiting is applied on API routes.

## Uploads

The UI uses a simple multipart upload endpoint (`/api/upload`). A TUS endpoint scaffold can be added at `/api/tus` using `tus-node-server` for resumable, chunked uploads. Uppy can be integrated client-side if desired.

`UPLOAD_MAX_BYTES` defaults to 2GB.

## Real-time Updates

SSE streams conversion events per job at `/api/events/:jobId`.

## Tests

Run tests:

```bash
npm test
```

Includes unit tests for format mappings and a placeholder API test. You can extend with integration tests by mocking storage and conversion backends.

## Local macOS Backend (Optional)

Set `CONVERSION_BACKEND=local` on macOS. The local provider should:

- Open the file in the corresponding iWork app (Pages/Numbers/Keynote)
- Export to one of the supported formats
- Run conversions via a queue with concurrency 1–2

This repo includes a scaffold; you’ll need Pages/Numbers/Keynote installed and permissions for automation. See `lib/conversion/providers/local-macos.ts`.

## CloudConvert (Optional)

Set `CONVERSION_BACKEND=cloudconvert` and configure:

```
CLOUDCONVERT_API_KEY=your-key
CLOUDCONVERT_API_BASE=https://api.cloudconvert.com/v2
```

Implement the wrapper in `lib/conversion/providers/cloudconvert.ts` to securely upload from the server and stream progress.

## Accessibility & Theming

- Theme toggles `data-theme` on `<html>` and uses CSS variables for surfaces, borders, and text.
- Focus states are visible; keyboard interactions supported for upload and controls.

## Samples

See `/samples` for stub iWork files (.pages, .numbers, .key) for testing the UI flow.

## Limitations

- The demo conversion backend does not produce true Office files; it emits a safe placeholder. Swap for real backends as described.
- TUS resumable uploads are scaffolded but not enabled by default.

## Security Notes

- Never expose provider keys to the browser; all uploads to CloudConvert (or providers) must be server-initiated.
- Validate file types and sizes server-side; this app enforces size and extension checks.

