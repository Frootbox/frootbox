# Bohnenglück

A demo theme for [Frootbox](https://github.com/Frootbox/frootbox): the website
of Bohnenglück, a small (made-up) coffee roastery at the harbour of Hamburg,
in German and English.

It is the first theme of Frootbox. It shows blocks with variants, options,
lists, nested areas and rich text, two layouts, partials, navigations, a
language switcher and a page without translation, and it will grow into a
complete theme.

## Contents

| Path | What it is |
|---|---|
| `frootbox.yaml` | Theme manifest with the navigations `main` (option `button`) and `footer` and the design tokens (colours, fonts, radius, spacing, width) |
| `layouts/OnePage` | Start page: header, the area `main` and footer |
| `layouts/Page` | Subpage: header, breadcrumb, fields `title` and `intro`, the area `main` and footer |
| `partials/header.twig`, `partials/footer.twig` | Header with main navigation and language switcher, footer with the footer navigation, included as `@theme/header.twig` |
| `partials/labels.twig` | The texts of the theme in German and English |
| `blocks/Hero` | Opening section, variants `Default` (option `tone`) and `Split` |
| `blocks/Features` | Cards with icon, title and text, option `columns` |
| `blocks/Text` | Rich text, option `width` |
| `blocks/Columns` | Two areas `left` and `right` for `Text` and `Quote`, option `ratio` |
| `blocks/Quote` | Testimonial |
| `blocks/Faq` | Questions with rich text answers, option `open` |
| `blocks/Cta` | Call to action |
| `assets/reset.css`, `assets/base.css`, `assets/site.css` | Reset, base styles and header, footer and buttons for every page |
| `demo/site.yaml` | The demo website for `bin/frootbox seed` |

Every block has an `anchor` option for links within the page.

## Try it

```bash
composer require frootbox/theme-bohnenglueck
```

Make it the active theme in `config/app.yaml`, with German and English:

```yaml
theme: frootbox/theme-bohnenglueck

languages:
  de: { title: Deutsch }
  en: { title: English }
```

Create the demo website in an empty installation. It publishes six pages,
the navigations and a redirect:

```bash
php bin/frootbox seed frootbox/theme-bohnenglueck:demo/site.yaml
```

Then open `/` and `/en`. The Impressum has no English translation, so
`/en/impressum` shows the German text. `/roesterei` is the former address of
"Über uns" and `/shop` a redirect, both lead on with a 301. In development mode every change to the templates, the CSS
or the tokens shows up on the next reload.

## License

MIT, see [LICENSE](LICENSE).
