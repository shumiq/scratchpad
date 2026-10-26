# Table Pad: grid model and editable cells

A rectangular store of plain-text cells with an editable grid.

**Depends on:** 03
**Done when:** every cell of a rectangular grid can be edited as plain text, and column widths fit their content without manual resizing.

- [ ] Model in `src/lib/table.ts`: rows of cells (`string[][]`); an empty cell is `""`, never `null`; every row is padded to the widest row so the grid is always rectangular.
- [ ] `src/routes/table.tsx` renders the model as a grid — one plain-text input per cell, edits commit to the model, no rich text, no formulas.
- [ ] Column widths auto-fit content (no drag handles); long values wrap inside the pane instead of widening the grid past the viewport.
- [ ] Tab/Shift+Tab and the arrow keys move between cells without leaving the grid.
- [ ] In memory only for now — saving is 13, so keep the model in one replaceable signal.
- [ ] Check: type into cells, Tab across a row and wrap into the next; a 20-column × 200-row grid scrolls inside its pane while the page still does not scroll.
- [ ] `bun run build` passes.
