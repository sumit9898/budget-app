You are a senior full-stack engineer. Build a production-ready web app called “iWork ➜ Office Converter” that converts Apple iWork files (Pages, Numbers, Keynote) into Microsoft Office formats with an Apple-style UI and a light/dark mode toggle.

GOAL
- Users upload .pages, .numbers, or .key files and get back .docx/.rtf/.pdf (for Pages), .xlsx/.csv/.pdf (for Numbers), and .pptx/.pdf (for Keynote).
- Batch conversion is supported (multiple files at once), with clear per-file progress and errors.

TECH STACK
- Front end: React + Next.js (App Router), TypeScript, Tailwind CSS. Use Headless UI or Radix for accessible components. No CSS frameworks other than Tailwind.
- Server: Next.js API routes (Node/TypeScript). Use server actions where appropriate.
- Storage: In-memory for small files; include easy adapters for AWS S3 or local disk.
- Optional external conversion: integrate CloudConvert API (or similar) as the default backend. ALSO include an optional macOS-only local converter that uses AppleScript/JXA to drive Pages/Numbers/Keynote on a host Mac to export to the target format. The app should select the backend at runtime via env var: `CONVERSION_BACKEND=cloudconvert|local`.
- Uploads: chunked/resumable (tus or Uppy + tus) with 2GB per file default limit, configurable via env.
- Real-time updates: show conversion progress via web sockets (Next.js with socket.io) or Server-Sent Events.

UI/UX (Apple-inspired)
- Clean, spacious layout inspired by Apple HIG: generous whitespace, rounded corners, subtle shadows, motion that feels calm.
- Typography: system font stack (San Francisco on Apple platforms, otherwise Inter fallback).
- Top bar with app name on the left, a right-aligned light/dark mode toggle (Sun/Moon icon) that flips a `data-theme="light|dark"` on `<html>`. Persist the choice in `localStorage`.
- Primary area: a centered, large drag-and-drop card with:
  - “Drop your iWork files here” + “or browse” button.
  - A compact “Output format” selector that dynamically filters valid targets per file type.
  - A queue list showing each file with:
    - Original name, detected type, chosen output format
    - Progress bar with states: queued → uploading → converting → done (download) / failed (retry)
    - Per-file actions: remove, retry, change format
- Secondary area: informational panel with privacy note, supported conversions, and limitations.
- Notifications: toast for success/failure and a “Download all” when all complete.
- Keyboard and screen reader accessible; focus states visible; high contrast verified.

THEMING
- Implement light/dark mode using CSS variables (e.g., `--bg`, `--fg`, `--muted`, `--card`, `--border`) switched by `data-theme` on `<html>`. Provide well-tuned palettes for both modes.
- Ensure all states (hover/active/disabled), progress bars, toasts, and focus rings look good in both themes.

CONVERSION BACKENDS
1) Cloud Backend (default):
   - Provide a `ConversionService` wrapper for CloudConvert (or compatible API) with:
     - `createJob(fileBuffer, sourceExt, targetExt)` returning a job id
     - streaming progress events (stage + percent)
     - secure signed URLs for downloads
   - Use server-side upload from Next.js API to the provider (do NOT expose provider secret keys to the browser).
   - Handle provider errors (unsupported file, corrupted, password-protected) gracefully with actionable messages.

2) Local macOS Backend (optional):
   - Only enabled if `process.platform === 'darwin'` AND `CONVERSION_BACKEND=local`.
   - Implement `osascript`/JXA commands to open the file in the corresponding iWork app and export:
     - Pages → .docx/.rtf/.pdf
     - Numbers → .xlsx/.csv/.pdf
     - Keynote → .pptx/.pdf
   - Run conversions in a queue with concurrency=1–2 to avoid app contention.
   - Sandbox outputs to a temp dir and stream results back to the client.

SECURITY & PRIVACY
- Never log file contents. Strip EXIF/metadata from outputs where reasonable.
- Uploads are virus-scanned (ClamAV) on the server before conversion (make this a toggle `ENABLE_VIRUS_SCAN`).
- Enforce file size/type limits server-side. Validate MIME & extension.
- Auto-delete all uploaded and converted files after N minutes (default 30) via a background cleanup job.
- Rate-limit by IP and session (e.g., 60 requests/hour).
- Provide a plain-English privacy note in the UI.

FEATURES
- Batch conversion with per-file target format selection and “Apply to all” option.
- “Download all” produces a zip with original filenames + new extensions.
- Drag-and-drop reordering in the queue.
- Client-side detection of input type (by extension + quick signature check); server is source of truth.
- Robust error states: unsupported input, unsupported target, corrupted file, password-protected, provider downtime, timeout.
- Internationalization-ready (en scaffold).
- Basic analytics event hooks (conversion_started, conversion_succeeded, conversion_failed) with a no-op adapter.

CODE QUALITY
- TypeScript everywhere with strict mode.
- Clean separation: `/lib/conversion`, `/lib/storage`, `/lib/queue`, `/components/*`, `/app/api/*`.
- Include unit tests for format mapping and API handlers (Vitest), and an integration test for the conversion flow with a mocked backend.
- ESLint + Prettier preconfigured.

DELIVERABLES
- Full Next.js app with:
  - Responsive Apple-inspired UI (light/dark toggle)
  - Dropzone, queue, progress, toasts, per-file controls
  - Two backends: Cloud (default) and optional local macOS
  - Env-driven config with `.env.example`
  - Simple S3/local storage adapter
  - Cleanup job
  - Basic test suite
  - README with setup (including CloudConvert keys, local macOS steps), limitations, and security notes

SUPPORTED MAPPINGS (enforce)
- Pages (.pages) → .docx | .rtf | .pdf
- Numbers (.numbers) → .xlsx | .csv | .pdf
- Keynote (.key) → .pptx | .pdf
If a user selects an invalid mapping, disable the choice with a tooltip explaining why.

ACCEPTANCE CRITERIA
- I can drag in 3 files (one of each iWork type), pick different targets, and watch independent progress bars to completion.
- The theme toggle instantly flips all surfaces, text, borders, and components; choice persists across reloads.
- On slow networks I see granular stages (upload → convert → prepare download).
- “Download all” returns a zip; individual “Download” works.
- If I upload an unsupported file or a corrupted iWork file, I get a helpful error and can remove/retry.
- Files auto-delete after the configured time; fresh reload shows an empty queue.

Please generate:
1) All source code,
2) A README with setup for both backends,
3) Example Apple test files (or stubs) in a `/samples` folder,
4) A small screenshot in `/public/og.png` for the landing page.