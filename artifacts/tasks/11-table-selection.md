# Table Pad: range selection

**Depends on:** 08
**Done when:** any rectangle — a cell, a 2×2 block, a row, a column, the whole table — can be selected and is visibly highlighted.

- [ ] Mouse drag from an anchor cell to another selects the rectangle between them; dragging back shrinks it.
- [ ] Row and column headers select that row or column; a top-left corner control, or `Ctrl/Cmd+A` while the grid is focused, selects every cell.
- [ ] The selection is clearly highlighted, the active cell stays visible while the grid scrolls, and the range is shown (e.g. `B2:C4`).
- [ ] `Escape` or a click outside the grid clears it; clicking a cell starts a new selection; the selection is not persisted.
- [ ] Check: each selection above, then drag past the pane edge (auto-scroll, clamped); reload → nothing selected.
- [ ] `bun run build` passes.
