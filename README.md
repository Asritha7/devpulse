# DevPulse

A calm, browser-local developer workspace for the OpenAI Codex workshop.

## Current scope

Milestones 1–4: responsive dashboard, light/dark/system appearance, full task and project management, derived productivity insights, validated local storage, sample data and recovery handling.

Tasks support descriptions, priorities, due dates, project assignment, editing, completion/reopening and confirmed deletion. Search (titles and descriptions), status, priority and project filters combine with AND; clear filters resets all four. Project creation, renaming and confirmed deletion are available. Deleting a project keeps its tasks under No Project.

Project progress, total/open/completed/overdue counts and seven-day completion activity are calculated from current tasks. The chart includes a daily-count table. Reopening/deleting a task updates these values immediately. Dialogs use native modal focus containment, Escape dismissal and focus return. JSON import/export remains out of scope.

## Run locally

Use Node.js **22.20.0 or newer** and npm. Development was verified with Node 22.20.0 and npm 11.13.0. Vite 7 requires Node 20.19+ or 22.12+ ([official guide](https://vite.dev/guide/)). All direct dependencies are pinned; `.npmrc` enforces package engine requirements and keeps npm's cache inside the workspace.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173`). Use a consistent origin: browser storage is different for `localhost`, `127.0.0.1`, and different ports.

```sh
npm run typecheck
npm run lint
npm test
npm run build
# Or run all checks:
npm run check
# Inspect the production output locally:
npm run preview
```

The build output is `dist/`. No server, database, credentials or paid APIs are required. The app uses system fonts and inline SVG icons with no external runtime requests.

## Architecture

```text
src/
  app/                 Provider, reducer and application composition
  components/
    layout/            Sidebar, header and theme controls
    ui/                Icons and recovery presentation
    tasks/             Task forms, filters and management
    projects/          Project management and progress
    insights/          Statistics and accessible activity chart
  hooks/               System-aware theme effect
  lib/                 Validation, storage, sample data, dates and selectors
  types/               Persisted domain types
  styles/              Tokens, global rules and responsive dashboard styles
```

React context and `useReducer` keep this small app understandable without a state library. The provider owns initialization, persistence and storage notifications; the reducer is pure and handles hydration, preferences and persistence status. Task/project mutations validate the resulting workspace before updating state and are disabled during storage conflicts. Selectors calculate counts, overdue tasks, project progress and seven-day completion activity on demand; these values are never persisted. Calendar-dependent views refresh every 30 seconds and when returning focus to the browser.

The storage adapter accepts an injectable storage interface, allowing failure and conflict tests without browser globals. Validation is handwritten to avoid an extra runtime dependency. It checks exact fields, schema version, enums, text limits, unique IDs, references, valid calendar dates, canonical timestamps and completion chronology. Future schema changes need explicit migrations; unknown fields and versions are rejected rather than discarded.

## Data and recovery

- Storage key: `devpulse.workspace`; current schema: `1`.
- Records: tasks, projects and theme preference. Due dates are local calendar strings (`YYYY-MM-DD`); event timestamps are UTC ISO strings.
- A missing key is seeded once with fictional sample projects/tasks, dated relative to first launch. Existing data, including a valid empty workspace, is never reseeded.
- Corrupt or unsupported content opens recovery without writing to storage. Reload is safe. Reset requires an explicit checkbox acknowledgment and replaces only the DevPulse key with an empty workspace.
- If you need to preserve invalid data before reset, copy the raw key value using browser developer tools. JSON export/import is not implemented.
- Blocked/full storage shows a visible warning and allows session-only workspace changes with an explicit retry. Initial blocked access uses an empty workspace because the app cannot know whether existing saved data is present.
- Saves compare the current storage value with the loaded snapshot. Cross-tab changes suspend writes and request reload. This is a single-active-editor app: localStorage has no atomic compare-and-set, so simultaneous writes in separate tabs are not transactionally coordinated.
- This is local persistence, not a backup or encryption mechanism. Browser/site data clearing removes saved data.

## Verification

Vitest covers reducer transitions, immutable theme updates, failed saves/retries, derived statistics, date boundaries, schema validation, corrupt data preservation, explicit reset, quota errors and stale writes. Tests use a fixed clock and injected storage; the application uses no testing dependency at runtime.

Run `npm run check` for strict TypeScript, lint, tests and the production build. The release review passed all 55 tests, including storage event handling and contrast calculations for both themes.

Chrome verification covered task creation, editing, completion, reopening, search, project creation, live counts and focus return. Initial form focus was corrected afterward and still needs a browser retest. A previous Chrome smoke check verified theme persistence after reload. Remaining release checks include task deletion, project rename/deletion, combined filters, persistence of edited records, keyboard focus visibility and storage recovery/conflicts in the browser.

Manual inspection checklist:

1. Open the app at 390px, 768px and 1440px viewport widths; check wrapping and absence of horizontal scrolling.
2. Select light and dark themes, reload, and verify persistence. Select system and change the OS appearance.
3. Use only the keyboard: skip link, theme radios (arrow keys), visible focus and recovery controls.
4. In a **separate test browser profile/origin**, set `devpulse.workspace` to invalid JSON and reload. Confirm recovery appears and the bytes are unchanged until an acknowledged reset.
5. Reset the test workspace and reload; confirm it stays empty instead of receiving samples.
6. Open a second tab and change its theme; confirm the original tab asks to reload rather than overwriting it.

## Trade-offs and next step

No router, chart library, CSS framework, external fonts, or data-fetching layer is needed for this stage. Activity represents currently completed tasks, not an immutable audit log; reopening/deleting tasks will change historical counts. Browser-level persistence is scoped to one origin and one active editing tab. Modern browsers with localStorage and `matchMedia` are expected.

Milestones 3 and 4 are implemented. Next, perform the manual accessibility and responsive verification checklist, including task/project dialogs and filtering. Optional JSON import/export should be a separately authorized increment.
