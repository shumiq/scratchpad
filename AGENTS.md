# AGENTS.md

## Project

Personal scratch pad web app: fast, client-side utility tools. All user data lives in
`localStorage` — no accounts, backend, or database. Performance is the main requirement:
open and start typing/pasting immediately, so avoid heavyweight dependencies.

Product spec: `artifacts/INDEX.md` (links DESIGN.md and ARCHITECTURE.md). The route
foundation is implemented (`/`, `/table`, `/image`, each lazily loaded); the tool UIs
are still stubs.

## Commands

Uses bun (`bun.lock`); Node >= 24.

```bash
bun install
bun run dev       # vite dev
bun run build     # vite build -> .output
bun run start     # run built server
bun run lint      # oxlint
bun run format    # oxfmt, writes in place
```

Pre-commit (husky) runs lint-staged: `oxlint --fix` + `oxfmt` on staged JS/TS, `oxfmt` on
staged json/css/html/md/yaml. There is no test, typecheck, or CI config; `bun run build`
is the only build verification — do not invent commands or add tooling unless asked.

Tool permissions are enforced by OpenCode, not by this file: if a call is denied, stop and
report it — never retry the same action in another form.

## Structure

- `src/routes/` — file-based routes; `[...404].tsx` is the catch-all.
- `src/app.tsx` — router shell (Nav + Suspense). `src/entry-server.tsx` owns the HTML
  document/SSR; `src/entry-client.tsx` hydrates.
- `~/*` maps to `src/*` (`tsconfig.json`).
- `src/app.css` — Tailwind v4 via `@import "tailwindcss"`; there is no
  `tailwind.config.js`, so use v4 CSS-first configuration.
- `.husky/pre-commit` — runs `bunx lint-staged`; config lives in `package.json`.

## Gotchas

- SSR is on: `localStorage`, `window`, and clipboard APIs must only run client-side
  (`onMount` or `import.meta.env.SSR` guard). Keep persistence in one module so this is
  handled once.
- localStorage is the only copy of user data and is per-origin (~5 MB quota). Never
  clear or overwrite stored keys destructively; evolve stored data with a stable,
  versioned key/schema.
- Directory is a git repo; husky hooks live in `.husky/` (only `pre-commit` is tracked).
