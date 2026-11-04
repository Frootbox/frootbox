<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Tests;

use Frootbox\RichText\HtmlReader;
use Frootbox\RichText\RichText;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(HtmlReader::class)]
final class HtmlReaderTest extends TestCase
{
    /**
     * @return iterable<string, array{string, string}>
     */
    public static function html(): iterable
    {
        yield 'paragraphs and whitespace' => ["\n<p>\n    We roast\n    on Mondays.\n</p>\n<p>  Ship on Tuesdays  </p>", '<p>We roast on Mondays.</p><p>Ship on Tuesdays</p>'];
        yield 'breaks' => ["<p>\n    Mo.–Fr. 08:00 Uhr<br>Sa. 10:00 Uhr<br>\n</p>", '<p>Mo.–Fr. 08:00 Uhr<br>Sa. 10:00 Uhr</p>'];
        yield 'marks' => ['<p>A <b>bold</b>, <i>slanted</i> and <strong><em>both</em></strong> word.</p>', '<p>A <strong>bold</strong>, <em>slanted</em> and <strong><em>both</em></strong> word.</p>'];
        yield 'link' => ['<p><a href="https://example.org/" target="_blank">Elsewhere</a></p>', '<p><a href="https://example.org/" target="_blank" rel="noopener noreferrer">Elsewhere</a></p>'];
        yield 'text outside a block' => ['Loose <b>text</b><p>Then a paragraph</p>after it', '<p>Loose <strong>text</strong></p><p>Then a paragraph</p><p>after it</p>'];
        yield 'wrappers' => ['<div class="x"><div><span style="color:red">Inside</span></div></div>', '<p>Inside</p>'];
        yield 'headings by rank' => ['<h2>One</h2><h3>Two</h3><h4>Three</h4>', '<h1>One</h1><h2>Two</h2><h3>Three</h3>'];
        yield 'lists' => ['<ul><li>First</li><li><p>Second</p><ul><li>Inner</li></ul></li></ul><ol><li>A</li></ol>', '<ul><li><p>First</p></li><li><p>Second</p><ul><li><p>Inner</p></li></ul></li></ul><ol><li><p>A</p></li></ol>'];
        yield 'quote and rule' => ['<blockquote><p>Said</p></blockquote><hr>', '<blockquote><p>Said</p></blockquote><hr>'];
        yield 'empty paragraphs' => ['<p>&nbsp;</p><p> </p><p>Text&nbsp;here</p>', "<p>Text\u{a0}here</p>"];
        yield 'nothing' => ['', ''];
    }

    #[DataProvider('html')]
    public function testReadsHtml(string $html, string $expected): void
    {
        $document = new HtmlReader()->read($html);

        self::assertSame([], RichText::standard()->validate($document), 'The result fits the schema.');
        self::assertSame($expected, RichText::standard()->toHtml($document));
    }

    public function testNamesWhatItLeavesOut(): void
    {
        $reader = new HtmlReader();
        $document = $reader->read('<p>Before<img src="a.jpg"> after</p><table><tr><td>Cell</td></tr></table><script>alert(1)</script>');

        self::assertSame('<p>Before after</p>', RichText::standard()->toHtml($document));
        self::assertSame(['img', 'script', 'table'], $reader->dropped());
    }

    public function testLinksPassTheCallback(): void
    {
        $reader = new HtmlReader(static fn(string $href): ?string => match ($href) {
            'kontakt' => 'page:01JABCDEFGHJKMNPQRSTVWXYZ0',
            'gone' => null,
            default => $href,
        });
        $document = $reader->read('<p><a href="kontakt">Contact</a>, <a href="gone">gone</a>, <a href="mailto:a@example.org">mail</a></p>');

        // The standard schema knows no pages, the CMS adds them (decision 0105).
        $link = static fn(string $href, string $text): array => ['type' => 'text', 'text' => $text, 'marks' => [['type' => 'link', 'attrs' => ['href' => $href]]]];
        self::assertSame([$link('page:01JABCDEFGHJKMNPQRSTVWXYZ0', 'Contact'), ['type' => 'text', 'text' => ', gone, '], $link('mailto:a@example.org', 'mail')], $document['content'][0]['content'] ?? null);
    }
}
