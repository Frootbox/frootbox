<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Search\BackendSearch;
use Frootbox\Backend\Http\Search\SearchHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Backend\View\Menu;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Tests\Fixtures\Notes\CreateNote;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(SearchHandler::class)]
#[CoversClass(BackendSearch::class)]
#[CoversClass(Menu::class)]
final class SearchScreenTest extends BackendTestCase
{
    private string $about;

    protected function setUp(): void
    {
        parent::setUp();

        $start = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => 'Start']]), Context::system())->id;
        $this->about = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => 'Über uns', 'content' => ['fields' => ['heading' => 'Wir rösten Kaffee']]]], $start), Context::system())->id;
        $this->createUser('editor@example.org', ['editor']);
        $this->createUser('admin@example.org', ['admin']);
    }

    public function testFindsPagesWithTheirScreen(): void
    {
        $groups = $this->search('kaffee', $this->signIn('editor@example.org'));

        self::assertSame([['title' => 'Seiten', 'items' => [[
            'title' => 'Über uns',
            'url' => '/cms/pages/' . $this->about,
            'icon' => 'pages',
            'excerpt' => 'Wir rösten Kaffee',
            'meta' => '',
        ]]]], $groups);
    }

    public function testOffersScreensAndCommandsTheUserMay(): void
    {
        $editor = $this->signIn('editor@example.org');

        self::assertSame(['Seiten' => '/cms/pages', 'Neue Seite' => '/cms/pages/new'], self::goTo($this->search('seite', $editor)));
        self::assertSame(['Dateien hochladen' => '/cms/media'], self::goTo($this->search('hochladen', $editor)));
        self::assertSame([], self::goTo($this->search('benutzer', $editor)), 'Editors may not see users.');
        self::assertSame(['Benutzer' => '/cms/users', 'Neuer Benutzer' => '/cms/users/new'], self::goTo($this->search('benutzer', $this->signIn('admin@example.org'))));
    }

    public function testLeavesOutHitsWithoutAScreen(): void
    {
        $this->runner()->run(new CreateNote('Kaffee kaufen'), Context::system());

        $groups = $this->search('kaffee', $this->signIn('admin@example.org'));

        self::assertSame(['Seiten'], array_column($groups, 'title'), 'Notes have no screen.');
    }

    public function testShowsAllHitsOnItsScreen(): void
    {
        $session = $this->signIn('editor@example.org');
        $html = $this->html($this->request('GET', '/cms/search?q=kaffee', session: $session));

        self::assertStringContainsString('<title>Suche nach „kaffee“', $html);
        self::assertStringContainsString('<a class="fb-list__title fb-list__link" href="/cms/pages/' . $this->about . '">Über uns</a>', $html);
        self::assertStringContainsString('<fb-search src="/cms/search" shortcut', $html, 'The sidebar opens the dialog.');

        $none = $this->html($this->request('GET', '/cms/search?q=tee', session: $session));
        self::assertStringContainsString('Nichts gefunden für „tee“.', $none);
    }

    public function testNeedsASignIn(): void
    {
        self::assertSame(401, $this->request('GET', '/cms/search?q=kaffee', headers: ['Accept' => 'application/json'])->getStatusCode());
        self::assertSame(302, $this->request('GET', '/cms/search?q=kaffee')->getStatusCode(), 'To the sign-in.');
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site')))], 'backend-search-tests');
    }

    protected function config(): array
    {
        return ['theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function search(string $q, string $session): array
    {
        $response = $this->request('GET', '/cms/search?q=' . rawurlencode($q), session: $session, headers: ['Accept' => 'application/json']);
        self::assertSame(200, $response->getStatusCode(), (string) $response->getBody());
        $body = json_decode((string) $response->getBody(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($body);
        self::assertIsArray($body['data']);

        /** @var list<array<string, mixed>> */
        return $body['data'];
    }

    /**
     * Labels and addresses of the group "Go to".
     *
     * @param list<array<string, mixed>> $groups
     *
     * @return array<string, string>
     */
    private static function goTo(array $groups): array
    {
        foreach ($groups as $group) {
            if ('Gehe zu' === $group['title'] && \is_array($group['items'])) {
                /** @var list<array{title: string, url: string}> $items */
                $items = $group['items'];

                return array_column($items, 'url', 'title');
            }
        }

        return [];
    }
}
