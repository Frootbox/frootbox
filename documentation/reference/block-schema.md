<!-- Written by bin/frootbox reference:build from the code. Do not edit. -->

# Block schema

Every block and layout describes its fields, options and areas in a
schema in YAML. `bin/frootbox blocks:check` checks every schema and
names each mistake with its file and key.

## Where the schema is

```
blocks/Teaser/
  views/Default.twig       every block has a variant Default
  views/ImageLeft.twig     more variants, PascalCase
  block.yaml               the shared schema, when there are several variants
  assets/teaser.css        loaded only on pages with the block
  Teaser.php               optional controller, a BlockController
  preview.svg              for the block picker, also preview.ImageLeft.webp
```

Layouts are the same below `layouts/`, with `layout.yaml`.

With one variant the schema is the header of `views/Default.twig`:

```twig
{# frootbox
title: Teaser
fields:
  title: { type: headline }
#}
<section class="teaser">{{ heading('title') }}</section>
```

With a `block.yaml`, it holds what all variants share, and the header
of each view, `Default` too, only what is its own: title,
description, options and object fields. A theme that overrides a
view gives only these as well.

```yaml
# block.yaml
title: Teaser
group: teaser
fields:
  title: { type: headline }
  image: { type: image, optional: true }
```

```twig
{# frootbox
title: Image on the left
options:
  imageHeight: { type: choice, choices: { 400: Standard, 550: High }, default: 400 }
#}
```

Names of fields, options and areas are camelCase.

## Keys of a schema

Where a key may stand: in `block.yaml` or `layout.yaml`, in the header
of `Default` when there is none, and in the header of every other view.

| Key | Value | `block.yaml` | `Default` alone | Other views | Description |
|---|---|:-:|:-:|:-:|---|
| `title` | text | ✓ | ✓ | ✓ | The name in the block picker and the backend. Required for the schema; in another view the name of that variant. |
| `description` | text | ✓ | ✓ | ✓ | One sentence for editors: what the block is for. In a variant: what sets it apart. |
| `group` | text | ✓ | ✓ |  | The group in the block picker, see [groups](#groups). Without one the block is under “Other”. |
| `keywords` | list of texts | ✓ | ✓ |  | More words the search of the block picker finds, e.g. `[Promo, Lead]`. |
| `widget` | `true` or `false` | ✓ | ✓ |  | `true`: the block goes only into areas that name it in `allow`, e.g. a sidebar. Only for blocks. |
| `plugin` | `true` or `false` | ✓ | ✓ |  | In a layout: it has a place for a plugin, `{{ plugin() }}`, so the page of a space can use it. In a block: it shows the objects of a plugin, e.g. a list of articles. |
| `options` | map by name |  | ✓ | ✓ | Settings per variant, see [options](#options). |
| `fields` | map by name | ✓ | ✓ |  | Content, see [fields](#fields). |
| `areas` | map by name | ✓ | ✓ |  | Places for other blocks, see [areas](#areas). |
| `examples` | list | ✓ | ✓ |  | Content for the design page, see [examples](#examples). |
| `query` | list of texts | ✓ | ✓ |  | The query parameters the block reads, camelCase, e.g. `[page, category]`. The page cache keeps a copy per value; a block with results per input, such as a search, calls `Delivery::withoutCache()`. |
| `object` | map by name |  | ✓ | ✓ | Further fields of the objects the view shows, see [object fields](#object-fields). |

## Options

Settings an editor chooses per block, the same in every language,
read in the view as `options.<name>`. Types: `choice`, `boolean`, `number`, `text`.

```yaml
options:
  imageHeight: { type: choice, choices: { 400: Standard, 550: High }, default: 400 }
  dark: { type: boolean, label: Dark background }
  perPage: { type: number, default: 10, min: 1, max: 50 }
```

| Key | Value | Description |
|---|---|---|
| `type` | `choice`, `boolean`, `number`, `text` | What the editor chooses. |
| `label` | text | The label in the backend. Without one it comes from the name: `imageHeight` becomes “Image height”. |
| `description` | text | A hint below the option. |
| `default` | text, number or `true`/`false` | The value of a new block. Without one: the first choice, `false`, `min` or `0`, or an empty text. |
| `choices` | map by name | For `choice`: the values with their labels, e.g. `{ 400: Standard, 550: High }`. |
| `source` | text | For `choice`: a query that gives the choices instead, e.g. `frootbox/forms/form.choices`. It returns a list of `{value, label}`. |
| `min` | number | For `number`: the smallest value. |
| `max` | number | For `number`: the largest value. |

## Fields

Content, translated per language, printed with `field()`, `value()`
and `heading()`. Each field type has settings of its own next to `type`,
see [field types](field-types.md).

```yaml
fields:
  title: { type: headline, placeholder: "What it is about" }
  items:
    type: list
    max: 8
    fields:
      text: { type: text, optional: true }
```

| Key | Value | Description |
|---|---|---|
| `type` | text | The [field type](field-types.md), e.g. `headline`. Required. |
| `label` | text | The label in the backend. Without one it comes from the name. |
| `description` | text | A hint for editors. |
| `optional` | `true` or `false` | `true`: a page can be published without a value. Visitors don’t see an empty optional field. |
| `placeholder` | text | Shown in the empty field while editing, e.g. “What it is about”. |
| `fields` | map by name | For types with entries such as `list`: the fields of each entry. Required there. |
| `translatable` | `true` or `false` | Only under `object`: whether the value differs per language. Texts do, other types don’t; this turns it around. |
| `labels` | map by language | Only under `object`: the label per language, e.g. `{ de: Preis, en: Price }`. |

## Areas

Places for other blocks, printed with `area('<name>')`.

```yaml
areas:
  main: { allow: [Text, Image, frootbox/forms/Form], min: 1 }
  aside: { label: Sidebar, level: 2 }
```

| Key | Value | Description |
|---|---|---|
| `label` | text | The label in the backend. Without one it comes from the name. |
| `description` | text | A hint for editors. |
| `allow` | list of texts | The blocks it takes, e.g. `[Column]`; a short name is a block of the same extension. Without `allow` every block that is no widget. |
| `min` | whole number from 0 | The fewest blocks, checked when the page is published. |
| `max` | whole number from 1 | The most blocks. |
| `level` | whole number, 1 to 6 | The heading level the blocks inside start at, e.g. `2` for a sidebar that never holds the h1. Without one the core works it out. |

## Object fields

Further fields of the objects a view shows, e.g. of an article on its
own page, read with `object_field(object, name)` and `object_value()`.
They are edited in the backend with the object and in place in the
edit mode.

```yaml
object:
  fields:
    price: { type: number, label: Price }
```

| Key | Value | Description |
|---|---|---|
| `type` | text | The type of the objects, e.g. `frootbox/news/article`. A block with `plugin: true` takes the type of its plugin. |
| `fields` | map by name | The fields, as [fields](#fields). Required. |

## Examples

Content for the design page under `/_design`, a list of entries, each
like the block on a page. Images take `sample:` with a path within
`assets/` instead of a medium.

```yaml
examples:
  - fields: { title: 'Our offers' }
    options: { columns: 3 }
  - variant: ImageLeft
    fields: { title: 'With an image' }
```

| Key | Value | Description |
|---|---|---|
| `variant` | text | The variant to show. Without one every variant shows the example. |
| `fields` | map by name | Values by field name, in the format of a seed file. |
| `areas` | map by name | Blocks by area name, each `{ block: Text, fields: { … } }`. |
| `options` | map by name | Values by option name. |

## Groups

The groups of the block picker in the core, in order. Extensions add
more.

| Group | Title |
|---|---|
| `header` | Headers |
| `heading` | Headings |
| `text` | Texts |
| `media` | Images and media |
| `teaser` | Teasers |
| `callout` | Callouts |
| `list` | Lists |
| `form` | Forms |
| `structure` | Structure |
