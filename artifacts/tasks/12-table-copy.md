# Table Pad: copy a range as plain text

**Depends on:** 11
**Done when:** copying a selection pastes into Excel or Sheets as the same rectangle.

- [ ] Copy the selection; with nothing selected, copy the whole grid. A copy button plus `Ctrl/Cmd+C` while the grid (not a cell in text-edit mode) has focus.
- [ ] Cells joined with `\t`, rows with `\n`, no trailing tab or newline.
- [ ] Tabs and newlines inside a cell become a single space on copy, so the output stays rectangular (one-line comment where that happens).
- [ ] Write with `navigator.clipboard.writeText` (client only); when the API is missing or permission is denied, show a "copy unavailable" hint rather than failing silently.
- [ ] Check: a 2×2 block, one row, one column and the whole grid each paste into a spreadsheet as exactly that shape; a cell containing a line break still fills one cell; denied permission shows the hint.
- [ ] `bun run build` passes.
