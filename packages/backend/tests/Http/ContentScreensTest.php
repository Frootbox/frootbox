<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use DateTimeImmutable;
use Frootbox\Backend\Http\ActionHandler;
use Frootbox\Backend\Http\DashboardHandler;
use Frootbox\Backend\Http\Navigations\NavigationsHandler;
use Frootbox\Backend\Http\Pages\NewPageHandler;
use Frootbox\Backend\Http\Pages\PagesHandler;
use Frootbox\Backend\Http\Pages\PageTree;
use Frootbox\Backend\Http\Redirects\RedirectsHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Page\SchedulePage;
use Frootbox\Core\Tests\Support\FixtureSite;
use Frootbox\Core\Url\CreateRedirect;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(DashboardHandler::class)]
#[CoversClass(ActionHandler::class)]
#[CoversClass(PagesHandler::class)]
#[CoversClass(NewPageHandler::class)]
#[CoversClass(PageTree::class)]
#[CoversClass(NavigationsHandler::class)]
#[CoversClass(RedirectsHandler::class)]
final class ContentScreensTest extends BackendTestCase
{
    private string $start;

    private string $about;

    private string $team;

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->start = $this->createPage(null, 'Start');
        $this->about = $this->createPage($this->start, 'Über uns');
        $this->runner()->run(new PublishPages([$this->start, $this->about]), Context::system());
        $this->team = $this->createPage($this->about, 'Team');

        $this->createUser('admin@example.org', ['admin']);
        $this->session = $this->signIn('admin@example.org');
    }

    public function testTheDashboardLeadsToTheWaitingPages(): void
    {
        $html = $this->html($this->request('GET', '/cms', session: $this->session));

        self::assertStringContainsString('<a class="fb-list__title fb-list__link" href="/cms/pages/' . $this->team . '" lang="de" dir="ltr">Team</a>', $html, 'To the page in the sitemap.');
        self::assertStringContainsString('<span class="fb-list__meta">/ueber-uns/team</span>', $html);
        self::assertStringContainsString('<input type="hidden" name="next" value="/ueber-uns/team">', $html, 'To the page in the editing mode.');
        self::assertStringContainsString('aria-label="„Team“ auf der Website bearbeiten"', $html);
        self::assertStringNotContainsString('>Über uns</a>', $html, 'Published pages are not waiting.');
    }

    public function testPublishesAllWaitingPagesAndUndoesIt(): void
    {
        // Scheduled pages and the subpages of a page that stays offline are left out.
        $news = $this->createPage($this->about, 'Neuigkeiten');
        $this->runner()->run(new SchedulePage($news, new DateTimeImmutable('+1 week')), Context::system());
        $this->createPage($news, 'Erste Meldung');

        $html = $this->html($this->request('GET', '/cms', session: $this->session));
        self::assertStringContainsString('commandfor="pending-publish" command="show-modal"><span>Veröffentlichen</span>', $html, 'One page, so no "all".');
        self::assertStringContainsString('<h2 class="fb-dialog__title" id="pending-publish-title">1 Seite veröffentlichen?</h2>', $html);
        self::assertSame(1, substr_count($html, 'name="ids[]"'));
        self::assertStringContainsString('data-fb-pointer="/ids/0" data-fb-label="Team">', $html, 'Errors of the page go to its line.');
        self::assertStringContainsString('<input type="hidden" name="ids[]" value="' . $this->team . '">', $html);
        self::assertStringContainsString('form="pending-edit-' . $this->team . '"', $html, 'From the dialog to the editing mode.');
        self::assertStringContainsString('Nicht dabei, weil sie zu ihrer geplanten Zeit online gehen: Neuigkeiten.', $html);
        self::assertStringContainsString('Nicht dabei, weil Du sie oder eine Seite darüber nicht veröffentlichen darfst: Erste Meldung.', $html);
        self::assertStringContainsString('<fb-form action="action.undo" refresh="pending"', $html);

        $published = $this->action('page.publish', ['ids' => [$this->team]], $this->session);
        self::assertIsInt($published['entry'] ?? null, 'The id for undoing it.');
        self::assertStringNotContainsString('name="ids[]" value="' . $this->team . '"', $this->html($this->request('GET', '/cms', session: $this->session)));

        $undone = $this->action('action.undo', ['id' => $published['entry']], $this->session);
        self::assertIsInt($undone['entry'] ?? null, 'Undoing can be undone, too.');
        self::assertStringContainsString('name="ids[]" value="' . $this->team . '"', $this->html($this->request('GET', '/cms', session: $this->session)), 'Waiting again.');
    }

    public function testTheSitemapIsCompact(): void
    {
        $html = $this->html($this->request('GET', '/cms/pages', session: $this->session));

        self::assertStringContainsString('<h2 class="fb-heading-4" id="page-tree-title">Sitemap</h2>', $html);
        self::assertDoesNotMatchRegularExpression('~data-collapsed~', $html, 'A small website is open completely.');
        self::assertStringContainsString('aria-controls="page-tree-' . $this->about . '" aria-label="Unterseiten von „Über uns“"', $html);
        self::assertStringContainsString('<span class="fb-tree__flag" data-status="draft" aria-hidden="true">Entwurf</span>', $html, 'A draft says so.');
        self::assertSame(1, substr_count($html, 'class="fb-tree__flag"'), 'Published pages have only the dot.');
        self::assertStringContainsString('<span class="fb-visually-hidden">, Veröffentlicht</span>', $html);
        self::assertStringContainsString('<fb-tree-filter class="fb-tree-filter" for="page-tree"', $html, 'The sitemap can be searched.');
        self::assertMatchesRegularExpression('~data-id="' . $this->about . '"[^>]* data-terms="Über uns /ueber-uns[^"]*"~', $html, 'By title and address.');
        self::assertMatchesRegularExpression('~ title="Über uns · /ueber-uns · [^"]+ · Veröffentlicht" hx-get="~', $html, 'The tooltip names everything, and the link goes on cleanly.');
    }

    public function testShowsTheTreeAndThePage(): void
    {
        $html = $this->html($this->request('GET', '/cms/pages', session: $this->session));

        self::assertStringContainsString('<fb-tree id="page-tree" action="page.move" refresh="page-tree page-detail"', $html);
        self::assertStringContainsString('data-id="' . $this->start . '" data-title="Start" data-fixed', $html, 'The start page stays at the top.');
        self::assertStringContainsString('data-id="' . $this->team . '" data-title="Team"', $html);
        self::assertStringContainsString('id="page-detail"', $html);

        $about = $this->html($this->request('GET', '/cms/pages/' . $this->about, session: $this->session));
        self::assertStringContainsString('<fb-form action="page.update" refresh="page-tree page-detail"', $about);
        self::assertStringContainsString('name="translations.de.slug"', $about);
        self::assertStringContainsString('commandfor="page-lock"', $about, 'Published pages can be locked.');
        self::assertStringContainsString('name="branch"', $about, 'With subpages, the lock can reach them.');
        self::assertStringContainsString('name="excludeFromSearchEngines"', $about);
        self::assertStringContainsString('commandfor="page-unpublish"', $about);

        $team = $this->html($this->request('GET', '/cms/pages/' . $this->team, session: $this->session));
        self::assertStringNotContainsString('commandfor="page-lock"', $team, 'Drafts cannot be locked.');
        self::assertStringContainsString('commandfor="page-delete"', $team);

        $detail = $this->html($this->request('GET', '/cms/pages/' . $this->about . '?language=en', session: $this->session, headers: ['HX-Request' => 'true', 'HX-Target' => 'page-detail']));
        self::assertStringStartsWith('<title>', $detail, 'htmx gets the details only.');
        self::assertStringNotContainsString('id="page-tree"', $detail);
        self::assertStringContainsString('class="fb-missing"', $detail, 'No English version yet.');

        self::assertSame(404, $this->request('GET', '/cms/pages/01JZZZZZZZZZZZZZZZZZZZZZZZ', session: $this->session)->getStatusCode());
    }

    public function testShowsLocksInTheTree(): void
    {
        $this->action('page.lock', ['id' => $this->about, 'branch' => true], $this->session);

        $html = $this->html($this->request('GET', '/cms/pages/' . $this->about, session: $this->session));

        self::assertStringContainsString('<fb-form action="page.unlock"', $html);
        self::assertSame(2, substr_count($html, 'data-status="danger"'), 'Tree and details mark the page; the draft below was never published.');
    }

    public function testShowsOnlyTheBranchOfAnEditor(): void
    {
        $editor = $this->createUser('jane@example.org', []);
        $this->action('user.assign-role', ['userId' => $editor, 'role' => 'editor', 'scope' => 'page:' . $this->about], $this->session);
        $session = $this->signIn('jane@example.org');

        $html = $this->html($this->request('GET', '/cms/pages', session: $session));
        self::assertMatchesRegularExpression('/data-id="' . $this->start . '" data-title="Start" data-fixed data-leaf data-outside/', $html, 'The start page is only the way to the branch.');
        self::assertStringNotContainsString('href="/cms/pages/' . $this->start . '"', $html);
        self::assertStringContainsString('data-id="' . $this->about . '" data-title="Über uns" data-fixed', $html, 'The top of the branch stays in place.');
        self::assertStringContainsString('aria-current="page"', $html, 'The first page of the branch is open.');
        self::assertStringContainsString('href="/cms/pages"', $html, 'The menu has the pages.');
        self::assertStringNotContainsString('href="/cms/navigations"', $html, 'Navigations need a role above.');

        $about = $this->html($this->request('GET', '/cms/pages/' . $this->about, session: $session));
        self::assertStringContainsString('<fb-form action="page.update"', $about);
        self::assertStringContainsString('name="translations.de.slug"', $about, 'The top of the branch is no start page.');
        self::assertStringNotContainsString('commandfor="page-delete"', $about, 'The top of the branch is deleted only from above.');

        $team = $this->html($this->request('GET', '/cms/pages/' . $this->team, session: $session));
        self::assertStringContainsString('commandfor="page-delete"', $team);

        self::assertSame(403, $this->request('GET', '/cms/pages/' . $this->start, session: $session)->getStatusCode());
        $this->action('page.update', ['id' => $this->start, 'layout' => 'acme/base/Page'], $session, 403);

        $new = $this->html($this->request('GET', '/cms/pages/new', session: $session));
        self::assertStringNotContainsString('value="' . $this->start . '"', $new, 'New pages go into the branch only.');

        $user = $this->html($this->request('GET', '/cms/users/' . $editor, session: $this->session));
        self::assertStringContainsString('id="user-branches"', $user);
        self::assertStringContainsString('Über uns · /ueber-uns', $user);
        self::assertStringContainsString('value="page:' . $this->team . '"', $user);
    }

    public function testCreatesPagesBelowTheChosenOne(): void
    {
        $html = $this->html($this->request('GET', '/cms/pages/new?parent=' . $this->about, session: $this->session));

        self::assertStringContainsString('<fb-form action="page.create"', $html);
        self::assertMatchesRegularExpression('/value="' . $this->about . '" selected data-prefix="example\.org\/ueber-uns\/"/', $html);
        self::assertStringContainsString('data-fb-slug-query="/cms/queries/page.slug?language=de"', $html);

        // The address comes from the rules in the core (decision 0134).
        $response = $this->request('GET', '/cms/queries/page.slug?language=uk&title=' . rawurlencode('Київ'), session: $this->session);
        self::assertSame(200, $response->getStatusCode(), (string) $response->getBody());
        self::assertSame(['data' => 'kyiv'], json_decode((string) $response->getBody(), true, flags: \JSON_THROW_ON_ERROR));
    }

    public function testEditsTheItemsOfANavigation(): void
    {
        $this->action('navigation.update', ['name' => 'main', 'items' => ['de' => [
            ['type' => 'target', 'target' => 'page:' . $this->about, 'children' => [['type' => 'phone', 'phone' => '+49 40 123456']]],
            ['type' => 'pages', 'target' => 'page:' . $this->start, 'depth' => 1],
        ]]], $this->session);

        $html = $this->html($this->request('GET', '/cms/navigations', session: $this->session));

        self::assertStringContainsString('<fb-navigation name="main" language="de" refresh="navigation-list navigation-detail"', $html);
        self::assertStringContainsString('<fb-tree id="navigation-tree" movable roots depth="2"', $html);
        self::assertStringContainsString('data-title="Über uns"', $html, 'Items without a text show the title of the page.');
        self::assertStringContainsString('data-title="+49 40 123456"', $html);
        self::assertMatchesRegularExpression('/data-title="[^"]+" data-leaf/', $html, 'Subpages take no children.');
        self::assertStringContainsString('&quot;_path&quot;:&quot;0.0&quot;', $html, 'The dialog knows the place of each item.');
        self::assertStringContainsString('<fb-form action="navigation.publish"', $html);
        self::assertStringContainsString('href="/cms/navigations/footer"', $html);

        $english = $this->html($this->request('GET', '/cms/navigations/main?language=en', session: $this->session));
        self::assertStringContainsString('<fb-form action="navigation.copy"', $english);

        self::assertSame(404, $this->request('GET', '/cms/navigations/side', session: $this->session)->getStatusCode());
        self::assertSame(302, $this->request('GET', '/cms/navigations')->getStatusCode(), 'Guests go to the sign-in.');
    }

    public function testListsRedirectsAndTheLog(): void
    {
        $this->runner()->run(new CreateRedirect('/alt', 'page:' . $this->about), Context::system());

        $html = $this->html($this->request('GET', '/cms/redirects', session: $this->session));

        self::assertStringContainsString('/alt', $html);
        self::assertStringContainsString('commandfor="redirect-new"', $html);
        self::assertStringContainsString('value="page:' . $this->about . '"', $html);
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site')))], 'backend-content-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']]];
    }

    private function createPage(?string $parentId, string $title): string
    {
        return $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => $title, 'content' => ['fields' => ['heading' => $title]]]], $parentId), Context::system())->id;
    }
}
