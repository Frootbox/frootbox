<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Tests;

use Frootbox\RichText\Attribute;
use Frootbox\RichText\Content;
use Frootbox\RichText\Document;
use Frootbox\RichText\Html;
use Frootbox\RichText\Marks\Link;
use Frootbox\RichText\Marks\TagMark;
use Frootbox\RichText\Nodes\CodeBlock;
use Frootbox\RichText\Nodes\Doc;
use Frootbox\RichText\Nodes\Heading;
use Frootbox\RichText\Nodes\OrderedList;
use Frootbox\RichText\Nodes\TagNode;
use Frootbox\RichText\NodeType;
use Frootbox\RichText\Reader;
use Frootbox\RichText\RichText;
use Frootbox\RichText\Schema;
use Frootbox\RichText\Tree\Mark;
use Frootbox\RichText\Violation;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(RichText::class)]
#[CoversClass(Reader::class)]
#[CoversClass(Document::class)]
#[CoversClass(Schema::class)]
#[CoversClass(Attribute::class)]
#[CoversClass(Content::class)]
#[CoversClass(Html::class)]
#[CoversClass(Violation::class)]
#[CoversClass(Mark::class)]
#[CoversClass(Doc::class)]
#[CoversClass(TagNode::class)]
#[CoversClass(Heading::class)]
#[CoversClass(OrderedList::class)]
#[CoversClass(CodeBlock::class)]
#[CoversClass(TagMark::class)]
#[CoversClass(Link::class)]
final class RichTextTest extends TestCase
{
    public function testRendersTheStandardNodes(): void
    {
        $document = self::doc(
            ['type' => 'heading', 'attrs' => ['level' => 2], 'content' => [self::text('Title')]],
            self::paragraph(self::text('One'), ['type' => 'hardBreak'], self::text('two')),
            ['type' => 'bulletList', 'content' => [['type' => 'listItem', 'content' => [self::paragraph(self::text('Item'))]]]],
            ['type' => 'orderedList', 'attrs' => ['start' => 3], 'content' => [['type' => 'listItem', 'content' => [self::paragraph(self::text('Third'))]]]],
            ['type' => 'blockquote', 'content' => [self::paragraph(self::text('Quote'))]],
            ['type' => 'codeBlock', 'attrs' => ['language' => 'php'], 'content' => [self::text('echo "<b>";')]],
            ['type' => 'horizontalRule'],
            self::paragraph(),
        );

        self::assertSame(
            '<h2>Title</h2><p>One<br>two</p><ul><li><p>Item</p></li></ul><ol start="3"><li><p>Third</p></li></ol>'
            . '<blockquote><p>Quote</p></blockquote><pre><code class="language-php">echo &quot;&lt;b&gt;&quot;;</code></pre><hr><p></p>',
            RichText::standard()->toHtml($document),
        );
        self::assertSame([], RichText::standard()->validate($document));
    }

    public function testKeepsSharedMarksOpen(): void
    {
        $link = ['type' => 'link', 'attrs' => ['href' => 'https://example.com', 'target' => '_blank']];
        $document = self::doc(self::paragraph(
            self::text('Read ', [['type' => 'bold']]),
            self::text('the ', [['type' => 'bold'], $link]),
            self::text('docs', [$link, ['type' => 'italic']]),
            self::text('!'),
        ));

        self::assertSame(
            '<p><strong>Read </strong><a href="https://example.com" target="_blank" rel="noopener noreferrer"><strong>the </strong><em>docs</em></a>!</p>',
            RichText::standard()->toHtml($document),
        );
    }

    public function testEscapesTextAndAttributes(): void
    {
        $document = self::doc(self::paragraph(
            self::text('<script>alert(1)</script>'),
            self::text('x', [['type' => 'link', 'attrs' => ['href' => '/search?q="><svg/onload=alert(1)>']]]),
        ));

        self::assertSame(
            '<p>&lt;script&gt;alert(1)&lt;/script&gt;<a href="/search?q=&quot;&gt;&lt;svg/onload=alert(1)&gt;">x</a></p>',
            RichText::standard()->toHtml($document),
        );
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function unsafeUrls(): iterable
    {
        yield 'javascript' => ['javascript:alert(1)'];
        yield 'upper case' => ['JavaScript:alert(1)'];
        yield 'hidden by a tab' => ["java\tscript:alert(1)"];
        yield 'data' => ['data:text/html,<script>alert(1)</script>'];
        yield 'vbscript' => ['vbscript:msgbox(1)'];
    }

    #[DataProvider('unsafeUrls')]
    public function testDropsLinksWithUnsafeUrls(string $href): void
    {
        $document = self::doc(self::paragraph(self::text('click', [['type' => 'link', 'attrs' => ['href' => $href]]])));
        $read = RichText::standard()->read($document);

        self::assertSame('<p>click</p>', $read->toHtml());
        self::assertSame('/content/0/content/0/marks/0/attrs/href', $read->violations[0]->pointer);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function safeUrls(): iterable
    {
        yield 'https' => ['https://example.com/a?b=c#d'];
        yield 'relative' => ['/contact'];
        yield 'anchor' => ['#top'];
        yield 'mail' => ['mailto:jane@example.com'];
        yield 'phone' => ['tel:+49301234567'];
        yield 'colon later' => ['/path:with-colon'];
    }

    #[DataProvider('safeUrls')]
    public function testKeepsSafeUrls(string $href): void
    {
        $document = self::doc(self::paragraph(self::text('x', [['type' => 'link', 'attrs' => ['href' => $href]]])));

        self::assertSame('<p><a href="' . Html::escape($href) . '">x</a></p>', RichText::standard()->toHtml($document));
    }

    public function testReportsAndLeavesOutWhatDoesNotFit(): void
    {
        $document = self::doc(
            ['type' => 'heading', 'attrs' => ['level' => 9, 'onclick' => 'x'], 'content' => [self::text('H')]],
            ['type' => 'image', 'attrs' => ['src' => 'x.jpg']],
            self::text('loose text'),
            self::paragraph(self::text('a', [['type' => 'blink']]), ['type' => 'paragraph']),
            ['type' => 'bulletList', 'content' => [self::paragraph(self::text('not an item'))]],
            ['type' => 'codeBlock', 'content' => [self::text('x', [['type' => 'bold']])]],
            ['type' => 'horizontalRule', 'content' => [self::text('x')]],
            self::paragraph(['type' => 'text', 'text' => '']),
            'nonsense',
        );

        $read = RichText::standard()->read($document);

        self::assertSame('<h1>H</h1><p>a</p><ul></ul><pre><code>x</code></pre><hr><p></p>', $read->toHtml());
        self::assertFalse($read->isValid());
        self::assertSame([
            '/content/0/attrs/level: must be one of 1, 2, 3, 4, 5, 6',
            '/content/1/type: unknown node "image"',
            '/content/2: text is not allowed in "doc"',
            '/content/3/content/0/marks/0/type: unknown mark "blink"',
            '/content/3/content/1: "paragraph" is not allowed in "paragraph"',
            '/content/4/content/0: "paragraph" is not allowed in "bulletList"',
            '/content/5/content/0/marks: marks are not allowed in "codeBlock"',
            '/content/6/content: "horizontalRule" has no content',
            '/content/7/content/0/text: must be text, not empty',
            '/content/8: must be a node with a "type"',
        ], array_map(strval(...), $read->violations));
    }

    public function testReadsJsonStringsAndEmptyDocuments(): void
    {
        $richText = RichText::standard();

        self::assertSame('<p>Hi</p>', $richText->toHtml((string) json_encode(self::doc(self::paragraph(self::text('Hi'))))));
        self::assertSame('', $richText->toHtml(null));
        self::assertTrue($richText->read('')->isEmpty());
        self::assertSame(['/: is not valid JSON'], array_map(strval(...), $richText->validate('{nope')));
        self::assertSame(['/: must be a document with "type": "doc"'], array_map(strval(...), $richText->validate(['type' => 'paragraph'])));
        self::assertSame(['/content: must be a list of nodes'], array_map(strval(...), $richText->validate(['type' => 'doc', 'content' => 'x'])));
    }

    public function testStopsAtDeepNesting(): void
    {
        $node = self::paragraph(self::text('deep'));

        for ($level = 0; $level < 150; ++$level) {
            $node = ['type' => 'blockquote', 'content' => [$node]];
        }

        $violations = RichText::standard()->validate(self::doc($node));

        self::assertCount(1, $violations);
        self::assertSame('is nested too deeply', $violations[0]->message);
    }

    public function testTurnsDocumentsIntoPlainText(): void
    {
        $document = self::doc(
            ['type' => 'heading', 'content' => [self::text('Title')]],
            self::paragraph(self::text('One', [['type' => 'bold']]), ['type' => 'hardBreak'], self::text('two')),
            ['type' => 'bulletList', 'content' => [
                ['type' => 'listItem', 'content' => [self::paragraph(self::text('A'))]],
                ['type' => 'listItem', 'content' => [self::paragraph(self::text('B'))]],
            ]],
            self::paragraph(),
            self::paragraph(),
            self::paragraph(self::text('End <3')),
        );

        self::assertSame("Title\nOne\ntwo\nA\nB\n\nEnd <3", RichText::standard()->toText($document));
    }

    public function testSchemaCanBeChanged(): void
    {
        $callout = new class implements NodeType {
            public function name(): string
            {
                return 'callout';
            }

            public function isInline(): bool
            {
                return false;
            }

            public function content(): Content
            {
                return Content::inline();
            }

            public function attributes(): array
            {
                return ['tone' => Attribute::choice(['info', 'warning'], 'info')];
            }

            public function toHtml(array $attributes, string $content): string
            {
                return Html::element('aside', $content, ['class' => 'callout callout-' . (string) $attributes['tone']]);
            }

            public function toText(array $attributes, string $content): string
            {
                return $content . "\n";
            }
        };

        $richText = RichText::standard()
            ->withNode($callout)
            ->withNode(new Heading([2, 3]))
            ->withMark(new Link(['https']));
        $richText = new RichText($richText->schema->withoutNode('blockquote')->withoutMark('underline'));

        $document = self::doc(
            ['type' => 'callout', 'attrs' => ['tone' => 'warning'], 'content' => [self::text('Careful', [['type' => 'underline']])]],
            ['type' => 'heading', 'attrs' => ['level' => 1], 'content' => [self::text('H')]],
            ['type' => 'blockquote', 'content' => []],
            self::paragraph(self::text('x', [['type' => 'link', 'attrs' => ['href' => 'mailto:a@b.c']]])),
        );

        $read = $richText->read($document);

        self::assertSame('<aside class="callout callout-warning">Careful</aside><h2>H</h2><p>x</p>', $read->toHtml());
        self::assertSame([
            '/content/0/content/0/marks/0/type: unknown mark "underline"',
            '/content/1/attrs/level: must be one of 2, 3',
            '/content/2/type: unknown node "blockquote"',
            '/content/3/content/0/marks/0/attrs/href: must use one of the protocols https',
        ], array_map(strval(...), $read->violations));
    }

    public function testLetsThePageDecideTheLevelOfARank(): void
    {
        $seen = [];
        $richText = RichText::standard()->withNode(new Heading([1, 2, 3], static function (int $rank, string $content) use (&$seen): int {
            $seen[] = $content;

            return min(6, $rank + 2);
        }));

        $document = self::doc(
            ['type' => 'heading', 'attrs' => ['level' => 1], 'content' => [self::text('Beans')]],
            ['type' => 'heading', 'attrs' => ['level' => 2], 'content' => [self::text('From <Kenya>')]],
            ['type' => 'heading', 'attrs' => ['level' => 4], 'content' => [self::text('Too deep')]],
        );

        $read = $richText->read($document);

        self::assertSame('<h3 data-rank="1">Beans</h3><h4 data-rank="2">From &lt;Kenya&gt;</h4><h3 data-rank="1">Too deep</h3>', $read->toHtml());
        self::assertSame(['Beans', 'From &lt;Kenya&gt;', 'Too deep'], $seen);
        self::assertSame(['/content/2/attrs/level: must be one of 1, 2, 3'], array_map(strval(...), $read->violations));
    }

    public function testAttributesCheckTheirValues(): void
    {
        self::assertSame([5, null], Attribute::integer(1, min: 0, max: 10)->clean(5));
        self::assertSame([1, 'must be between 0 and 10'], Attribute::integer(1, min: 0, max: 10)->clean(11));
        self::assertSame([1, 'must be a whole number'], Attribute::integer(1)->clean('5'));
        self::assertSame(['abc', null], Attribute::text(maxLength: 3)->clean(' abc '));
        self::assertSame([null, 'must be at most 3 characters'], Attribute::text(maxLength: 3)->clean('abcd'));
        self::assertSame([null, 'must be text'], Attribute::text()->clean(5));
        self::assertSame([null, 'has an invalid format'], Attribute::text(pattern: '/^[a-z]+$/')->clean('A1'));
        self::assertSame([null, 'is required'], Attribute::url(required: true)->clean(null));
        self::assertSame([null, 'must be a URL'], Attribute::url()->clean(''));
        self::assertSame([null, 'must not contain spaces or control characters'], Attribute::url()->clean('/a b'));
    }

    /**
     * @param mixed ...$content
     *
     * @return array<mixed>
     */
    private static function doc(mixed ...$content): array
    {
        return ['type' => 'doc', 'content' => array_values($content)];
    }

    /**
     * @param array<mixed> ...$content
     *
     * @return array<mixed>
     */
    private static function paragraph(array ...$content): array
    {
        return [] === $content ? ['type' => 'paragraph'] : ['type' => 'paragraph', 'content' => array_values($content)];
    }

    /**
     * @param list<array<mixed>> $marks
     *
     * @return array<mixed>
     */
    private static function text(string $text, array $marks = []): array
    {
        return [] === $marks ? ['type' => 'text', 'text' => $text] : ['type' => 'text', 'text' => $text, 'marks' => $marks];
    }
}
