# Image Pad: edit pipeline with rotate, flip and undo

Edits are operations replayed on the original, with a 10-step undo.

**Depends on:** 14
**Done when:** rotate ±90° and both flips chain without quality loss, and the last 10 operations can be undone and redone.

- [ ] Represent edits as an op list (`rotate:90`, `rotate:-90`, `flip:h`, `flip:v`) replayed on the original decoded image and rendered once per change — never transform an already-transformed canvas.
- [ ] Canvas dimensions follow rotation (width/height swap at 90°); flips keep them; the size readout updates after each op.
- [ ] Buttons for rotate left, rotate right, flip horizontal, flip vertical.
- [ ] Undo/redo over the op list: a new op truncates the redo branch, history caps at 10 (one constant with a one-line comment), buttons disable at either end, `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z` work while the pad is focused.
- [ ] History is memory only — it is not persisted, so a reload starts clean (one-line comment).
- [ ] Check: rotate right four times → the original image and size; undo three, redo one, then rotate → the redo branch is gone; eleven ops → the oldest drops and undo stops at the first kept op; `Ctrl+Z` matches the button at each step.
- [ ] `bun run build` passes.
