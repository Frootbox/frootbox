<!-- Written by bin/frootbox reference:build from the code. Do not edit. -->

# Field types

Every field of a block, a website or an object has a type, e.g.
`title: { type: headline }`. Extensions add their own with
`$registry->fieldType()` and `#[AsFieldType]`, named after their package.

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
