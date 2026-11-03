<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Tags\TagsHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\ProjectPaths;
use Frootbox\Core\Tag\CreateTag;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(TagsHandler::class)]
final class TagsScreenTest extends BackendTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->createUser('editor@example.org', ['editor']);
    }

    public function testListsTheStockOfTags(): void
    {
        file_put_contents($this->get(ProjectPaths::class)->config('tags.yaml'), "tags:\n  - Nachhaltigkeit\n");
        $this->runner()->run(new CreateTag(['de' => 'Kaffee', 'en' => 'Coffee']), Context::system());
        $this->runner()->run(new CreateTag([], 'featured', true), Context::system());
        $session = $this->signIn('editor@example.org');

        $html = $this->html($this->request('GET', '/cms/tags', session: $session));
        self::assertStringContainsString('<span class="fb-list__title">Kaffee</span>', $html);
        self::assertStringContainsString('Coffee · <code>kaffee</code> · 0-mal verwendet', $html, 'The other labels and the key.');
        self::assertStringContainsString('<span class="fb-list__title">featured</span>', $html, 'An internal one without labels shows its key.');
        self::assertStringContainsString('Intern', $html);
        self::assertStringContainsString('<fb-form action="tag.merge"', $html);
        self::assertStringNotContainsString('Nachhaltigkeit', $html, 'A preset appears once someone chooses it.');

        $found = $this->html($this->request('GET', '/cms/tags?q=coff', session: $session));
        self::assertStringContainsString('Kaffee', $found, 'Found by any label.');
        self::assertStringNotContainsString('<span class="fb-list__title">featured</span>', $found);
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site', 'plugin')))], 'backend-tag-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']]];
    }
}
