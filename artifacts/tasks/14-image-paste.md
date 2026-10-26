# Image Pad: paste an image

**Depends on:** 03
**Done when:** an image on the OS clipboard appears on the canvas at its natural size, and a non-image paste gets a short hint.

- [ ] `src/routes/image.tsx` handles `paste` on the work area (client only) and takes the first `image/*` item from `clipboardData`.
- [ ] Decode with `createImageBitmap`, falling back to `Image` + object URL where it is missing; show natural width × height and draw 1:1 on a canvas.
- [ ] Non-image or empty clipboard → short hint ("Paste an image to start"), no error state, current image untouched.
- [ ] Pasting a new image replaces the current one and starts a fresh edit history.
- [ ] Check: paste a screenshot, an image copied from a browser page and one copied from a file manager; paste text → hint only; paste a second image → canvas and size readout update.
- [ ] `bun run build` passes.
