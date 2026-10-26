# Image Pad

Paste an image, touch it up, take it back out.

## In

Paste an image from the clipboard.

## Edit

- Rotate 90°, each direction
- Flip horizontal / vertical
- Crop
- Resize
- Undo / redo (small in-memory stack of operations; reload starts clean)

## Out

- Export as `.png` or `.jpg`
- Copy to clipboard

## Persistence

- The working image is saved as a PNG data URL in `localStorage`, debounced after
  every edit, and restored on load.
- The save is capped at 2 MB. A larger image keeps working in memory but the pad
  shows "Not saved — over 2 MB, lost when you leave or reload", and nothing is
  written.
- A corrupt or oversized stored value is ignored: the pad starts empty with a
  notice, and the stored key is not deleted.

## Open questions

- None currently; the crop box, JPEG export quality and undo history are settled.
