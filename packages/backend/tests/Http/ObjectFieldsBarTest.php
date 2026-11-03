<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Backend\View\EditorBar;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Auth\AuthenticationMiddleware;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\ObjectField\UpdateObjectField;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\EditMode;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Plugin\AssignPlugin;
use Frootbox\Core\Tests\Fixtures\Plugin\ItemPlugin;
use Frootbox\Core\Tests\Fixtures\Plugin\PublishItems;
use Frootbox\Core\Tests\Fixtures\Plugin\SaveItem;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(EditorBar::class)]
final class ObjectFieldsBarTest extends BackendTestCase
{
    private const string ITEM = '01JOBJECTITEM0000000000001';

    public function testTellsTheBarAboutTheObjectsWhoseFieldsThePageShows(): void
    {
        $start = $this->createPage(null, 'Start');
        $news = $this->createPage($start, 'News');
        $this->runner()->run(new AssignPlugin($news, ItemPlugin::TYPE), Context::system());
        $this->runner()->run(new PublishPages([$start, $news]), Context::system());
        $this->runner()->run(new SaveItem(self::ITEM, ['de' => 'Neue Sorten'], ['de' => 'neue-sorten'], fields: ['subtitle' => ['de' => 'Frisch']]), Context::system());
        $this->runner()->run(new PublishItems([self::ITEM]), Context::system());
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');
        $cookies = [AuthenticationMiddleware::COOKIE => $session, EditMode::COOKIE => '1'];

        $html = $this->html($this->request('GET', '/news/neue-sorten', cookies: $cookies));
        self::assertStringContainsString('<p class="subtitle" data-fb-field="subtitle" data-fb-type="text" data-fb-label="Subtitle" data-fb-object="acme/plugin/item:' . self::ITEM . '" data-fb-language="de"', $html, 'Marked on its element.');
        $object = ['target' => ItemPlugin::TYPE . ':' . self::ITEM, 'type' => ItemPlugin::TYPE, 'id' => self::ITEM, 'name' => 'Punkte „Neue Sorten“', 'draft' => false, 'publish' => true, 'discard' => false];
        self::assertSame([$object], $this->bar($html)['objects'], 'The fixture has no action to discard.');

        $this->runner()->run(new UpdateObjectField(ItemPlugin::TYPE . ':' . self::ITEM, 'de', 'subtitle', 'Im Entwurf', 'Frisch'), Context::system());
        $html = $this->html($this->request('GET', '/news/neue-sorten', cookies: $cookies));
        self::assertStringContainsString('>Im Entwurf</p>', $html);
        self::assertSame([array_replace($object, ['draft' => true])], $this->bar($html)['objects']);
        self::assertStringContainsString('>Frisch</p>', $this->html($this->request('GET', '/news/neue-sorten')), 'Visitors get the published one.');
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site', 'plugin', 'objects')))], 'backend-object-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/objects', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }

    /**
     * @return array{objects: list<array<mixed>>}
     */
    private function bar(string $html): array
    {
        self::assertSame(1, preg_match('~<script type="application/json" id="fb-edit-config">(.*?)</script>~s', $html, $match), 'The bar is in the page.');
        $config = json_decode($match[1], true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($config);
        self::assertIsArray($config['objects'] ?? null);

        return ['objects' => array_values(array_filter($config['objects'], is_array(...)))];
    }

    private function createPage(?string $parentId, string $title): string
    {
        return $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => $title, 'content' => ['fields' => ['heading' => $title], 'areas' => ['main' => []]]]], $parentId), Context::system())->id;
    }
}
