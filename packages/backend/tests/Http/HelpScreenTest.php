<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Help\HelpHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Backend\View\HelpLink;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(HelpHandler::class)]
#[CoversClass(HelpLink::class)]
final class HelpScreenTest extends BackendTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->createUser('editor@example.org', ['editor']);
        $this->createUser('admin@example.org', ['admin']);
    }

    public function testEveryScreenHasTheHelpAboutIt(): void
    {
        $session = $this->signIn('editor@example.org');

        $pages = $this->html($this->request('GET', '/cms/pages', session: $session));
        self::assertStringContainsString('<fb-help src="/cms/help/frootbox/backend/pages" base="/cms/help"', $pages);
        self::assertStringContainsString('Hilfe: Seiten', $pages);

        $media = $this->html($this->request('GET', '/cms/media', session: $session));
        self::assertStringContainsString('<fb-help src="/cms/help/frootbox/backend/media"', $media, 'Found by the screen.');
    }

    public function testShowsAPageWithTheTopicsTheUserMayRead(): void
    {
        $html = $this->html($this->request('GET', '/cms/help/frootbox/backend/pages', session: $this->signIn('editor@example.org')));

        self::assertStringContainsString('<title>Seiten · Hilfe', $html);
        self::assertStringContainsString('<h2 id="seite-verschieben">Seite verschieben</h2>', $html);
        self::assertStringContainsString('href="/cms/help/frootbox/backend/start">Erste Schritte</a>', $html);
        self::assertStringContainsString('aria-current="page">Seiten</a>', $html);
        self::assertStringContainsString('Blöcke dieser Website', $html, 'Written from the installation.');
        self::assertStringNotContainsString('Benutzer und Rollen', $html, 'Editors may not see users.');
        self::assertStringNotContainsString('<fb-help', $html, 'No help button on the help.');
    }

    public function testAnswersThePanelWithJson(): void
    {
        $response = $this->request('GET', '/cms/help/frootbox/backend/pages', session: $this->signIn('editor@example.org'), headers: ['Accept' => 'application/json']);
        $body = json_decode((string) $response->getBody(), true, flags: \JSON_THROW_ON_ERROR);

        self::assertIsArray($body);
        self::assertIsArray($body['data']);
        self::assertSame(['Seiten', '/cms/help/frootbox/backend/pages', true], [$body['data']['title'], $body['data']['url'], $body['data']['translated']]);
        self::assertIsString($body['data']['html']);
        self::assertStringContainsString('<strong>Sitemap</strong>', $body['data']['html']);
    }

    public function testHidesPagesTheUserMayNotRead(): void
    {
        $editor = $this->signIn('editor@example.org');

        self::assertSame(404, $this->request('GET', '/cms/help/frootbox/backend/users', session: $editor)->getStatusCode());
        self::assertSame(404, $this->request('GET', '/cms/help/frootbox/backend/nothing', session: $editor)->getStatusCode());
        self::assertSame(200, $this->request('GET', '/cms/help/frootbox/backend/users', session: $this->signIn('admin@example.org'))->getStatusCode());
        self::assertSame(401, $this->request('GET', '/cms/help/frootbox/backend/pages', headers: ['Accept' => 'application/json'])->getStatusCode());
    }

    public function testShowsTheHelpOfTheBrand(): void
    {
        $html = $this->html($this->request('GET', '/cms/help', session: $this->signIn('editor@example.org')));

        self::assertStringContainsString('Hilfe von Acme Agency', $html);
        self::assertStringContainsString('<a href="https://acme.example/support" rel="noopener">acme.example/support</a>', $html);
        self::assertStringContainsString('<a href="tel:+49301234567">+49 30 1234567</a>', $html);
        self::assertStringContainsString('Wähl ein Thema', $html);
    }

    public function testTheSearchFindsHelp(): void
    {
        $response = $this->request('GET', '/cms/search?q=sitemap', session: $this->signIn('editor@example.org'), headers: ['Accept' => 'application/json']);
        $body = json_decode((string) $response->getBody(), true, flags: \JSON_THROW_ON_ERROR);

        self::assertIsArray($body);
        self::assertIsArray($body['data']);
        $urls = [];

        foreach ($body['data'] as $group) {
            self::assertIsArray($group);
            self::assertIsArray($group['items']);

            if ('Hilfe' === $group['title']) {
                foreach ($group['items'] as $item) {
                    self::assertIsArray($item);
                    $urls[] = $item['url'];
                }
            }
        }

        self::assertContains('/cms/help/frootbox/backend/pages', $urls);
    }

    protected function extensions(): Extensions
    {
        $brand = ExtensionPackage::fromManifest('acme/brand', (string) realpath(__DIR__ . '/../Fixtures/Brand'));

        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site'))), $brand], 'backend-help-tests');
    }

    protected function config(): array
    {
        return ['theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }
}
