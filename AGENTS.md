# Repository Guidelines

## Project Structure & Module Organization
- app root: `budget-app/`
- entry points: `index.html` (markup), `styles.css` (theme + layout), `app.js` (state, DOM, events).
- storage: browser `localStorage` via `store` helper in `app.js`.
- preferred additions: keep new images/fonts under `budget-app/assets/` and reference with relative paths.

## Build, Test, and Development Commands
- run locally: `python3 -m http.server 5173 --directory budget-app` then open `http://localhost:5173/`.
- alt server (Node): `npx serve budget-app -p 5173`.
- no build step: plain HTML/CSS/JS; avoid bundlers unless discussed in an issue.

## Coding Style & Naming Conventions
- indentation: 2 spaces in HTML/CSS/JS; no tabs.
- JavaScript: use `const`/`let`, semicolons, single quotes, template literals; camelCase for variables and functions (e.g., `formatCurrency`, `deleteExpense`).
- CSS: kebab-case class names (e.g., `.app-header`, `.kpi-value`); prefer CSS variables defined in `:root`/`[data-theme="dark"]`.
- HTML: semantic elements (`header`, `main`, `section`, `footer`); IDs used by JS match existing patterns (e.g., `#budgetValue`, `#expenseForm`).
- structure: keep UI logic in `render()` and small helpers (`$`, `$$`); keep global state in the `state` object.

## Testing Guidelines
- current: no automated tests; verify manually in Chrome/Safari/Firefox.
- sanity checks: add/edit budget, add/delete expense, search/filter, theme toggle, progress ring, and data persistence after refresh.
- accessibility: confirm focus order, `aria-*` attributes on controls, and readable contrast in light/dark.

## Commit & Pull Request Guidelines
- commit style: short, imperative subject with a scope when helpful (e.g., `UI: tune progress ring`, `Fix: prevent NaN in totals`).
- PRs must include: clear description, before/after screenshots for UI changes, test steps, and linked issue if applicable.
- size: keep changes focused; unrelated refactors belong in separate PRs.
- formatting: run a quick pass to keep 2-space indent and consistent quotes; avoid introducing dependencies.

## Security & Configuration Tips
- no backend: all data stays in the browser. Avoid third-party scripts.
- XSS safety: sanitize user strings with `escapeHtml()` before injecting into the DOM; follow the existing pattern in `render()`.
