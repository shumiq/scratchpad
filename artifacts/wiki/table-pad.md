# Table Pad

Moving tables between apps without a formatter getting in the way.

## In

Paste a table copied from anywhere and it becomes an editable grid:

- spreadsheet cells (Excel, Google Sheets)
- CSV
- TSV (tab-separated)
- markdown table
- HTML table

When the clipboard holds several representations, an HTML `<table>` wins; otherwise plain
text is tried as TSV, then a markdown table, then CSV. Multi-cell pastes replace the pad's
contents; a paste that yields one cell goes into the focused cell, or the first cell when
none is focused. Ragged row lengths are padded to the widest row.

Column widths auto-fit the content. Cells behave as plain text.

## Out

Select any rectangular range — the whole table, a 2x2 block, a single row — and copy it as
plain text: tab between cells, newline between rows, so it pastes straight into another
spreadsheet.

## Non-goals

No formulas, no formatting, no styling, no sorting/filtering, no data types.
Plain text in, plain text out.
