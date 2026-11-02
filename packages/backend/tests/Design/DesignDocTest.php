<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Design;

use Frootbox\Backend\Design\DesignDoc;
use Frootbox\Backend\Design\DesignException;
use Frootbox\Backend\Design\Tokens;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(DesignDoc::class)]
final class DesignDocTest extends TestCase
{
    public function testTheTablesInDesignMdMatchTheTokens(): void
    {
        $document = (string) file_get_contents(DesignDoc::FILE);

        self::assertSame(new DesignDoc(Tokens::fromFile())->apply($document), $document, 'DESIGN.md is behind tokens.yaml. Run: composer design-doc');
    }

    public function testWritesEveryTokenAndThePairs(): void
    {
        $tables = new DesignDoc(Tokens::fromFile())->tables();

        self::assertStringContainsString("#### Brand: color\n\n| Token | Light | Dark | Use |", $tables);
        self::assertStringContainsString('| `--fb-accent` | `#8637ff` | `#a57cff` | Primary buttons, selected items, tab and tree markers |', $tables);
        self::assertStringContainsString('| `--fb-space-4` | `16px` |  |', $tables);
        self::assertStringContainsString('| `on-accent` | `accent` | 5.24 | 6.03 |', $tables);
    }

    public function testNeedsTheMarkers(): void
    {
        $this->expectException(DesignException::class);
        $this->expectExceptionMessage('DESIGN.md needs the markers <!-- tokens:start --> and <!-- tokens:end -->.');
        new DesignDoc(Tokens::fromFile())->apply("# Design\n");
    }
}
