# Table Pad: paste from the clipboard

Paste a table and get an editable grid, or a short hint when it is not tabular.

**Depends on:** 08
**Done when:** a range from Excel or Sheets, a CSV/TSV block and a markdown table each land as a rectangular grid of the same shape.

- [ ] Paste handler on the grid (client only) reads every flavour the event's `clipboardData` offers.
- [ ] Source choice: when `text/html` contains a `<table>`, parse its rows and cells; otherwise parse `text/plain` as TSV, then CSV, then a markdown table (a `|---|` delimiter row).
- [ ] A multi-cell paste replaces the pad's contents — one table per pad — rather than splicing a second table into the first.
- [ ] A paste that yields one cell (no delimiter, no table) goes into the focused cell, or the first cell when none is focused, and never replaces the grid; a non-tabular paste shows the hint instead of an error.
- [ ] Simple tables only here; merged cells, nested markup and layout tables are 10.
- [ ] Check: by hand, paste an Excel range, a Sheets range, the text of a `.csv`, a tab-separated block, a markdown table and a page table — each becomes a grid of the source shape; paste one word → it stays in its cell.
- [ ] `bun run build` passes.
