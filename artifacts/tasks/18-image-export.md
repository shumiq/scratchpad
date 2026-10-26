# Image Pad: export PNG/JPG

**Depends on:** 15
**Done when:** the current image downloads as `.png` and as `.jpg` at the size shown on the canvas.

- [ ] Encode with `canvas.toBlob` at full resolution: PNG for the current pixels, JPG at quality 0.9.
- [ ] JPG flattens transparency onto white, or it exports black.
- [ ] Download through a temporary object URL, named from the pasted file or `image-<timestamp>`; revoke the URL after the click.
- [ ] Export reflects every applied op (rotate, flip, crop, resize), never the original.
- [ ] Check: export both formats and open them — dimensions and orientation match the canvas; a transparent PNG exported as JPG has a white background; exporting right after a crop gives the cropped size.
- [ ] `bun run build` passes.
