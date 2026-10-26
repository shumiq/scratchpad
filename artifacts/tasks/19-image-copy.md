# Image Pad: copy to clipboard

**Depends on:** 18
**Done when:** the result pastes as an image into another app, and a browser that cannot do it gets a download plus a short explanation.

- [ ] Write a PNG blob with `ClipboardItem` from inside the click handler; clipboard writes need that user gesture.
- [ ] If `ClipboardItem` is missing, the context is not secure, or the write rejects, fall back to the PNG download from 18 and say why.
- [ ] No silent failure: every outcome (copied, fell back) is visible in the UI.
- [ ] Check: copy into a chat app and an image editor → the image pastes; deny clipboard permission → the download happens and the message explains it; open the app over plain `http://` on a LAN address → the fallback path runs.
- [ ] `bun run build` passes.
