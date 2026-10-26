# AGENTS.md

## Project

Personal scratch pad web app: fast, client-side utility tools. All user data lives in
`localStorage` — no accounts, backend, or database. Performance is the main requirement:
open and start typing/pasting immediately, so avoid heavyweight dependencies.

Product spec: `artifacts/INDEX.md` (links DESIGN.md and ARCHITECTURE.md). All three tools
(Notepad, Table Pad, Image Pad) are implemented and all spec tasks have passed review. All
UI follows DESIGN.md's tokens in `src/app.css`.

Tool permissions are enforced by OpenCode, not by this file: if a call is denied, stop and
report it — never retry the same action in another form.

## Agent Workflow

**Default behavior: spawn subagents.** Do not answer directly or write code yourself if a subagent can do it.
**Plan first.** For any non-trivial request, launch `planner` to produce tasks before execution.

| Request type                         | Action                                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| "Plan X" / ambiguous / multi-step    | Spawn `planner` to create task files in `artifacts/tasks/`      |
| "Implement X" / concrete code change | Spawn `developer` to implement one task from `artifacts/tasks/` |
| "Review X" / "Does this pass?"       | Spawn `reviewer` to verify against acceptance criteria          |
| Explore/understand codebase          | Spawn `explore` (quick/medium/very thorough)                    |
| Complex research / multi-step        | Spawn `general`                                                 |

**Never** edit source files directly as the leader agent. The leader's only job is to dispatch subagents and coordinate.

### Delivery Loop (Leader)

1. Read `artifacts/tasks/`, `AGENTS.md`, `artifacts/INDEX.md`, `artifacts/ARCHITECTURE.md`. Order tasks by `Depends on:`.
2. For each task:
   - Launch `developer` with the task file path and acceptance criteria
   - On done, launch `reviewer` with criteria and diff
   - On PASS: reviewer commits, deletes task file, corrects docs
   - On FAIL: send findings back to developer (max 2 round-trips)
3. Confirm docs corrected, task deleted, commit made.
4. Report: tasks done, commits made, anything failing.

**Rules:**

- Shell allowlisted to `git status|diff|log|add|commit` and `bun run typecheck|lint`
- `bun run dev|start|preview` globally denied — ask user to start server
- 1 subagent depth only — `planner`, `developer`, `reviewer` cannot launch agents
- Never edit source files or commit yourself; never push

## Commands

Uses bun (`bun.lock`); Node >= 24.

```bash
bun install
bun run dev       # vite dev (user-only — agents denied via opencode.jsonc)
bun run build     # vite build -> .output
bun run start     # run built server (user-only — agents denied via opencode.jsonc)
bun run lint      # oxlint
bun run typecheck # tsc --noEmit
bun run format    # oxfmt, writes in place
```

Pre-commit (husky) runs `bun typecheck`, then lint-staged: `oxlint --fix` + `oxfmt` on
staged JS/TS, `oxfmt` on staged json/css/html/md/yaml. There is no test or CI config;
`bun run build`, `bun run typecheck` and `bun run lint` are the checks — do not invent
commands or add tooling unless asked.

## Structure

- `src/routes/` — file-based routes; `[...404].tsx` is the catch-all.
- `src/app.tsx` — router shell (Nav + Suspense). `src/entry-server.tsx` owns the HTML
  document/SSR; `src/entry-client.tsx` hydrates.
- `~/*` maps to `src/*` (`tsconfig.json`).
- `src/app.css` — Tailwind v4 via `@import "tailwindcss"`; there is no
  `tailwind.config.js`, so use v4 CSS-first configuration. The design tokens
  (`--color-*`, `--radius-*`, `--shadow-*`, `--text-*`, `--ease-bounce`) live here.
- `artifacts/DESIGN.md` — the visual design system: palette, typography, spacing,
  radii, colored-glow shadows and component patterns. All UI follows it. Its WeChat
  `rpx` values map at `2rpx = 1px` on the web; interactive targets stay at least 44px.
  The Flip7 game-specific screens (logo, BOOM button, scoring cards, victory rankings)
  are reference patterns, not screens for this app.
- `.husky/pre-commit` — runs `bun typecheck` then `bunx lint-staged`; config lives in
  `package.json`.

## Gotchas

- SSR is on: `localStorage`, `window`, and clipboard APIs must only run client-side
  (`onMount` or `import.meta.env.SSR` guard). Keep persistence in one module so this is
  handled once.
- localStorage is the only copy of user data and is per-origin (~5 MB quota). Never
  clear or overwrite stored keys destructively; evolve stored data with a stable,
  versioned key/schema.
- Directory is a git repo; husky hooks live in `.husky/` (only `pre-commit` is tracked).
- **Agents cannot start servers**: `bun run dev|start|preview` are globally denied in `opencode.jsonc`. The leader will ask you to start `bun run dev` when a browser check is needed.
