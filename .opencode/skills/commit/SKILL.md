---
name: Commit
description: Commit the work, first bringing AGENTS.md, artifacts/INDEX.md, artifacts/DESIGN.md, artifacts/ARCHITECTURE.md and artifacts/wiki/ back in line with the code. Run it automatically whenever work is ready to commit, without asking for confirmation.
---

# Commit

These docs are loaded as agent instructions, so a stale one actively misleads the next
session. Sync docs and commit in one step, in this order. Run it straight through: no
questions, no confirmation prompts, no waiting for approval.

## 0. Setup

- Not a git repository yet: `git init` it yourself, and fix the "not a git repo" line in
  `AGENTS.md` in the same commit.
- Run `git status` and `git diff` (staged and unstaged). Read the diff; do not infer it from
  the commit message.

## 1. Find the docs the diff made stale

Only touch the files the change actually affects:

| Change                                                   | Doc                                                    |
| -------------------------------------------------------- | ------------------------------------------------------ |
| Tool behavior, what it does or refuses to do             | `artifacts/wiki/<tool>.md`, resolve its open questions |
| Storage, perf, SSR/clipboard, dependency or build change | `artifacts/ARCHITECTURE.md`                            |
| Color, spacing, type, component look                     | `artifacts/DESIGN.md`                                  |
| A doc added, removed or renamed                          | `artifacts/INDEX.md` (its links)                       |
| Command, directory layout, project constraint            | `AGENTS.md`                                            |

## 2. Rewrite only what is now false

- State what the code does now, not what it was supposed to do.
- No restating code, no changelog inside docs, no "coming soon" bullets that duplicate
  `artifacts/tasks/`.
- A decision made while coding (e.g. ragged paste rows, JPEG quality, renderer choice)
  replaces the matching open question in the wiki.
- Feature not finished: leave the wiki describing intent, keep the task unticked.

## 3. Tasks

- Code for a task is complete and `bun run build` passes: tick it in its `tasks/NN-*.md` and in
  `tasks/README.md`.
- Anything newly deferred gets a new task file rather than a paragraph in a doc.

## 4. Check before committing

- [ ] No doc claims a feature that is not in the code.
- [ ] Every relative link in `INDEX.md` and `tasks/README.md` resolves.
- [ ] `AGENTS.md` gotchas still true (it currently says the directory is not a git repo — if
      the commit is the first one, fix that line).
- [ ] `bun run build` passes, if code changed.

## 5. Commit

- Commit as soon as the checklist above passes. Do not ask, do not propose the message for
  review first.
- Stage the code and the doc updates together; a doc out of sync with its commit is the bug
  this skill exists to prevent.
- Subject in the imperative, one line, no type prefix: `add notepad line gutter`.
- Body only when the why is not obvious from the diff.
- No `--no-verify`, no force push, no `git add -A` without checking the file list first.
