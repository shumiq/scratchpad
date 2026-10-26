# Image Pad: resize

**Depends on:** 15
**Done when:** an explicit width and height produce exactly that pixel size, and an extreme upscale warns before it happens.

- [ ] Width and height inputs share a locked aspect ratio by default; unlocking allows a distorted resize.
- [ ] Confirm pushes `resize:w,h` onto the op list (undoable); the output canvas is exactly the requested integer size.
- [ ] Anything over 2× the source dimensions shows a one-line warning with a proceed choice — it warns, never silently blocks.
- [ ] Check: 800×600 → width 400 → exactly 400×300; unlock → 400×600 holds; a 100×100 image to 800×800 → warning, confirm gives 800×800; undo restores both the inputs and the canvas.
- [ ] `bun run build` passes.
