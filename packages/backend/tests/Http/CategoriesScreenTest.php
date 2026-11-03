<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Categories\CategoriesHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Category\CreateCategory;
use Frootbox\Core\Category\CreateGroup;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Tests\Fixtures\Plugin\ItemPlugin;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(CategoriesHandler::class)]
final class CategoriesScreenTest extends BackendTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->createUser('admin@example.org', ['admin']);
        $this->createUser('editor@example.org', ['editor']);
    }

    public function testShowsTheCategoriesOfAGroupAsATree(): void
    {
        $courses = $this->runner()->run(new CreateCategory('acme/plugin/topics', ['de' => ['title' => 'Kurse']]), Context::system());
        $this->runner()->run(new CreateCategory('acme/plugin/topics', ['de' => ['title' => 'Barista']], $courses->id), Context::system());
        $region = $this->runner()->run(new CreateGroup('Region', [ItemPlugin::TYPE]), Context::system());

        $html = $this->html($this->request('GET', '/cms/categories', session: $this->signIn('editor@example.org')));
        self::assertStringContainsString('<fb-tree id="category-tree" action="category.move" roots', $html);
        self::assertMatchesRegularExpression('~data-title="Kurse">\s*<div class="fb-tree__row" data-depth="0">~', $html);
        self::assertMatchesRegularExpression('~data-title="Barista">\s*<div class="fb-tree__row" data-depth="1">~', $html, 'Below its parent.');
        self::assertStringContainsString('<span class="fb-tree__meta" dir="ltr">?category=kurse</span>', $html);
        self::assertStringContainsString('<option value="' . $courses->id . '">Kurse</option><option value="', $html, 'A new one can go below another.');
        self::assertStringContainsString('aria-current="page">Themen</a>', $html, 'A tab for each group.');
        self::assertStringContainsString('Für Punkte', $html);
        self::assertStringNotContainsString('group-new', $html, 'Groups belong to admins.');

        $admin = $this->html($this->request('GET', '/cms/categories?group=' . $region->id, session: $this->signIn('admin@example.org')));
        self::assertStringContainsString('<h2 class="fb-heading-2" id="categories-title" tabindex="-1" data-fb-focus>Region</h2>', $admin);
        self::assertStringContainsString('Noch keine Kategorien', $admin);
        self::assertStringContainsString('<fb-form action="category-group.create"', $admin);
        self::assertStringContainsString('<fb-form action="category-group.update"', $admin, 'A group of an admin can change.');
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site', 'plugin')))], 'backend-category-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }
}
