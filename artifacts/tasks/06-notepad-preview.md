# Notepad: markdown preview

The same document rendered as markdown beside the editor.

**Depends on:** 04
**Done when:** the preview shows the current text rendered, next to the editor from 1024px up, and typing stays responsive.

- [ ] Add one small markdown renderer — bundle size matters, so no editor framework and no syntax highlighting.
- [ ] Raw HTML in the source is escaped, so `<script>` or `<img onerror=…>` typed into the note renders as text; links allow only `http`, `https` and `mailto`.
- [ ] The preview re-renders from the editor's text on change, throttled (~150ms) so fast typing is never blocked; one source of truth, no second buffer.
- [ ] Layout: at `lg` (1024px) and wider, editor and preview sit side by side with independent scrolling.
- [ ] Check: headings, lists, bold, inline code, fenced code and links render; the injection strings above appear as text; a 300-line document previews with no visible lag while typing.
- [ ] Check: after a paste, a select-all delete and a very long single line, the preview still matches the editor.
- [ ] `bun run build` passes.
