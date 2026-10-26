# Routes and navigation

One route per tool, each tool loaded only when opened.

**Depends on:** nothing
**Done when:** all three tools reachable from the nav, each in its own build chunk.

- [ ] Routes: `/` (notepad, default), `/note`, `/table`, `/image`; scaffold pages (about, counter) removed.
- [ ] Nav in `src/app.tsx` links the three tools.
- [ ] Each tool is a separate route module so Vite emits its own chunk (verify in build output).
- [ ] `bun run build` passes.
