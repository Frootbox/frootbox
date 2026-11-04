# A website from a design

A designer hands over a design for the Northwind Bakery. This tutorial
turns it into a Frootbox website the way agencies do it: a **child
theme** of the base theme carries the look, the base theme carries
structure, accessibility and the blocks. You change only what the design
needs, and every update of the base theme still reaches the website.

You need a project from the [installation](../getting-started/installation.md)
in development mode (`APP_ENV=dev`) and with a start page.

## 1. Create the child theme

```bash
php bin/frootbox make:extension acme/site --theme --title "Northwind Bakery"
composer require acme/site
```

`make:extension` creates `extensions/acme-site/` and adds `extensions/*`
as a path repository to `composer.json`. After the one `composer require`
every change in the folder shows up at once. Choose the theme in
`config/app.yaml`:

```yaml
theme: acme/site
```

The folder holds three files:

```
extensions/acme-site/
  composer.json
  frootbox.yaml        the manifest: parent, tokens, fields
  assets/site.css      the stylesheet of the website, loaded on every page
```

## 2. Colours, fonts and corners: tokens

Most of a design is colours, fonts, rounding and space. The base theme
takes them from design tokens, which become CSS custom properties. Change
them in `extensions/acme-site/frootbox.yaml`:

```yaml
title: Northwind Bakery
description: The theme of the Northwind Bakery
theme:
  parent: frootbox/theme-base
  tokens:
    color:
      primary: '#8a4b2a'
      primary-contrast: '#ffffff'
      accent: '#e8b04b'
      surface: '#f7f1ea'
    radius: 14px
```

Reload the page: buttons, links and surfaces take the new colours. The
tokens of the base theme are listed in its `frootbox.yaml`; each one is
`var(--color-primary)`, `var(--radius)`, `var(--space-m)` and so on in
CSS. Tokens with a type can also be changed by an admin in the edit
mode, so the design stays adjustable without code.

The design page at `/_design` shows every block of the theme in each
variant with example content, on the tokens of your theme. Keep it open
while you work.

## 3. A block of your own

The design has a coloured card for the offer of the week. Blocks are
folders under `blocks/` in PascalCase:

```
extensions/acme-site/blocks/Offer/
  views/Default.twig
  assets/offer.css
```

The view is the template, its header the schema of the block:

```twig
{# frootbox
title: Offer
description: One offer of the week with a short text and a link, on a coloured card.
group: callout
keywords: [Special, Deal, Week]
fields:
  title: { type: headline, label: Heading, maxLength: 80, placeholder: "The offer in a few words" }
  text: { type: text, label: Text, optional: true, multiline: true, maxLength: 240 }
  link: { type: link, label: Button, optional: true }
examples:
  - fields:
      title: Two rye loaves for the price of one
      text: Every Friday until noon.
#}
<aside class="site-offer">
  {{ heading('title', 0, {class: 'site-offer__title'}) }}
  <p class="site-offer__text">{{ field('text') }}</p>
  <p class="site-offer__link">{{ field('link') }}</p>
</aside>
```

```css
/* extensions/acme-site/blocks/Offer/assets/offer.css */
.site-offer {
  margin-inline: auto;
  max-inline-size: var(--width-narrow);
  padding: var(--space-l);
  border-radius: var(--radius);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.site-offer__title {
  margin-block-end: var(--space-2xs);
  font-size: var(--size-2xl);
}
```

Three rules make the block safe in the hands of editors:

- **`heading()` instead of `<h2>`.** Rank 0 is the main heading of the
  block. The core works out the level from where the block stands: an
  `h2` on a page, an `h3` inside a section with a heading. The outline of
  the page is always right. See [Headings](../concepts/headings.md).
- **`field()` without a condition.** An empty optional field disappears
  for visitors, together with an element that held nothing else. While
  editing it keeps its place and shows its placeholder.
- **Plain CSS.** No `@layer`, no `@import`, no build step. The core puts
  the file into the right cascade layer and loads it only on pages with
  the block.

Check the schema and see the block in the list:

```bash
php bin/frootbox blocks:check
php bin/frootbox blocks
```

`blocks:check` hints that a preview is missing: a `preview.svg` or
`preview.webp` (16:10) in the folder shows the block in the block picker.

## 4. Another variant of a block

The design wants the hero of inner pages as a calm banner on the main
colour. The hero belongs to the base theme; the child adds a variant in
`overrides/<vendor>/<package>/blocks/<Name>/views/`:

```twig
{# extensions/acme-site/overrides/frootbox/theme-base/blocks/Hero/views/Banner.twig #}
{# frootbox
title: Banner
description: Only the heading and a sentence on the main colour, narrow and calm.
#}
<div class="base-hero base-full site-banner">
  <div class="base-hero__inner">
    {{ heading('title', 0, {class: 'base-hero__title'}) }}
    <p class="base-hero__lead">{{ field('text') }}</p>
  </div>
</div>
```

```css
/* extensions/acme-site/assets/site.css */
.site-banner {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}
```

`php bin/frootbox blocks` now lists `Banner (acme/site)` among the
variants of the hero. The fields stay those of the hero, so an editor can
switch between the variants without losing content. A file with the same
name as an existing variant replaces it instead.

## 5. Content that is the same on every page

The footer of the design shows the opening hours. Text that is the same
on every page is never written into a template: it is a **site field**,
which an admin edits once. Declare it in the manifest under `theme:`:

```yaml
theme:
  parent: frootbox/theme-base
  tokens: { … }
  fields:
    hours: { type: text, label: Opening hours in the footer, multiline: true, optional: true, maxLength: 200 }
```

The fields of the parent (name, address, profiles, note) stay. Then
replace the footer: any file of the parent with the same path in the
child replaces it. Copy `partials/footer.twig` of the base theme to
`extensions/acme-site/partials/footer.twig` and add a line:

```twig
<p class="base-footer__address"{{ site_attributes('address')|attributes }}>{{ site_field('address') }}</p>
<p class="site-footer__hours">{{ site_field('hours') }}</p>
```

## 6. Content from a file

To see everything together, and to set the website up again after a
reset, put the content into a seed file. Each step is an action or a
query with its input; `as` names a result for later steps:

```yaml
# content/this-week.yaml
# The start page is the first page of the tree, the new page goes below it.
- page.tree: {}
  as: tree

- page.create:
    layout: frootbox/theme-base/Page
    parentId: '${tree.0.id}'
    translations:
      en:
        title: This week
        slug: this-week
        content:
          fields:
            title: This week
          areas:
            main:
              - block: frootbox/theme-base/Hero
                variant: Banner
                fields:
                  title: Fresh this week
                  text: What comes out of the oven these days.
              - block: acme/site/Offer
                fields:
                  title: Two rye loaves for the price of one
                  text: Every Friday until noon.
  as: week
- page.publish: { ids: ['${week.id}'] }

- site.update:
    language: en
    fields:
      brand: Northwind Bakery
      address: "Northwind Bakery\n12 Mill Lane\nNorthwind"
      hours: "Mon to Fri 7–18\nSat 7–13"
- site.publish: {}
```

```bash
php bin/frootbox seed content/this-week.yaml
```

Open `/this-week`: the page heading is the `h1`, the banner and the offer
get `h2`, the footer shows the opening hours.

## What you did not have to do

- Write accessible markup for navigation, skip links, focus and the
  outline: the base theme and the core bring it.
- Build forms for editors: the schema of each block is the form.
- Load CSS per page: blocks bring their own assets.
- Handle languages: add one in `config/app.yaml` and every field gets a
  translation.

## Next

- [Your first module](first-module.md): a block with data of its own.
- [Themes](../concepts/themes.md) and [Blocks and fields](../concepts/blocks-and-fields.md)
  in depth.
- [Twig functions](../reference/twig.md) and [field types](../reference/field-types.md).
