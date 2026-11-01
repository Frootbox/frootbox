# Previews of blocks

Every block and layout has a preview for the block picker. It lives in
the folder of the block, next to `views/`:

```
blocks/Hero/preview.svg          the block and its variant Default
blocks/Hero/preview.Split.svg    the variant Split
```

`.webp`, `.png` and `.jpg` work as well. Previews are never published to
`public/`: the core delivers them under `/previews/…` to those who may
arrange blocks. A theme replaces the preview of a block it overrides, like
a view: `overrides/<vendor>/<package>/blocks/Hero/preview.webp`.
`bin/frootbox blocks:check` warns about a block without a group or
preview and checks the format.

## Two kinds

- **General blocks** (base theme, start themes, modules) get a neutral
  SVG made from the pieces below. It shows how the block is built, not
  how it looks, and takes the colours of the theme it runs in.
- **Blocks of one project** get a screenshot of the design, cut to the
  block, as `preview.webp` in 16:10, e.g. 800×500.

## Rules for neutral SVGs

- `viewBox="0 0 320 200"` (16:10) and `id="preview"` on the root. The
  picker shows the file with `<svg><use href="…#preview"/></svg>`, so it
  inherits the CSS variables of the page.
- Paint only with `style="…"` attributes and the design tokens, each
  with the value of the base theme as a fallback, e.g.
  `style="fill:var(--color-primary,#1d4ed8)"`. Style sheets inside the
  file do not reach the picker.
- A margin of 24 on both sides. No real words, no photos, no fonts.
- One `<title>` naming the block in English, for when the file is opened
  on its own.

## Pieces

`kit.svg` shows them side by side.

| Piece | Shape | Paint |
|---|---|---|
| Background | the whole box | `--color-bg` |
| Heading | bar, 12–18 high, `rx="2"` | `--color-text` |
| Text line | bar, 6 high, 14 apart, `rx="2"` | `--color-muted` at `opacity:.45` |
| Button | 64×20, `rx:var(--radius,8px)`, label bar half as wide | `--color-primary`, label `--color-primary-contrast` |
| Second button | the same as an outline | stroke `--color-primary` |
| Image | box with sun and hill | `--color-surface`, symbol `--color-muted` at `.3` |
| Card, panel | box, `rx:var(--radius,8px)` | `--color-surface` |
| Area for further blocks | dashed outline | stroke `--color-line`, `stroke-dasharray:4 3` |
| Eyebrow, icon | short bar or circle | `--color-accent` |
| Footer of a layout | band | `--color-dark` |

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" id="preview">
  <title>Teaser</title>
  <rect width="320" height="200" style="fill:var(--color-bg,#ffffff)"/>
  <rect x="24" y="40" width="160" height="14" rx="2" style="fill:var(--color-text,#1c1917)"/>
  <rect x="24" y="66" width="240" height="6" rx="2" style="fill:var(--color-muted,#57534e);opacity:.45"/>
  <rect x="24" y="110" width="64" height="20" rx="8" style="fill:var(--color-primary,#1d4ed8);rx:var(--radius,8px)"/>
</svg>
```
