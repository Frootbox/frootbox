<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Tests;

use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Collections\Backend\EntriesHandler;
use Frootbox\Collections\Backend\EntryHandler;
use Frootbox\Collections\Backend\FieldsHandler;
use Frootbox\Collections\CollectionsExtension;
use Frootbox\Collections\Entry\CreateEntry;
use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Core\Plugin\UpdateSpace;
use Frootbox\Core\User\AssignRole;
use Frootbox\Core\User\CreateRole;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(EntriesHandler::class)]
#[CoversClass(EntryHandler::class)]
#[CoversClass(FieldsHandler::class)]
#[CoversClass(CollectionsExtension::class)]
final class BackendTest extends BackendTestCase
{
    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), CollectionsTestCase::package()], 'collections-backend');
    }

    protected function config(): array
    {
        return ['languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']]];
    }

    public function testEditorsWriteAndPublishEntries(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('editor@example.org');

        $list = $this->html($this->request('GET', '/cms/collections', session: $session));
        self::assertStringContainsString('href="/cms/collections" aria-current="page"', $list, 'The sidebar has the screen.');
        self::assertStringContainsString('href="/cms/collections/new"', $list);
        self::assertStringContainsString('Noch keine Einträge', $list);
        self::assertStringContainsString('id="collection-entries-title">Einträge</h2>', $list, 'Still called like the module.');

        $new = $this->html($this->request('GET', '/cms/collections/new', session: $session));
        self::assertStringContainsString('<fb-form action="frootbox/collections/entry.create" next="/cms/collections/{id}"', $new);
        self::assertStringContainsString('<fb-rich-text', $new);
        self::assertStringContainsString('name="order"', $new);

        $created = $this->action('frootbox/collections/entry.create', [
            'translations' => ['de' => ['title' => 'Haus am See', 'teaser' => 'Am Wasser.', 'text' => ['type' => 'doc', 'content' => []]]],
            'order' => 2,
            'image' => [],
            'tags' => ['Holzbau'],
        ], $session);
        $id = $this->id($created);

        $show = $this->html($this->request('GET', '/cms/collections/' . $id, session: $session));
        self::assertStringContainsString('<h1 class="fb-heading-1" tabindex="-1" data-fb-focus>Haus am See</h1>', $show);
        self::assertStringContainsString('value="haus-am-see"', $show);
        self::assertMatchesRegularExpression('~name="order"[^>]*value="2"|value="2"[^>]*name="order"~', $show);
        self::assertMatchesRegularExpression('~name="tags\[\]" value="[0-9A-Z]{26}" checked>\s*<span class="fb-check__text"><span>Holzbau</span>~', $show, 'A typed word became a tag.');
        self::assertStringContainsString('<fb-form action="frootbox/collections/entry.publish"', $show);

        $this->action('frootbox/collections/entry.publish', ['ids' => [$id]], $session);
        $published = $this->html($this->request('GET', '/cms/collections/' . $id, session: $session));
        self::assertStringContainsString('commandfor="entry-unpublish"', $published);

        $list = $this->html($this->request('GET', '/cms/collections', session: $session));
        self::assertStringContainsString('href="/cms/collections/' . $id . '">Haus am See</a>', $list);
        self::assertStringContainsString('Position 2', $list);
    }

    public function testATabForEachCollection(): void
    {
        $this->runner()->run(new UpdateSpace(Space::DEFAULT, 'Referenzen', EntryStore::TYPE), Context::system());
        $projects = $this->runner()->run(new CreateSpace(EntryStore::TYPE, 'Projekte'), Context::system())->id;
        $this->runner()->run(new CreateEntry(['de' => ['title' => 'Haus am See']]), Context::system());
        $this->runner()->run(new CreateEntry(['de' => ['title' => 'Brücke']], space: $projects), Context::system());
        $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('editor@example.org');

        $list = $this->html($this->request('GET', '/cms/collections', session: $session));
        self::assertStringContainsString('<nav class="fb-tabs"', $list);
        self::assertMatchesRegularExpression('~href="/cms/collections\?space=default"[^>]*>\s*Referenzen~', $list, 'The first collection by its name.');
        self::assertStringContainsString('Haus am See', $list);
        self::assertStringNotContainsString('Brücke', $list);
        self::assertStringContainsString('id="collection-entries-title">Referenzen</h2>', $list, 'The name above its entries.');

        $list = $this->html($this->request('GET', '/cms/collections?space=' . $projects, session: $session));
        self::assertStringContainsString('Brücke', $list);
        self::assertStringContainsString('href="/cms/collections/new?space=' . $projects . '"', $list, 'New entries go into the tab.');
    }

    public function testOthersSeeNoCollections(): void
    {
        $this->runner()->run(new CreateRole('guest-writer', 'Writer', ['page.tree']), Context::system());
        $this->createUser('writer@example.org', ['guest-writer']);
        $session = $this->signIn('writer@example.org');

        self::assertStringNotContainsString('href="/cms/collections"', $this->html($this->request('GET', '/cms', session: $session)));
        self::assertSame(403, $this->request('GET', '/cms/collections', session: $session)->getStatusCode());
    }

    public function testAnEditorWithinACollectionSeesOnlyItsEntries(): void
    {
        $projects = $this->runner()->run(new CreateSpace(EntryStore::TYPE, 'Projekte'), Context::system())->id;
        $outside = $this->runner()->run(new CreateEntry(['de' => ['title' => 'Haus am See']]), Context::system())->id;
        $inside = $this->runner()->run(new CreateEntry(['de' => ['title' => 'Brücke']], space: $projects), Context::system())->id;
        $user = $this->createUser('projects@example.org', []);
        $this->runner()->run(new AssignRole($user, 'editor', 'space:' . SpaceScopes::id(EntryStore::TYPE, $projects)), Context::system());
        $session = $this->signIn('projects@example.org');

        $list = $this->html($this->request('GET', '/cms/collections', session: $session));
        self::assertStringContainsString('href="/cms/collections/' . $inside . '"', $list);
        self::assertStringNotContainsString('href="/cms/collections/' . $outside . '"', $list);
        self::assertStringNotContainsString('class="fb-tabs"', $list);
        self::assertStringContainsString('href="/cms/collections/new?space=' . $projects . '"', $list);
        self::assertSame(403, $this->request('GET', '/cms/collections/' . $outside, session: $session)->getStatusCode());
    }

    public function testAdminsAddFieldsEditorsFillIn(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $admin = $this->signIn('admin@example.org');

        $list = $this->html($this->request('GET', '/cms/collections', session: $admin));
        self::assertStringContainsString('href="/cms/collections/fields?space=default"', $list, 'Admins reach the fields of the collection.');

        $screen = $this->html($this->request('GET', '/cms/collections/fields?space=default', session: $admin));
        self::assertStringContainsString('Noch keine Felder', $screen);
        self::assertStringContainsString('<fb-form action="frootbox/collections/field.create"', $screen);
        self::assertStringContainsString('<option value="choice">Auswahl aus einer Liste</option>', $screen);

        $this->action('frootbox/collections/field.create', ['kind' => 'number', 'labels' => ['de' => 'Fläche'], 'unit' => 'm²'], $admin);
        $this->action('frootbox/collections/field.create', ['kind' => 'choice', 'labels' => ['de' => 'Bauweise'], 'options' => ['de' => ['Holz', 'Stein']]], $admin);
        $this->action('frootbox/collections/field.create', ['kind' => 'date', 'labels' => ['de' => 'Fertig']], $admin);
        $this->action('frootbox/collections/field.create', ['kind' => 'file', 'labels' => ['de' => 'Exposé']], $admin);

        $screen = $this->html($this->request('GET', '/cms/collections/fields?space=default', session: $admin));
        self::assertStringContainsString('Zahl · m² · <code>flaeche</code>', $screen);
        self::assertStringContainsString('Auswahl aus einer Liste · 2 Optionen · <code>bauweise</code>', $screen);
        self::assertStringContainsString('commandfor="field-delete-flaeche"', $screen);
        self::assertSame(404, $this->request('GET', '/cms/collections/fields?space=nowhere', session: $admin)->getStatusCode());

        $this->createUser('editor@example.org', ['editor']);
        $editor = $this->signIn('editor@example.org');
        self::assertStringNotContainsString('/cms/collections/fields', $this->html($this->request('GET', '/cms/collections', session: $editor)), 'Editors fill in, admins add.');
        $this->action('frootbox/collections/field.create', ['kind' => 'text', 'labels' => ['de' => 'Ort']], $editor, 403);

        $new = $this->html($this->request('GET', '/cms/collections/new', session: $editor));
        self::assertMatchesRegularExpression('~<label class="fb-label" for="entry-fields-flaeche">Fläche \(m²\) <span class="fb-label__optional">\(optional\)</span></label><input class="fb-input" type="number"[^>]*name="fields.flaeche"~', $new);
        self::assertStringContainsString('<option value="holz">Holz</option>', $new);
        self::assertMatchesRegularExpression('~type="date"[^>]*name="fields.fertig"~', $new);
        self::assertStringContainsString('<fb-image-input kind="document"', $new);

        $created = $this->action('frootbox/collections/entry.create', ['translations' => ['de' => ['title' => 'Haus am See']], 'fields' => ['flaeche' => 142, 'bauweise' => 'holz', 'fertig' => '2025-09-30']], $editor);
        $show = $this->html($this->request('GET', '/cms/collections/' . $this->id($created), session: $editor));
        self::assertMatchesRegularExpression('~name="fields.flaeche"[^>]*value="142"|value="142"[^>]*name="fields.flaeche"~', $show);
        self::assertStringContainsString('<option value="holz" selected>Holz</option>', $show);
    }

    /**
     * @param array<mixed> $answer
     */
    private function id(array $answer): string
    {
        self::assertIsArray($answer['data'] ?? null);
        $id = $answer['data']['id'] ?? null;
        self::assertIsString($id);

        return $id;
    }
}
