# Notepad: narrow screens

On a phone the editor gets the full width and the preview is one tap away.

**Depends on:** 06
**Done when:** below 1024px only one pane is visible at a time, and the toggle switches panes without losing text or the caret.

- [x] Below `lg`, render one pane at a time, editor first; the preview is reached from a toggle next to the header.
- [x] The toggle states which pane is active, and switching back restores the caret to where it was.
- [x] Neither pane is re-created on toggle — the document is not reloaded, and autosave keeps working in both views.
- [x] Check: at 375px wide, opening the notepad shows the editor; toggle → the same text rendered; toggle back → caret restored, text unchanged; reload still restores everything.
- [x] `bun run build` passes.
