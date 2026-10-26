# Persistence module

One module owns every `localStorage` read and write.

**Depends on:** nothing
**Done when:** all three tools store data through it, and a full quota or corrupt value never loses data silently.

- [ ] `src/lib/storage.ts` exporting `load(key, fallback)` and `save(key, value)`.
- [ ] Browser access guarded so SSR never touches `localStorage`.
- [ ] Keys namespaced and versioned, e.g. `scratchpad:v1:notepad`.
- [ ] `save` catches quota and serialization errors and surfaces them to the caller (no empty `catch`).
- [ ] A missing or unrecognised stored shape falls back to the default instead of throwing.
