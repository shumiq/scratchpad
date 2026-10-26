# Notepad: autosave and restore

The text survives a reload without a save button.

**Depends on:** 02, 04
**Done when:** reload restores the exact text, and a failed write shows a visible warning instead of losing the edit.

- [ ] Debounced write (~300ms after the last keystroke) through `src/lib/storage.ts` under `scratchpad:v1:notepad`; no write per keystroke.
- [ ] Restore in `onMount`, and apply the stored text only while the editor is still untouched — text typed before hydration finishes is never overwritten.
- [ ] Flush the pending write on `pagehide` / `visibilitychange`, so closing the tab right after typing keeps the last words.
- [ ] A failed write (`save` returns `{ ok: false }`) raises a persistent inline warning with its reason; the text stays in the editor and nothing is cleared.
- [ ] Check: type, reload → identical text; type, close the tab within 300ms, reopen → last words kept; stub a quota failure → warning visible, text intact.
- [ ] `bun run build` passes.
