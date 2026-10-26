# Table Pad: HTML table parser

**Depends on:** 09-table-paste
**Done when:** tables with merged cells and nested markup produce a sane rectangle.

- [ ] Parse with `DOMParser`, no third-party parser.
- [ ] Handle `colspan`/`rowspan` (expand into the covered cells or pad, decide once and document it).
- [ ] Strip nested markup to text, keep line breaks inside a cell sane.
- [ ] Ignore layout tables (`role="presentation"` / empty) if simple to detect.
