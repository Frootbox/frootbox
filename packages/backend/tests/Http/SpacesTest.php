<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Pages\PageTree;
use Frootbox\Backend\Http\Spaces\SpacesHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Page\ShowPageTree;
use Frootbox\Core\Plugin\AssignPlugin;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\Core\Tests\Fixtures\Plugin\ItemPlugin;
use Frootbox\Core\Tests\Fixtures\Plugin\SaveItem;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(SpacesHandler::class)]
#[CoversClass(PageTree::class)]
#[CoversClass(ShowPageTree::class)]
final class SpacesTest extends BackendTestCase
{
    public function testAdminsSeeTheSpacesWithTheirPagesAndTheSitemapMarksThem(): void
    {
        $start = $this->createPage(null, 'Start');
        $news = $this->createPage($start, 'News');
        $archive = $this->createPage($start, 'Archiv');
        $old = $this->runner()->run(new CreateSpace(ItemPlugin::TYPE, 'Archiv'), Context::system())->id;
        $empty = $this->runner()->run(new CreateSpace(ItemPlugin::TYPE, 'Leer'), Context::system())->id;
        $this->runner()->run(new AssignPlugin($news, ItemPlugin::TYPE), Context::system());
        $this->runner()->run(new AssignPlugin($archive, ItemPlugin::TYPE, $old), Context::system());
        $this->runner()->run(new PublishPages([$start, $news, $archive]), Context::system());
        $this->runner()->run(new SaveItem('01JSPACEITEM00000000000001', ['de' => 'Alt'], ['de' => 'alt'], space: $old), Context::system());

        $tree = $this->runner()->ask(new ShowPageTree(), Context::system());
        self::assertSame([null, 'Punkte', 'Punkte · Archiv'], [$tree[0]->plugin, $tree[0]->children[0]->plugin ?? null, $tree[0]->children[1]->plugin ?? null], 'What each page shows, the default space without its name, translated.');

        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');
        $pages = $this->html($this->request('GET', '/cms/pages/' . $news, session: $session));
        self::assertStringContainsString('<span class="fb-tree__flag" data-status="plugin" title="Zeigt Punkte · Archiv" aria-hidden="true">', $pages, 'The sitemap marks the page.');

        $html = $this->html($this->request('GET', '/cms/spaces', session: $session));
        self::assertStringContainsString('href="/cms/spaces" aria-current="page"', $html, 'The sidebar has the screen.');
        self::assertStringContainsString('<h2 class="fb-heading-4" id="spaces-1-title">Punkte</h2>', $html);
        self::assertStringContainsString('Gezeigt auf <a href="/cms/pages/' . $archive . '">Archiv</a>', $html);
        self::assertStringContainsString('1 Eintrag', $html);
        self::assertStringContainsString('Keine Seite zeigt sie · 0 Einträge', $html);
        self::assertSame(1, substr_count($html, 'aria-label="Leer löschen"'), 'Only an empty space without a page can be deleted.');
        self::assertStringNotContainsString('aria-label="Archiv löschen"', $html);
        self::assertStringContainsString('aria-label="Archiv umbenennen"', $html);
        self::assertStringContainsString('&quot;type&quot;:&quot;acme\/plugin\/item&quot;', $html, 'New spaces for the plugin.');

        $this->action('space.update', ['id' => $old, 'title' => 'Früher'], $session);
        $this->action('space.delete', ['id' => $empty], $session);
        $html = $this->html($this->request('GET', '/cms/spaces', session: $session));
        self::assertStringContainsString('>Früher</span>', $html);
        self::assertStringNotContainsString('Leer', $html);

        // Editors may not assign pages, so the screen is not theirs.
        $this->createUser('editor@example.org', ['editor']);
        self::assertSame(403, $this->request('GET', '/cms/spaces', session: $this->signIn('editor@example.org'))->getStatusCode());
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site', 'plugin')))], 'backend-space-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }

    private function createPage(?string $parentId, string $title): string
    {
        return $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => $title, 'content' => ['fields' => ['heading' => $title], 'areas' => ['main' => []]]]], $parentId), Context::system())->id;
    }
}
