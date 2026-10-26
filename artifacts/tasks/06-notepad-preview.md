# Notepad: markdown preview

**Depends on:** 04-notepad-editor
**Done when:** the panel renders the current text as markdown, cheaply enough to keep typing smooth.

- [ ] Pick a small markdown renderer; record the choice in `wiki/notepad.md`.
- [ ] Preview updates with the editor text, throttled so typing stays smooth.
- [ ] Rendered HTML is not injected unsanitised from arbitrary input where it can bite (at minimum no `javascript:` links, no raw `<script>`).
