# Foundation: persistence module

One module owns every `localStorage` read and write.

**Depends on:** nothing
**Done when:** all three tools go through `src/lib/storage.ts`, SSR never touches `localStorage`, and a failed write reaches the caller instead of being swallowed.

- [ ] `src/lib/storage.ts` exports `load<T>(key, fallback)` returning `{ value: T; corrupt: boolean }`, and `save(key, value)` returning `{ ok: true }` or `{ ok: false, reason: "quota" | "unavailable" | "invalid" }`.
- [ ] Browser access is guarded (`typeof window === "undefined"` / `import.meta.env.SSR`): on the server neither call touches storage and `load` returns the fallback.
- [ ] Keys are namespaced and versioned once, here: `scratchpad:v1:notepad`, `scratchpad:v1:table`, `scratchpad:v1:image`. Evolution adds or renames keys; nothing is deleted or blindly overwritten.
- [ ] `save` catches quota and serialisation errors and returns them (no empty `catch`); `load` returns the fallback with `corrupt: true` on unreadable JSON or an unrecognised shape, instead of throwing.
- [ ] `encodedSize(value)` (byte length of the serialised string) is exported here, so the image limit in 20 is computed in exactly one place.
- [ ] Check: put `{"` into a key → the tool shows its default, no crash; stub a throwing `setItem` → the caller receives `reason: "quota"` and the UI can warn; the server-rendered page loads with no `localStorage` access error.
- [ ] `bun run build` passes.
