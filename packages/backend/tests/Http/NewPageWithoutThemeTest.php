<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Pages\NewPageHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Without a theme there is no layout, so a new page cannot be created.
 */
#[CoversClass(NewPageHandler::class)]
final class NewPageWithoutThemeTest extends BackendTestCase
{
    public function testSaysWhereLayoutsComeFromInsteadOfAFormThatCannotWork(): void
    {
        $this->createUser('editor@example.org', ['admin']);
        $html = $this->html($this->request('GET', '/cms/pages/new', session: $this->signIn('editor@example.org')));

        self::assertStringContainsString('There is no layout for a page yet.', $html);
        self::assertStringContainsString('Layouts come from the theme.', $html);
        self::assertStringNotContainsString('action="page.create"', $html, 'No form that only answers "layout is required".');
    }
}
