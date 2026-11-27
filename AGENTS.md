# DevPulse conventions

- Current scope: milestones 1–5, including final polish and verification. Task/project management and derived insights are authorized. Do not add import/export, authentication, or services without authorization.
- Use React, strict TypeScript, Vite and plain CSS. Keep runtime dependencies minimal; no UI framework or global state library.
- Keep components focused. UI belongs in `components/`, application orchestration in `app/`, pure domain functions and storage boundaries in `lib/`, types in `types/`.
- Reducers and selectors are pure. Do not read storage, generate timestamps, or mutate inputs inside them. Never persist derived statistics.
- All persisted data crosses runtime validation. Unsupported/corrupt data must enter recovery without automatic replacement. Seed samples only for an absent storage key.
- Route all storage access through the adapter. Preserve existing data on failure; show actionable errors. Explicit reset is destructive and requires acknowledgment.
- Use semantic HTML, labeled controls, visible keyboard focus, sufficient contrast, and responsive layouts. Use CSS tokens and support light/dark/system themes.
- Prefer descriptive names and small functions. Avoid speculative abstractions, duplicate logic, and unsafe type assertions.
- Add focused tests for changed behavior. Before handoff run `npm run check` and report actual results and verification limits.
- Keep changes within this repository. Never add secrets or personal data. Do not commit, push, deploy, or access external accounts unless explicitly requested.
