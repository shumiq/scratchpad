# Image Pad: save within the size limit

The working image persists unless it would blow the quota, and that is always visible.

**Depends on:** 02, 14
**Done when:** a reload restores the working image, and an image above 2 MB encoded keeps working in memory with a visible "not saved" state instead of a failed write.

- [ ] Encode the working image as a PNG data URL and save it under `scratchpad:v1:image` through `src/lib/storage.ts`, debounced after an edit.
- [ ] Compare `encodedSize()` with one `IMAGE_LIMIT` constant (2 MB): over the limit, write nothing and keep the image in memory.
- [ ] State both outcomes in the UI — "saved" versus "not saved — over 2 MB, lost when you leave or reload"; never an empty `catch`.
- [ ] Restore on mount by decoding the stored data URL; a corrupt or oversized stored value falls back to the empty state with a notice, and the key is not deleted.
- [ ] Check: paste a small image, rotate it, reload → same pixels; paste a >2 MB screenshot → the badge shows, editing still works, reload → empty pad with the notice; corrupt the stored value → empty pad, no crash.
- [ ] Check: with an over-limit image open, navigating to another tool and back gives an empty pad — matching what the badge promised — not a half-restored image.
- [ ] `bun run build` passes.
