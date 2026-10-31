<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Design\Design;
use Frootbox\Backend\Http\DesignHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Live with the brand of an extension: the design page only for
 * superusers, the brand everywhere.
 */
#[CoversClass(DesignHandler::class)]
#[CoversClass(Design::class)]
final class DesignPageTest extends BackendTestCase
{
    public function testOnlySuperusersSeeTheDesignPageLive(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $this->createUser('root@example.org', ['superuser']);

        $editor = $this->signIn('editor@example.org');
        self::assertSame(403, $this->request('GET', '/cms/design', session: $editor)->getStatusCode());
        self::assertStringNotContainsString('/cms/design', $this->html($this->request('GET', '/cms', session: $editor)), 'The menu hides it.');

        $root = $this->signIn('root@example.org');
        $response = $this->request('GET', '/cms/design', session: $root);
        $html = $this->html($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('href="/cms/design" aria-current="page"', $html);
        self::assertStringContainsString('data-theme="dark" data-design-mode="dark"', $html);
        self::assertStringContainsString('<code>--fb-space-4</code>', $html);
    }

    public function testShowsTheBrandOfAnExtension(): void
    {
        $html = $this->html($this->request('GET', '/cms/login'));

        self::assertStringContainsString('<title>Sign in · Acme CMS</title>', $html);
        self::assertStringContainsString('src="/assets/acme/brand/assets/logo.svg?v=', $html);
        self::assertStringContainsString('--fb-accent:#ffd84d;', $html);
        self::assertStringContainsString('--fb-accent-hover:#ffe066;', $html, 'The dark value.');
        self::assertStringNotContainsString('Frootbox', $html);

        $this->createUser('root@example.org', ['superuser']);
        $design = $this->html($this->request('GET', '/cms/design', session: $this->signIn('root@example.org')));
        self::assertStringContainsString('Too little contrast', $design);
    }

    protected function environment(): Environment
    {
        return Environment::Production;
    }

    protected function extensions(): Extensions
    {
        $brand = ExtensionPackage::fromManifest('acme/brand', (string) realpath(__DIR__ . '/../Fixtures/Brand'));

        return new Extensions([self::backend(), $brand], 'backend-brand-tests');
    }
}
