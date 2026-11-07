# Themes

A theme is an extension with `theme:` in its `frootbox.yaml`. It brings
layouts, partials, blocks, assets, design tokens and the fields of the
website. A website uses one theme, set in `config/app.yaml`:

```yaml
theme: acme/site
```

## The parent chain

A theme names its parent. The base theme `frootbox/theme-base` brings
the structure every website needs: layouts, header and footer, the
navigation, about thirty blocks, accessible markup, fonts and a scale of
sizes and spaces. A child theme changes only what its design needs:

- **Tokens** change colours, fonts, rounding and spacing.
- **A file with the same path** as one of the parent (`partials/`,
  `layouts/`, `blocks/`, `assets/`, `views/`) replaces it.
- **Overrides** add or replace variants of blocks of other packages:
  `overrides/<vendor>/<package>/blocks/<Name>/views/<Variant>.twig`.
- **Blocks of its own** go to `blocks/`.

Chains can be longer: an agency theme over the base theme, a website
theme over the agency theme.

Themes hold no tables, migrations or actions. Logic belongs in a module.

## Tokens

```yaml
theme:
  parent: frootbox/theme-base
  tokens:
    color:
      primary: '#8a4b2a'
      primary-contrast: '#ffffff'
    font:
      heading: serif
    radius: 14px
```

Every token becomes a CSS custom property: `color.primary` is
`var(--color-primary)`. The parent defines the tokens with a type and a
label; those an admin can change in the edit mode without code. A child
sets values with the short form.

## Fields of the website

Content that is the same on every page, like the name, the address or
the opening hours, is a field of the website, never fixed in a template:

```yaml
theme:
  fields:
    hours: { type: text, label: Opening hours, multiline: true, optional: true }
```

```twig
<p>{{ site_field('hours') }}</p>
```

The fields of the parent stay, a child adds its own.

## The icon

One square PNG, best 512 pixels, in the `assets` folder of the theme is
enough for the favicon:

```yaml
theme:
  icon: assets/icon.png
```

The core makes `/favicon.ico` (16, 32 and 48 pixels),
`/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png` and
`/manifest.webmanifest` from it, caches them in `var/cache/icon/` and
puts the tags into the head of every page. The icon for Apple devices
gets the background colour of the theme, since they show transparency
black. A child's icon replaces the parent's. Without an icon there are
no tags and these addresses answer 404.

## CSS

Write plain modern CSS: custom properties, container queries, logical
properties. No `@layer` and no `@import`: the core puts each file into a
cascade layer by where it comes from, in the order `reset, tokens, base,
layouts, blocks, theme, project`. The stylesheet of a theme wins over
the styles of blocks without higher specificity, whatever the order of
loading. No build step.

## The design page

`/_design` shows every block the theme offers in each variant with its
examples, the tokens, the plain elements and rich text, in the frame of
the website. Use it to check a design, and to show it to the client with
a preview link.

See [A website from a design](../tutorials/website-from-a-design.md).
