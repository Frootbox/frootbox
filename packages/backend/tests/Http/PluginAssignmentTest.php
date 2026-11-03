<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Pages\PagesHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Plugin\AssignPlugin;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\Core\Plugin\ListPlugins;
use Frootbox\Core\Tests\Fixtures\Plugin\ItemPlugin;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(PagesHandler::class)]
#[CoversClass(ListPlugins::class)]
final class PluginAssignmentTest extends BackendTestCase
{
    private string $start;

    private string $jobs;

    protected function setUp(): void
    {
        parent::setUp();

        $this->start = $this->createPage(null, 'Start');
        $this->jobs = $this->createPage($this->start, 'Jobs');
        $this->createUser('admin@example.org', ['admin']);
        $this->createUser('editor@example.org', ['editor']);
    }

    public function testAnAdminChoosesWhatAPageShows(): void
    {
        $session = $this->signIn('admin@example.org');
        $html = $this->html($this->request('GET', '/cms/pages/' . $this->jobs, session: $session));

        self::assertStringContainsString('<fb-form action="plugin.assign"', $html);
        self::assertStringContainsString('<option value="" selected>Nichts</option><option value="acme/plugin/item">Punkte</option>', $html);
        self::assertStringContainsString('data-fb-when="type=acme/plugin/item" hidden', $html, 'The spaces of a plugin show once it is chosen.');

        $this->runner()->run(new AssignPlugin($this->jobs, ItemPlugin::TYPE), Context::system());
        $this->runner()->run(new CreateSpace(ItemPlugin::TYPE, 'Ausbildung'), Context::system());
        $assigned = $this->html($this->request('GET', '/cms/pages/' . $this->jobs, session: $session));
        self::assertStringContainsString('<option value="acme/plugin/item" selected>Punkte</option>', $assigned);
        self::assertMatchesRegularExpression('~<option value="default" selected>Punkte</option><option value="[0-9A-Z]{26}">Ausbildung</option>~', $assigned);
        self::assertStringContainsString('name="newSpace"', $assigned);
        self::assertStringContainsString('Eigene Seiten für die Einträge', $assigned, 'Details are optional for the items.');
        self::assertMatchesRegularExpression('~<input type="checkbox" id="page-plugin-categories-1" name="categories" value="1"[^>]*>~', $assigned, 'Pages of the categories are a switch (decision 0243).');
        self::assertDoesNotMatchRegularExpression('~id="page-plugin-categories-1" name="categories"[^>]* checked~', $assigned, 'Off by default.');

        $start = $this->html($this->request('GET', '/cms/pages/' . $this->start, session: $session));
        self::assertMatchesRegularExpression('~<option value="default" disabled>Punkte \(auf Jobs\)</option>~', $start, 'A space has one page.');
    }

    public function testEditorsDoNotChooseIt(): void
    {
        $html = $this->html($this->request('GET', '/cms/pages/' . $this->jobs, session: $this->signIn('editor@example.org')));

        self::assertStringNotContainsString('plugin.assign', $html);
        self::assertStringNotContainsString('Diese Seite zeigt', $html);
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site', 'plugin')))], 'backend-plugin-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }

    private function createPage(?string $parentId, string $title): string
    {
        return $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => $title, 'content' => ['fields' => ['heading' => $title]]]], $parentId), Context::system())->id;
    }
}
