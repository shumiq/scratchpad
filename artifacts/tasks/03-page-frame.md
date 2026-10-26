# Foundation: page shell

A full-height layout where the active tool owns the viewport.

**Depends on:** 01
**Done when:** the page itself never scrolls at any window size; only the active tool's own panes scroll.

- [ ] Header (nav) with a fixed height plus one `flex-1` work area, in `src/app.tsx` or a small `src/components/Shell.tsx`; the work area is the only scroll container.
- [ ] `html`, `body` and `#app` (the mount node in `src/entry-server.tsx`) are viewport-sized (`100%` / `100dvh`) with `overflow: hidden`.
- [ ] The `Suspense` fallback reserves the work area's size, so switching routes causes no layout jump.
- [ ] Visual direction only: shared tokens live in `src/app.css` using Tailwind v4's CSS-first config (there is no `tailwind.config.js`). `DESIGN.md` is not a feature spec — no Flip7 screens or components.
- [ ] Check: at 320px and at 1920px wide there is no page scrollbar and no horizontal scroll, while the tool pane scrolls; switching routes keeps the header fixed.
- [ ] `bun run build` passes.
