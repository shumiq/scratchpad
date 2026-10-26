# Page frame

Shared layout so every tool fills the window.

**Depends on:** 01-routes
**Done when:** the page never scrolls; only the tool's own content area does.

- [ ] Header with nav + one full-height work area.
- [ ] `html, body, #root` sized to the viewport, no page-level overflow.
- [ ] Route swap causes no layout shift (Suspense fallback reserves the same space).
