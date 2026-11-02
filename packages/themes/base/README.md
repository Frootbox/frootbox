# Base theme

The base theme of [Frootbox](https://github.com/Frootbox/frootbox): default
design tokens and blocks that every theme can build on. Themes name it as
their parent (`parent: frootbox/theme-base`) and override its views and
CSS file by file.

It is the block library of Frootbox: 29 blocks in eight groups, three
layouts and the partials around them (decisions 0120, 0124 and 0163).
Every block has examples, so all of them show on the design page
`/_design` (decisions 0205 and 0206).

## Contents

| Path | What it is |
|---|---|
| `frootbox.yaml` | Theme manifest: default tokens (colours, fonts, radius, spacing, width), site fields, navigations, the places and surfaces of the design page |
| `layouts/` | `Start` (only content), `Page` (breadcrumbs, heading, introduction, content), `Landing` (without the main navigation) |
| `partials/` | `header`, `footer`, `navigation`, `breadcrumb`, `languages`, `error`; a child theme overrides them file by file |
| `blocks/` | The blocks, see below |
| `assets/` | `reset.css`, `base.css`, `layouts.css`, `partials.css`, the font Noto Sans and files for the examples |
| `demo/site.yaml` | A small sample website for head, footer and layouts: `bin/frootbox seed frootbox/theme-base:demo/site.yaml` |

### Blocks

| Group | Blocks |
|---|---|
| Headers | `Hero` (variants `Default`, `Split`, `Background`), `PageHeader` |
| Headings | widget `Heading`; its level follows from where it stands (decision 0129) |
| Texts | `TextWithHeading` (`Default`, `Wide`), `Quote`, `Notice`, `Table`, widget `Text` |
| Images and media | `ImageWithText` (`Default`, `End`), `Gallery`, `Slider`, `Video` (`Default`, `Narrow`), widget `Image` |
| Teasers | `Cards`, `LinkList`, `Logos`, widget `Button` |
| Callouts | `CallToAction`, `KeyFigures` |
| Lists | `Features`, `Steps`, `Accordion` (`Default`, `Faq`), `Pricing`, `Testimonials`, `Downloads`, `Contact` |
| Structure | `Section` (columns `Default`, `Two`, `Three`, `OneTwo`, `TwoOne`, with areas for widgets and smaller blocks), `JumpBar`, `Divider` |

The description in the head of each view says what a block is for and
what not; editors see it when they add a block. Widgets have
`widget: true` in their schema: they only go into areas that allow
them by name, such as the columns of a section. `Hero`, `PageHeader`,
`JumpBar` and `Section` stand only in the main area.

## Tokens

Child themes override any of them in their own `frootbox.yaml`. They
become CSS custom properties, e.g. `color.primary` is
`--color-primary`.

## Icons

`icons/` holds the symbols for the field type `icon`, e.g. in the block
`Features`: SVG files with a `viewBox`, drawn with `currentColor`, named
in lowercase with hyphens (`map-pin.svg`). A child theme adds its own or
replaces one by the same name. The page gets them inline and hidden from
screen readers, so the text next to a symbol carries its meaning.

## Frameworks

No framework is needed, and any can be used (decision 0167). A child
theme that wants Bootstrap puts its CSS into `assets/reset.css`: it then
replaces the reset of the base theme and lies in the lowest layer, so
the blocks always win while classes such as `.container`, `.row` and
`.col-lg-4` still work. Loaded as any other name, it would land in the
layer `theme`, and its reboot would restyle the blocks. Tokens can be
handed to the framework, e.g. `--bs-primary: var(--color-primary)` in
the child's `assets/site.css`.

`tests/Fixtures/Themes/agency` in the repository shows a whole design
built this way, compared pixel for pixel with its static original
(decision 0212).

## License

MIT, see `LICENSE`.
