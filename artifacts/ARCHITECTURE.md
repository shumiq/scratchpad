# Architecture

## Shape

Single-page app, all work done in the browser. There is no backend, no account, and no
database: `localStorage` is the only store, and therefore the only copy of the user's data.

## Performance

Speed is the requirement, not a nice-to-have — the app must open and accept a paste or a
keystroke immediately, like notepad or paint.

- No heavyweight dependencies; anything added to the bundle has to earn its place.
- No network calls on the hot path (startup, typing, paste).
- Load a tool only when it is opened.

## Storage

- One module owns all persistence, so SSR/browser guards and the key schema live in one place.
- Keys are stable and versioned; stored data is evolved, never cleared or overwritten
  destructively.
- `localStorage` is per-origin, roughly 5 MB, and synchronous.

## Platform constraints

- SSR is on, so `localStorage`, `window`, and clipboard APIs are client-only
  (`onMount`/`import.meta.env.SSR` guard).
- Clipboard write of plain text is broadly supported; image paste/copy depends on the browser
  and needs a fallback path (e.g. download) where it is unavailable.

## Risks

- Images in `localStorage` can exhaust the ~5 MB quota quickly; image data needs an explicit
  size limit and a clear failure message rather than a silent write that fails.
