<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Site\SiteHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Site\PublishSite;
use Frootbox\Core\Site\UpdateSite;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * The screen "Fields of the website" (decision 0348).
 */
#[CoversClass(SiteHandler::class)]
final class SiteScreenTest extends BackendTestCase
{
    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createUser('editor@example.org', ['editor']);
        $this->session = $this->signIn('editor@example.org');
    }

    public function testShowsTheFieldsByLanguage(): void
    {
        $this->runner()->run(new UpdateSite('de', ['brand' => 'Bohnenglück', 'address' => 'Hafenstraße 12', 'links' => [['text' => 'Instagram']]]), Context::system());
        $this->runner()->run(new UpdateSite('en', ['brand' => 'Bean luck']), Context::system());

        $html = $this->html($this->request('GET', '/cms/site', session: $this->session));
        self::assertStringContainsString('<h1 class="fb-heading-1">Website-Felder</h1>', $html);
        self::assertStringContainsString('/cms/site"', $html, 'Editors have it in the menu.');
        self::assertStringContainsString('<fb-form action="site.update"', $html);
        self::assertStringContainsString('<input type="hidden" name="language" value="de">', $html);
        self::assertMatchesRegularExpression('~name="fields\.brand"[^>]*value="Bohnenglück"|value="Bohnenglück"[^>]*name="fields\.brand"~', $html);
        self::assertMatchesRegularExpression('~<input[^>]*maxlength="40"~', $html, 'The settings of the field count.');
        self::assertStringContainsString('1 Eintrag. Listen änderst Du auf der Website.', $html);
        self::assertStringContainsString('<input type="hidden" name="next" value="/">', $html);
        self::assertStringNotContainsString('Ein leeres Feld zeigt den Wert', $html, 'Not in the first language.');

        $english = $this->html($this->request('GET', '/cms/site?language=en', session: $this->session));
        self::assertStringContainsString('<input type="hidden" name="language" value="en">', $english);
        self::assertStringContainsString('Ein leeres Feld zeigt den Wert in Deutsch.', $english);
        self::assertMatchesRegularExpression('~value="Bean luck"~', $english);
        self::assertMatchesRegularExpression('~placeholder="Hafenstraße 12"~', $english, 'A field without its own value shows the first language.');
        self::assertStringContainsString('1 Eintrag · wie in Deutsch.', $english);
        self::assertStringContainsString('<input type="hidden" name="next" value="/en">', $english);
    }

    public function testSavesAndRestores(): void
    {
        $this->runner()->run(new UpdateSite('de', ['brand' => 'Bohnenglück']), Context::system());
        $this->runner()->run(new PublishSite(), Context::system());

        $saved = $this->action('site.update', ['language' => 'en', 'fields' => ['brand' => 'Bean luck', 'address' => null]], $this->session);
        self::assertIsArray($saved['data']);
        self::assertTrue($saved['data']['draft']);
        self::assertIsArray($saved['data']['own']);
        self::assertSame(['brand' => 'Bean luck'], $saved['data']['own']['en']);

        $html = $this->html($this->request('GET', '/cms/site', session: $this->session));
        self::assertStringContainsString('<fb-form action="site.publish"', $html);
        self::assertStringContainsString('commandfor="site-discard"', $html);
        self::assertStringContainsString('Werte im Entwurf', $html);
        self::assertStringContainsString('Version 1', $html);

        $this->action('site.publish', [], $this->session);
        $html = $this->html($this->request('GET', '/cms/site', session: $this->session));
        self::assertStringContainsString('<fb-form action="site.restore"', $html, 'The earlier version can come back.');
        self::assertStringContainsString('aria-label="Version 1 wiederherstellen"', $html);

        $restored = $this->action('site.restore', ['version' => 1], $this->session);
        self::assertIsArray($restored['data']);
        self::assertTrue($restored['data']['draft']);
        self::assertIsArray($restored['data']['own']);
        self::assertSame([], $restored['data']['own']['en']);
    }

    public function testNeedsThePermission(): void
    {
        $this->createUser('nobody@example.org', []);
        $nobody = $this->signIn('nobody@example.org');

        self::assertSame(403, $this->request('GET', '/cms/site', session: $nobody)->getStatusCode());
        self::assertStringNotContainsString('/cms/site"', $this->html($this->request('GET', '/cms', session: $nobody)));
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site')))], 'backend-site-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']], 'backend' => ['language' => 'de']];
    }
}
