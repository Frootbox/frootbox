<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\BackendErrorPage;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Config\Environment;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(BackendErrorPage::class)]
final class ErrorPageLiveTest extends BackendTestCase
{
    public function testHidesDetailsLive(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        $response = $this->request('GET', '/cms/pages/01JZZZZZZZZZZZZZZZZZZZZZZZ', session: $session);
        $html = (string) $response->getBody();

        self::assertSame(404, $response->getStatusCode());
        self::assertStringContainsString('This does not exist (anymore)', $html);
        self::assertStringNotContainsString('Technical details', $html);
        self::assertStringNotContainsString('EntityNotFoundException', $html);
    }

    protected function environment(): Environment
    {
        return Environment::Production;
    }
}
