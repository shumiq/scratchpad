# Foundation: routes and navigation

Three tool routes, the notepad on `/`, each tool's code loaded only when its own route opens.

**Depends on:** nothing
**Done when:** `/`, `/table` and `/image` each open their tool from the nav, and opening one tool never loads another tool's code.

- [ ] `src/routes/index.tsx` renders the notepad (the default tool); add `src/routes/table.tsx` and `src/routes/image.tsx`. One URL per tool — no `/note` alias for the index route.
- [ ] `src/components/Nav.tsx` links Notepad, Table Pad and Image Pad in place of Home/About, and marks the active route.
- [ ] Remove the scaffold: delete `src/routes/about.tsx` and `src/components/Counter.tsx`, and drop the `/about` link from `src/routes/[...404].tsx` (keep that route and its Home link).
- [ ] Keep the other tools out of the entry chunk: no static import of the table or image route module from `src/app.tsx`, the nav, or `index.tsx`.
- [ ] Check: `bun run dev`, open each route from the nav; in the Network panel, opening one tool does not load another tool's route code, and no tool makes a fetch/XHR for its data.
- [ ] Check: `/nope` still renders the 404 route and its link back works.
- [ ] `bun run build` passes.
