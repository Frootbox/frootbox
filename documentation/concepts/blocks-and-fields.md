# Blocks and fields

Editors build pages from **blocks**: elements designed and finished by a
developer, like a hero, a text with an image, a list of features, a form.
They choose a block, fill its fields and pick from the options the
developer allows. There is no free layout editor, so a page can't lose
its design, its outline or its accessibility, however it is filled.

## A block is a folder

```
blocks/Teaser/
  views/Default.twig       every block has a variant Default
  views/ImageLeft.twig     more variants
  block.yaml               the schema, when there are several variants
  assets/teaser.css        loaded only on pages with the block
  Teaser.php               optional controller with more data
  preview.svg              16:10, for the block picker
```

With one variant the schema is the header of the view:

```twig
{# frootbox
title: Teaser
description: A heading, a text and a button, e.g. to lead to a page.
group: teaser
keywords: [Promo, Lead]
options:
  background: { type: choice, label: Background, choices: { none: None, surface: Surface }, default: none }
fields:
  title: { type: headline, label: Heading, placeholder: "What it is about" }
  text: { type: richtext, label: Text, optional: true }
  button: { type: link, label: Button, optional: true }
#}
<section class="teaser teaser--{{ options.background }}">
  {{ heading('title') }}
  {{ field('text') }}
  {{ field('button') }}
</section>
```

- **`fields`** are content, translated per language.
- **`options`** are settings of the block, the same in every language,
  read as `options.<name>`.
- **`areas`** hold other blocks, e.g. the columns of a section, with
  `allow:` to limit which.
- **`group`** and **`keywords`** place it in the block picker.
- **`examples`** fill the design page under `/_design`.

`bin/frootbox blocks:check` checks every schema and template. The
[block schema](../reference/block-schema.md) lists every key.

## Fields

A field has a type: `headline`, `text`, `richtext`, `link`, `image`,
`video`, `file`, `icon`, `table`, `list`. Modules add their own. See
[field types](../reference/field-types.md).

```yaml
fields:
  items:
    type: list
    start: 3        # a new block begins with three empty entries
    max: 8
    fields:
      title: { type: headline, placeholder: "A benefit in a few words" }
      text: { type: text, optional: true }
```

A list gives its entries to loop over, each with `field()`, `value()`
and `heading()` of its own. Visitors get only entries with a value:

```twig
<ul class="benefits">
  {% for item in field('items') %}
    <li>{{ item.heading('title', 1) }}<p>{{ item.field('text') }}</p></li>
  {% endfor %}
</ul>
```

Print fields with `field()`, without a condition. An empty optional
field disappears for visitors, with any element that held nothing else.
While editing it keeps its place and shows its `placeholder`. Use
`value()` for attributes and conditions:

```twig
<p>{{ field('text') }}</p>
{% if value('button') %}<div class="actions">{{ field('button') }}</div>{% endif %}
```

Drafts may be unfinished; required fields and `min` are checked when a
page is published.

In a seed file or an action a field takes its value as JSON: a string
for `headline` and `text`, `{media: <id>, alt: …}` for `image`,
`{target: 'page:<id>', text: …}` for `link`, a list of entries for
`list`. The [field types](../reference/field-types.md) give the format
and the settings of each.

## Controllers

A block that needs data, e.g. the newest articles, has a class named
like the folder in the namespace `<extension>\Blocks`, implementing
`BlockController`. `data(BlockContext $context)` returns more variables
for the template. It reads in `$context->contentLanguage`, which differs
from the language of the page when a page shows a fallback.

## Scripts

A block with behaviour, e.g. a slider or tabs, brings its script in
`assets/` as a custom element (`customElements.define('acme-tabs', …)`)
and wraps its markup in that element. While editing, the editor bar
swaps the content of the page after each change instead of loading it
again; a custom element starts by itself as soon as it is on the page.
A script that looks for its elements once at load
(`document.querySelectorAll(…)`) misses the swapped ones. A script that
cannot be an element listens to the event `frootbox:refresh` on
`document`, which follows every swap.

## Layouts

Layouts are the frames of pages (`layouts/<Name>/`), with the same
schema: fields like the page title, and areas for the blocks.

## Blocks inside blocks

`{{ render_block('frootbox/forms/Form', {form: id}) }}` shows another
block with its options, e.g. a form inside a contact block.

See [Headings](headings.md) and [A website from a design](../tutorials/website-from-a-design.md).
