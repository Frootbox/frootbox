<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\BackendExtension;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Routing\Router;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * The backend under another address and in German.
 */
#[CoversClass(BackendExtension::class)]
final class BackendPathTest extends BackendTestCase
{
    public function testTheBackendMovesWithBackendPath(): void
    {
        self::assertSame('/verwaltung/login', $this->request('GET', '/verwaltung')->getHeaderLine('Location'));
        self::assertSame(404, $this->request('GET', '/cms/login')->getStatusCode());

        $html = $this->html($this->request('GET', '/verwaltung/login'));
        self::assertStringContainsString('<html lang="de"', $html);
        self::assertStringContainsString('<title>Anmelden · Frootbox</title>', $html);
        self::assertStringContainsString('action="/verwaltung/login"', $html);

        $this->createUser('jane@example.org', ['editor']);
        $response = $this->request('POST', '/verwaltung/login', ['email' => 'jane@example.org', 'password' => self::PASSWORD]);
        self::assertSame('/verwaltung', $response->getHeaderLine('Location'));
    }

    public function testThePathIsReservedAsSlug(): void
    {
        self::assertContains('verwaltung', $this->get(Router::class)->reservedSegments());
        self::assertNotContains('cms', $this->get(Router::class)->reservedSegments());
    }

    protected function config(): array
    {
        return ['backend' => ['path' => '/verwaltung'], 'languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']]];
    }
}
