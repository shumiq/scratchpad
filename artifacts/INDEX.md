# Scratch Pad — Spec Index

Personal scratch pad web app: a set of fast, client-side utility tools opened the way you'd
open notepad or paint — instant, no setup, no login. All data stays on the device in
`localStorage`.

**Status:** spec only. The code is still the untouched SolidStart + Tailwind scaffold.

## Tools

| Tool                           | Job                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------- |
| [Notepad](wiki/notepad.md)     | Write plain text with line numbers and a markdown preview.                   |
| [Table Pad](wiki/table-pad.md) | Paste any table from anywhere, edit it, copy a range back out as plain text. |
| [Image Pad](wiki/image-pad.md) | Paste an image, rotate/flip/crop/resize it, export or copy it.               |

## Where things live

- `wiki/` — what each tool does, and what it deliberately does not do.
- `tasks/` — the implementation breakdown, in order.
- `ARCHITECTURE.md` — app shape, storage, performance and platform constraints.
- `DESIGN.md` — visual design only (color, spacing, typography). Empty until the UI work starts.
