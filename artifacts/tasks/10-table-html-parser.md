# Table Pad: HTML table parser hardening

Real-world web tables land as a predictable rectangle.

**Depends on:** 09
**Done when:** tables with merged cells, nested markup and empty rows produce a sane rectangle, and a layout table is rejected instead of becoming a bogus grid.

- [ ] Parse with `DOMParser` (client only, guarded); no third-party HTML parser.
- [ ] `colspan`/`rowspan` expand into the cells they cover by repeating the value, so the grid stays rectangular; short rows pad with `""` and trailing empty rows/columns are dropped.
- [ ] Nested markup reduces to text, with `<br>` and block boundaries collapsed to a single space (a cell never gains a newline this way).
- [ ] A table with no data cells, or one marked `role="presentation"`, is not treated as data — fall back to the plain-text flavours of the same paste, or the hint.
- [ ] Check: a table with a merged header row → the header value repeats across its columns; a cell with `<b><a href>text</a></b>` → `text`; a 1×1 layout table → hint, not a 1×1 grid.
- [ ] Check: a table with ten trailing empty `<td>`s does not create ten empty columns.
- [ ] `bun run build` passes.
