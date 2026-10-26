# Image Pad: storage size limit

**Depends on:** 02-persistence, 14-image-paste
**Done when:** a huge image cannot quietly blow the quota.

- [ ] Check encoded size before saving; refuse over the limit with a clear message.
- [ ] Keep the image out of the save payload when it is too large; the rest of the tool keeps working.
- [ ] State the limit in `ARCHITECTURE.md` so the number lives in one place.
