<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Php\PhpHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(PhpHandler::class)]
final class PhpScreenTest extends BackendTestCase
{
    public function testShowsPhpWithItsExtensions(): void
    {
        $this->createUser('root@example.org', ['superuser']);
        $session = $this->signIn('root@example.org');

        $html = $this->html($this->request('GET', '/cms/php', session: $session));
        self::assertStringContainsString('<h1 class="fb-heading-1">PHP</h1>', $html);
        self::assertStringContainsString(\PHP_VERSION, $html);
        self::assertStringContainsString('<code class="fb-list__title">memory_limit</code>', $html);
        self::assertStringContainsString('<summary class="fb-disclosure__summary">Core', $html);
        self::assertStringContainsString('href="/cms/php"', $html, 'The menu leads there.');

        $found = $this->html($this->request('GET', '/cms/php?search=upload_max', session: $session));
        self::assertStringContainsString('value="upload_max"', $found);
        self::assertStringContainsString('<details class="fb-card fb-disclosure" open>', $found);
        self::assertStringNotContainsString('<summary class="fb-disclosure__summary">date', $found);

        self::assertStringContainsString('No extension or setting has nothing-like-this in its name.', $this->html($this->request('GET', '/cms/php?search=nothing-like-this', session: $session)));
    }

    public function testOnlySuperusersSeeIt(): void
    {
        $this->createUser('admin@example.org', ['admin']);

        self::assertSame(403, $this->request('GET', '/cms/php', session: $this->signIn('admin@example.org'))->getStatusCode());
    }
}
