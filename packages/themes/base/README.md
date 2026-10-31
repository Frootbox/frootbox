# Base theme

The base theme of [Frootbox](https://github.com/Frootbox/frootbox): default
design tokens and blocks that every theme can build on. Themes name it as
their parent (`parent: frootbox/theme-base`) and override its views and
CSS file by file.

It grows into the block library of Frootbox. For now it holds the section
with columns and the first widgets (decisions 0120 and 0124).

## Contents

| Path | What it is |
|---|---|
| `frootbox.yaml` | Theme manifest with default tokens: colours, fonts, radius, spacing, width |
| `blocks/Section` | Section with columns. Variants by split: `Default` (one column), `Two`, `Three`, `OneTwo`, `TwoOne`. Areas `first`, `second`, `third` for widgets. Options `spacing` (small, medium, large) and `background` (none, surface, primary). Columns stack on narrow screens |
| `blocks/Heading` | Widget: a heading, option `level` (`h2`, `h3`) |
| `blocks/Text` | Widget: rich text |
| `blocks/Button` | Widget: a link as a button, option `style` (`primary`, `secondary`) |

Widgets have `widget: true` in their schema: they only go into areas that
allow them by name, such as the columns of a section.

## Tokens

Child themes override any of them in their own `frootbox.yaml`. They
become CSS custom properties, e.g. `color.primary` is
`--color-primary`.

## License

MIT, see `LICENSE`.
