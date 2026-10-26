# Notepad: autosave

**Depends on:** 02-persistence, 04-notepad-editor
**Done when:** reload restores the text; typing does not write on every keystroke.

- [ ] Debounced write (~300ms) through the persistence module.
- [ ] Restore on mount without clobbering text typed before hydration finishes.
- [ ] A failed write shows a visible warning, not a silent loss.
