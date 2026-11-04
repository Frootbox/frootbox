# frootbox/rich-text

Read, validate and render [Tiptap](https://tiptap.dev) and ProseMirror JSON
in PHP: safe HTML, plain text, and clear error messages. No dependencies.

Part of [Frootbox](https://github.com/Frootbox/frootbox), usable in any PHP
project. MIT licensed.

```php
use Frootbox\RichText\RichText;

$richText = RichText::standard();

echo $richText->toHtml($json);   // <p>Hello <strong>world</strong></p>
echo $richText->toText($json);   // Hello world

foreach ($richText->validate($json) as $violation) {
    echo $violation;             // /content/0/marks/0/attrs/href: must use one of the protocols http, https, mailto, tel
}
```

`$json` may be a JSON string, the decoded array, or `null` for an empty
document.

## Safe by default

- Only nodes, marks and attributes of the schema reach the output.
  Everything else is left out and reported by `validate()`.
- Text and attribute values are escaped.
- Links accept relative URLs and `http`, `https`, `mailto` and `tel` only.
  `javascript:` and tricks like `java\tscript:` never pass. A link that
  opens in a new window gets `rel="noopener noreferrer"`.
- Deeply nested documents are cut off.

Store documents only after `validate()` returned no violations, and render
them with the same schema.

## Standard schema

Nodes: `paragraph`, `heading`, `blockquote`, `bulletList`, `orderedList`,
`listItem`, `codeBlock`, `hardBreak`, `horizontalRule`.

Marks: `link`, `bold`, `italic`, `underline`, `strike`, `subscript`,
`superscript`, `code`.

`paragraph`, `heading` and `blockquote` take an optional `dir`, `ltr` or
`rtl`, for text that runs the other way than the text around it, e.g. an
English quote in an Arabic text: `{"type": "paragraph", "attrs": {"dir":
"ltr"}, …}` becomes `<p dir="ltr">…</p>`.

## From HTML

`HtmlReader` turns HTML, e.g. from an older CMS, into a document of the
standard schema. Wrappers such as `<div>` are unwrapped, whitespace is
collapsed as a browser does, `h1` to `h4` become headings of rank 1 to 3.
What has no counterpart, such as images or tables, is left out and named
by `dropped()`. A callback may change or remove each link:

```php
$reader = new HtmlReader(fn(string $href): ?string => $href === 'old-page' ? '/new-page' : $href);
$json = $reader->read('<div><p>Hello <b>world</b></p></div>');
```

## Own nodes and marks

```php
use Frootbox\RichText\Attribute;
use Frootbox\RichText\Content;
use Frootbox\RichText\Html;
use Frootbox\RichText\NodeType;

final class Callout implements NodeType
{
    public function name(): string { return 'callout'; }
    public function isInline(): bool { return false; }
    public function content(): Content { return Content::inline(); }

    public function attributes(): array
    {
        return ['tone' => Attribute::choice(['info', 'warning'], 'info')];
    }

    public function toHtml(array $attributes, string $content): string
    {
        return Html::element('aside', $content, ['class' => 'callout-' . $attributes['tone']]);
    }

    public function toText(array $attributes, string $content): string
    {
        return $content . "\n";
    }
}

$richText = RichText::standard()
    ->withNode(new Callout())
    ->withNode(new Heading([2, 3]))   // no <h1> in content
    ->withMark(new Link(['https']));  // https links only
```

With a function for the level, the stored level of a heading is a rank
and the page decides the level, e.g. from where the text stands. The rank
goes along as `data-rank` for the styles:

```php
$richText = RichText::standard()
    ->withNode(new Heading([1, 2, 3], fn(int $rank, string $content): int => $rank + 1));
// {"type": "heading", "attrs": {"level": 1}, …} becomes <h2 data-rank="1">…</h2>
```

Attributes check their values with `Attribute::integer()`,
`Attribute::choice()`, `Attribute::text()` and `Attribute::url()`. Marks
implement `MarkType` with `open()` and `close()`.

Marks are nested in the order of the schema, so a link over partly bold
text stays one `<a>`.

## Source and issues

This package is developed in the [Frootbox monorepo](https://github.com/Frootbox/frootbox)
and mirrored here read-only. Questions, bugs and ideas go there, see the
[documentation](https://github.com/Frootbox/frootbox/tree/main/documentation).
