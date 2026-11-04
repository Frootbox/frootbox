# Bohnenglück

A demo theme for [Frootbox](https://github.com/Frootbox/frootbox): the website
of Bohnenglück, a small (made-up) coffee roastery at the harbour of Hamburg,
in German and English.

It is a child of the base theme `frootbox/theme-base`: the blocks, layouts, partials,
fields and navigations all come from there. Bohnenglück only changes how
they look, which makes it a template for your own child theme.

## Contents

| Path | What it is |
|---|---|
| `frootbox.yaml` | Theme manifest: parent `frootbox/theme-base` and the design tokens (colours, fonts, radius, spacing, width) |
| `assets/site.css` | The look of the roastery on the classes of the base theme: sticky head, warm page head, benefits and quote as cards, call to action with a gradient, dark footer, circles in the hero without an image |
| `icons/` | Symbols for the field type `icon` next to those of the base theme |
| `demo/site.yaml` | The demo website for `bin/frootbox seed` |

## Try it

```bash
composer require frootbox/theme-bohnenglueck
```

This brings the base theme along.

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

## Source and issues

This package is developed in the [Frootbox monorepo](https://github.com/Frootbox/frootbox)
and mirrored here read-only. Questions, bugs and ideas go there, see the
[documentation](https://github.com/Frootbox/frootbox/tree/main/documentation).

## License

MIT, see [LICENSE](LICENSE).
