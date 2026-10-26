# Image Pad: crop

**Depends on:** 15
**Done when:** dragging a region, or typing its numbers, and confirming leaves exactly that region; cancel changes nothing.

- [ ] Crop rectangle over the canvas: drag to draw, corner/edge handles to resize, clamped to the image bounds, staying in place when the pointer leaves the canvas.
- [ ] Numeric X/Y/W/H inputs mirror the rectangle in both directions, so cropping is usable from the keyboard.
- [ ] Confirm pushes `crop:x,y,w,h` onto the op list (undoable); cancel discards the rectangle and leaves the image untouched; a new image or an undo resets it.
- [ ] Coordinates are measured against the currently rendered image, so cropping after a rotation crops what is on screen.
- [ ] Check: crop a 100×50 corner, confirm → canvas is 100×50; undo → full image; type the same values → identical result; drag outside the canvas → the rectangle stays inside; cancel → unchanged.
- [ ] `bun run build` passes.
