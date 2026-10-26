# Table Pad: autosave and restore

The grid survives a reload, closing the data-loss gap left open by 08.

**Depends on:** 02, 08
**Done when:** reload restores the grid exactly, and a failed write warns instead of losing the table.

- [ ] Debounced save (~300ms) of the model under `scratchpad:v1:table` through `src/lib/storage.ts`; typing in a cell does not write per keystroke.
- [ ] Restore on mount, before the grid becomes editable, so the first edit applies to the restored grid rather than an empty one.
- [ ] An unrecognised or corrupt stored shape (`corrupt: true` from `load`) falls back to an empty 1×1 grid plus a short notice, without clearing the stored key.
- [ ] A failed save shows a persistent inline warning with its reason; the grid stays editable.
- [ ] Check: edit a 5×5 grid, reload → identical; corrupt the stored value → empty grid plus notice, no crash; stub a quota failure → warning with the grid intact.
- [ ] `bun run build` passes.
