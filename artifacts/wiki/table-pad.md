# Table Pad

Moving tables between apps without a formatter getting in the way.

## In

Paste a table copied from anywhere and it becomes an editable grid:

- spreadsheet cells (Excel, Google Sheets)
- CSV
- TSV (tab-separated)
- markdown table
- HTML table

Column widths auto-fit the content. Cells behave as plain text.

## Out

Select any rectangular range — the whole table, a 2x2 block, a single row — and copy it as
plain text: tab between cells, newline between rows, so it pastes straight into another
spreadsheet.

## Non-goals

No formulas, no formatting, no styling, no sorting/filtering, no data types.
Plain text in, plain text out.

## Open questions

- How the source format is detected when the clipboard holds several representations
  (HTML + plain text is the common case).
- Whether a paste with ragged row lengths pads, trims, or keeps the shape as-is.
