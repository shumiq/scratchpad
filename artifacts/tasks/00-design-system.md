# Design system: Flip7 tokens and shell restyle

Turn DESIGN.md into Tailwind v4 tokens and restyle the shell, 404 and stub pages so the app stops looking like the scaffold.

**Depends on:** 01, 03
**Done when:** `src/app.css`, `src/components/Nav.tsx`, `src/routes/[...404].tsx`, `src/routes/table.tsx` and `src/routes/image.tsx` use the Flip7 tokens, no scaffold `sky-*`/`gray-*` classes remain in those files, and no page-level scrollbar appears at 320px or 1920px.

**For 04–20:** this task supersedes task 03's scaffold visual direction; style all new UI only with these tokens and DESIGN.md's component patterns (pill buttons, cream inputs, glow shadows, dashed section titles). `src/routes/index.tsx` is out of scope (04 owns it).

- [ ] `src/app.css`: one comment states the web mapping — `2rpx = 1px`, and interactive/tap targets stay ≥ 44px because DESIGN.md's 72rpx (36px) is smaller.
- [ ] Palette as `@theme` `--color-*`: `primary` #2BA8A2, `primary-light` #3CC4BD, `primary-dark` #1E8C86, `primary-bg` #E8F6F5, `gold` #FFD23F, `gold-light` #FFE47A, `gold-dark` #E6B800, `coral` #EF6C4A, `coral-light` #FF8A6A, `coral-dark` #D45233, `cream` #FFF8E7, `sky` #5DADE2, `surface` #EFF8F7, `card` #FFFFFF, `success` #27AE60, `error` #E74C3C.
- [ ] Base layer: page background `surface`, card surfaces `card`, ink `primary-dark`, inputs `cream`; `html, body, #app` stay viewport-sized with `overflow: hidden` and `#app` stays `100dvh` from 03.
- [ ] Radius tokens `--radius-sm|md|lg|xl|round` = 4/8/12/16/9999px (8/16/24/32/999rpx).
- [ ] Shadow tokens `--shadow-sm|md|lg` (0 1px 4px, 0 2px 8px, 0 4px 16px black at 8/12/16%) plus `card` (teal 10%), `coral-glow`, `teal-glow`, `accent-glow` (gold 40%) at 0 2px 10px, `sky-glow` at 0 2px 8px, `focus` (0 0 0 2px primary 15%); no plain-black shadow on interactive elements.
- [ ] Type tokens `--text-display|h1|h2|h3|body|caption|micro` = 36/24/18/16/14/12/10px (72/48/36/32/28/24/20rpx); `--font-sans` is DESIGN.md's body stack; headline style available as `--font-weight-headline` 800 + `--tracking-headline` 2px. Do not redefine Tailwind's `text-sm`/`text-xs`; `caption`/`micro` are the 24rpx/20rpx names.
- [ ] `--ease-bounce` token (cubic-bezier back-out) used for hover/active transitions, all ≤ 500ms.
- [ ] Delete the `prefers-color-scheme: dark` block and the `--background-rgb`/`--foreground-rgb` indirection — one fixed palette, no dark theme.
- [ ] `src/components/Nav.tsx`: keep the three links and active-route logic, keep the existing fixed 56px height and `shrink-0` (do not make it `position: fixed`); teal (`primary-dark`) background, cream labels, hover `primary-light`, active link marked with gold underline **and** `aria-current="page"` so it is not colour-only; every link is a ≥ 44px target, focus-visible gold outline.
- [ ] `src/routes/[...404].tsx`: keep the catch-all and the working link to `/`; headline style + `caption` copy in palette colours, and Home as a pill button (44px min height, `radius-round`, `primary-dark` on cream or cream on `primary-dark` for contrast) with a visible `focus-visible` outline.
- [ ] `src/routes/table.tsx` and `src/routes/image.tsx`: page `surface`, `h1` in headline style, `caption`/`body` placeholder line, and a 2px dashed `primary`/`primary-bg` divider under the title. No new behaviour, no game screens (BOOM, scoring cards, rankings, Flip7 logo).
- [ ] No new dependencies, no routing/storage changes, no edits to `src/routes/index.tsx`.
- [ ] Check: no scaffold utility classes remain — `rg "sky-[0-9]|gray-[0-9]|--background-rgb|--foreground-rgb|prefers-color-scheme"` over `src/app.css`, `src/app.tsx`, `src/components/Nav.tsx`, `src/routes/[...404].tsx`, `src/routes/table.tsx`, `src/routes/image.tsx` returns nothing. The required `--color-sky` / `--shadow-sky-glow` tokens are palette tokens, not scaffold classes.
- [ ] Check: at 320px and 1920px wide, `document.scrollingElement.scrollHeight` equals `clientHeight` on `/`, `/table`, `/image` and a bogus URL; the 404 renders inside 320px without sideways scroll.
- [ ] Check: keyboard Tab through nav and the 404 pill shows a visible outline and correct `aria-current`; no contrast claim below DESIGN.md's token set (primary-dark on surface is ~3.8:1, so keep body copy at readable sizes rather than inventing a darker ink).
- [ ] `bun run build` passes.
