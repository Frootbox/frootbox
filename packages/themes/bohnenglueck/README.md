# Bohnenglück

A demo theme for [Frootbox](https://github.com/Frootbox/frootbox): a one-pager
for Bohnenglück, a small (made-up) coffee roastery at the harbour of Hamburg.

It is the first theme of Frootbox and still a sketch. It shows blocks with
variants, options, lists, nested areas and rich text, and it will grow into a
complete theme.

## Contents

| Path | What it is |
|---|---|
| `frootbox.yaml` | Theme manifest with the design tokens (colours, fonts, radius, spacing, width) |
| `layouts/OnePage` | Page layout with header, navigation, the area `main` and a footer |
| `blocks/Hero` | Opening section, variants `Default` (option `tone`) and `Split` |
| `blocks/Features` | Cards with icon, title and text, option `columns` |
| `blocks/Text` | Rich text, option `width` |
| `blocks/Columns` | Two areas `left` and `right` for `Text` and `Quote`, option `ratio` |
| `blocks/Quote` | Testimonial |
| `blocks/Faq` | Questions with rich text answers, option `open` |
| `blocks/Cta` | Call to action |
| `assets/reset.css`, `assets/base.css` | Reset and base styles for every page |
| `demo/onepager.json` | Demo content in German, as input for `page.create` |

Every block has an `anchor` option for links within the page.

## Try it

```bash
composer require frootbox/theme-bohnenglueck
```

Make it the active theme in `config/app.yaml`:

```yaml
theme: frootbox/theme-bohnenglueck
```

Create the demo as the start page and publish it, with the id that
`page.create` prints:

```bash
php bin/frootbox call page.create "$(cat vendor/frootbox/theme-bohnenglueck/demo/onepager.json)"
php bin/frootbox call page.publish '{"ids": ["<id>"]}'
```

Then open `/`. In development mode every change to the templates, the CSS
or the tokens shows up on the next reload.

## License

MIT, see [LICENSE](LICENSE).
