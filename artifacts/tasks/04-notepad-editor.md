# Notepad: editor with line numbers

A full-height text editor with a gutter that tracks its lines.

**Depends on:** 03
**Done when:** one number per logical line stays aligned with its text while typing, wrapping and scrolling.

- [ ] `src/routes/index.tsx` renders a full-height monospace textarea that is focused on open, so the first keystroke lands in the document.
- [ ] Gutter numbers come from the same string the textarea renders — one number per `\n`-separated line, no separate line-count state that can drift.
- [ ] Wrapped lines: the number sits on the line's first visual row and the rows it covers stay blank; vertical and horizontal scroll offsets are mirrored from the textarea.
- [ ] Check: paste a 5,000-line text file, jump to the middle, scroll to the end — numbers match their lines and never drift; a 200-word paragraph wraps under a single number.
- [ ] Check: the 5,000-line paste lands in about a second and typing is responsive straight after; typing on the first line does not move the gutter.
- [ ] `bun run build` passes.
