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
| `demo/onepager.json` | Demo content in German |

Every block has an `anchor` option for links within the page.

## Try it

Until Frootbox has pages, the theme renders `demo/onepager.json` at `/demo`.

```bash
composer require frootbox/theme-bohnenglueck
```

Then make it the active theme in `config/app.yaml`:

```yaml
theme: frootbox/theme-bohnenglueck
```

and open `/demo`. In development mode every change to the content, the
templates, the CSS or the tokens shows up on the next reload.

## License

MIT, see [LICENSE](LICENSE).
