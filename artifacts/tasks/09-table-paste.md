# Table Pad: paste pipeline

**Depends on:** 08-table-grid
**Done when:** pasting from Excel, Sheets, a CSV file, a TSV block, a markdown table and a web page table all land as a grid.

- [ ] Read all clipboard flavours on paste.
- [ ] Prefer an HTML table when present, else parse plain text as TSV, CSV, then markdown table.
- [ ] Record detection rules in `wiki/table-pad.md`, including how ragged rows are treated.
- [ ] A single-cell paste without delimiters goes into the cell as text, not a new grid.
