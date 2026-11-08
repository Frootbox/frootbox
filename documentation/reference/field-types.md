<!-- Written by bin/frootbox reference:build from the code. Do not edit. -->

# Field types

Every field of a block, a website or an object has a type, e.g.
`title: { type: headline }`. Extensions add their own with
`$registry->fieldType()` and `#[AsFieldType]`, named after their package.
Below each type: the format of its value, as a seed file or an action
gives it, its settings and what it prints.

| Type | Description |
|---|---|
| `boolean` | Yes or no at an object, e.g. a switch for the view |
| `choice` | One of several options at an object |
| `date` | A day at an object, e.g. "2026-05-01" |
| `file` | A document from the media library to download |
| `headline` | A single line for a heading |
| `icon` | A symbol, e.g. a truck for delivery |
| `image` | An image from the media library |
| `link` | A link to a page or a URL, with text |
| `list` | Repeated entries with their own fields |
| `number` | A number at an object, with a unit |
| `richtext` | Formatted text with paragraphs, lists and links |
| `table` | A table with rows and columns, e.g. opening hours or prices |
| `text` | Plain text without formatting |
| `video` | A video from the media library |

## `boolean`

Yes or no at an object, e.g. "noContactDetails". Templates ask with object_value(); left out is no.

## `choice`

One of several options at an object, e.g. the variety of a coffee. The value is the key, the text comes from the options, one for all languages or one per language:

```
variety: { type: choice, options: { arabica: Arabica, robusta: { de: Robusta, en: Robusta } } }
```

object_field() gives the text in the language of the content or its fallback, object_value() the key.

## `date`

A day at an object, e.g. when a project was finished, stored as "2026-05-01". object_field() gives a `<time>` element with the long date in the language of the content, object_value() the text.

## `file`

A document from the media library to download, with an optional text of its own:

```
{"media": "01J…", "text": "Price list 2027"}
```

`{{ field('file') }}` gives a link to the file with its format and size, e.g. "Price list 2027 `<small>`PDF, 1.2 MB`</small>`". Without own text the link names the title of the medium in the language of the page, else its file name. For own markup use value('file').

## `headline`

A single line of text for a heading. The template sets the tag: `<h2>{{ field('title') }}</h2>`.

## `icon`

A symbol by its name: one of the theme like "truck", one of an extension like "acme/fontawesome/solid/truck" or an SVG graphic of the media library like "media:01J…".

`{{ field('icon') }}` gives the SVG inline, hidden from screen readers. A symbol that is gone gives nothing.

## `image`

An image from the media library:

```
{"media": "01J…", "alt": "Optional, else the one of the library",
 "caption": "Only with caption: true", "copyright": "Optional, else the one of the library"}
```

Settings: "ratio" cuts it around its focus point, e.g. "16:9"; "sizes" tells the browser how wide it is shown, e.g. "(min-width: 60rem) 50vw, 100vw"; "eager" loads it at once with high priority, for the first image on a page such as in a hero. Without "ratio" the `<img>` gets its focus point as object-position, so CSS with object-fit: cover keeps it. `{{ field('image') }}` gives a `<picture>` with modern formats and all widths, an SVG a single `<img>`; a deleted medium gives nothing. The editing mode shows the draft of the medium, visitors the published state.

Parts: `{{ field('image', 'copyright') }}` gives the copyright of this place or else of the medium, `{{ field('image', 'caption') }}` the caption, which the setting "caption: true" offers.

A medium an AI made or changed comes in a wrapper with a badge: `<span class="ai-image" data-fb-ai="generated">`, the image, then `<span class="ai-image__badge">` with a short "AI" for the eye and the full text for screen readers.

## `link`

A link to a target or a URL, with text and whether it opens in a new window:

```
{"target": "page:01J…", "text": "About us"}
{"url": "https://example.com", "text": "Elsewhere", "newWindow": true}
```

A target always gives its current URL in the visitor's language. A target without URL, e.g. a deleted page, gives only the text.

`{{ field('button') }}` gives the `<a>` element. For own markup use url(value('button')) and value('button').text.

## `list`

Repeated entries with fields of their own, e.g. slides or FAQ items:

```
slides:
  type: list
  max: 10
  start: 3
  fields:
    title: { type: headline }
```

The value is a list of entries, each with the values of its fields and an id the core gives it on saving:

```
[{"id": "k3f9x2ab", "title": "First slide"}, {"id": "p0q7m1zc", "title": "Second slide"}]
```

In the view field('slides') gives the entries to loop over, each with field(), value() and heading() of its own; visitors get only entries with a value:

```
{% for slide in field('slides') %}
  <li>{{ slide.heading('title', 1) }}</li>
{% endfor %}
```

## `number`

A number at an object, e.g. the altitude of a farm:

```
altitude: { type: number, unit: m, decimals: 0, min: 0 }
```

object_field() gives it formatted in the language of the content with its unit, e.g. "1.650 m"; object_value() the number.

## `richtext`

Formatted text from the editor (Tiptap JSON), output as safe HTML.

Headings are stored with their rank: 1 the heading, 2 the subheading, 3 the small heading. On a page the core decides their levels; elsewhere rank 1 is an h2. The setting "headings" limits the ranks, 0 allows none.

## `table`

A table:

```
{"rows": [["Day", "Opening hours"], ["Monday", "8 am to 6 pm"]],
 "headerRow": true, "headerColumn": false}
```

A cell is text or a list of inline nodes as in Tiptap: text with the marks bold, italic and link, and hardBreak. "headerRow" (true when not given) makes the first row the heads of the columns, "headerColumn" the first cell of each row the head of its row. Shorter rows are filled up with empty cells; cells are never merged.

`{{ field('table') }}` gives a `<table>` without classes; the theme puts it into an element that scrolls sideways when it is too wide.

## `text`

Plain text without formatting. With "multiline: true" line breaks become `<br>` alone: an editable field shows a line break next to it as a second one and reads it back doubled.

## `video`

A video from the media library with an optional image before it starts:

```
{"media": "01J…", "poster": "01J…"}
```

`{{ field('video') }}` gives a `<video>` with controls and one `<source>` per file of the video, the most efficient codec first and H.264 last, each with its codec in the type, so a browser skips what it cannot play. The description of the medium names the player. Without a poster the browser loads the first data of the film to show its first picture.
