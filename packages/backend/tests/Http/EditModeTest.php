<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Design\Tokens;
use Frootbox\Backend\Http\EditModeHandler;
use Frootbox\Backend\Http\Pages\PagesHandler;
use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Backend\View\EditorBar;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Auth\AuthenticationMiddleware;
use Frootbox\Core\Cache\PageCache;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Design\UpdateDesign;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\EditMode;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Page\UpdatePage;
use Frootbox\Core\Site\UpdateSite;
use Frootbox\Core\Tests\Support\FixtureSite;
use Frootbox\Core\User\AssignRole;
use PHPUnit\Framework\Attributes\CoversClass;
use Psr\Http\Message\ResponseInterface;

#[CoversClass(EditModeHandler::class)]
#[CoversClass(EditorBar::class)]
#[CoversClass(Tokens::class)]
#[CoversClass(PagesHandler::class)]
final class EditModeTest extends BackendTestCase
{
    private string $start;

    private string $about;

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();

        $this->start = $this->createPage(null, 'Start');
        $this->about = $this->createPage($this->start, 'Über uns');
        $this->runner()->run(new PublishPages([$this->start, $this->about]), Context::system());

        $this->createUser('admin@example.org', ['admin']);
        $this->session = $this->signIn('admin@example.org');
    }

    public function testSwitchesTheModeWithTheToken(): void
    {
        $csrf = [Csrf::HEADER => $this->csrfFor($this->session)];

        self::assertSame(403, $this->request('POST', '/cms/edit-mode', ['on' => '1'], $this->session)->getStatusCode(), 'Only with the token.');
        self::assertSame(401, $this->request('POST', '/cms/edit-mode', ['on' => '1'])->getStatusCode(), 'Only for users.');

        $on = $this->request('POST', '/cms/edit-mode', ['on' => '1'], $this->session, $csrf);
        self::assertSame(204, $on->getStatusCode());
        self::assertStringStartsWith(EditMode::COOKIE . '=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=', $on->getHeaderLine('Set-Cookie'));
        self::assertStringEndsWith('; Secure', $on->getHeaderLine('Set-Cookie'));

        $off = $this->request('POST', '/cms/edit-mode', ['on' => '0', 'next' => '/ueber-uns'], $this->session, $csrf);
        self::assertSame(303, $off->getStatusCode());
        self::assertSame('/ueber-uns', $off->getHeaderLine('Location'));
        self::assertStringContainsString('Max-Age=0', $off->getHeaderLine('Set-Cookie'));

        $elsewhere = $this->request('POST', '/cms/edit-mode', ['on' => '1', 'next' => '//evil.example'], $this->session, $csrf);
        self::assertSame(204, $elsewhere->getStatusCode(), 'Only paths on this host.');
    }

    public function testPutsTheBarIntoPagesForEditors(): void
    {
        $this->runner()->run(new UpdatePage($this->about, ['de' => ['content' => ['fields' => ['heading' => 'Entwurf']]]]), Context::system());

        $guest = $this->request('GET', '/ueber-uns');
        self::assertStringNotContainsString('fb-edit', $this->html($guest), 'Guests get nothing of it.');
        self::assertSame('hit', $this->request('GET', '/ueber-uns')->getHeaderLine(PageCache::HEADER));

        $visitor = $this->html($this->page('/ueber-uns', editing: false));
        self::assertStringContainsString('<h1>Über uns</h1>', $visitor, 'Without the switch the page is as published.');
        $config = $this->bar($visitor);
        self::assertFalse($config['editing']);
        self::assertSame('/cms/edit-mode', $config['toggle']);
        self::assertStringStartsWith(':host{', $config['tokens']);
        self::assertStringContainsString('src="/assets/frootbox/backend/assets/build/edit.js?v=', $visitor);
        self::assertStringNotContainsString('fb-field,fb-area', $visitor, 'The rule for marked places only in the mode.');

        $editing = $this->html($this->page('/ueber-uns'));
        self::assertStringContainsString('<h1 data-fb-field="heading" data-fb-type="headline"', $editing);
        self::assertStringContainsString('>Entwurf</h1>', $editing);
        self::assertStringContainsString('fb-field,fb-area', $editing);

        $config = $this->bar($editing);
        self::assertTrue($config['editing']);
        self::assertTrue($config['marking']);
        self::assertSame($this->csrfFor($this->session), $config['csrf']);
        self::assertSame('/cms/actions/', $config['actions']);
        self::assertSame('/cms/queries/', $config['queries']);
        self::assertSame('de', $config['language']);
        self::assertSame('Redaktionsleiste', $config['labels']['bar'], 'Its name in docs and trainings (decision 0137).');
        self::assertSame('Bearbeiten', $config['labels']['edit']);
        self::assertSame('Rückgängig', $config['labels']['undo']);
        self::assertSame('Block darunter einfügen', $config['labels']['insertBelow']);
        self::assertSame('„{block}“ löschen?', $config['labels']['removeConfirm']);
        self::assertStringContainsString('.ProseMirror{', $editing);
        self::assertStringContainsString('[data-fb-field]:empty::before{content:attr(data-fb-label)', $editing, 'Empty fields show their label.');
        self::assertSame([
            'id' => $this->about,
            'status' => 'changed',
            'locked' => false,
            'publish' => [$this->about],
            'offlineParents' => [],
            'mayPublish' => true,
            'mayDiscard' => true,
            'canPublish' => true,
            'canDiscard' => true,
            'published' => true,
            'backend' => '/cms/pages/' . $this->about,
            'draftUrl' => '/ueber-uns',
            'visitorUrl' => '/ueber-uns',
        ], $config['page']);
    }

    public function testShowsTheDraftOfTheDesignInTheMode(): void
    {
        $this->runner()->run(new UpdateDesign(['radius' => '12px']), Context::system());

        self::assertStringContainsString('--radius:4px;', $this->html($this->request('GET', '/ueber-uns')), 'Guests see the published design.');
        $editing = $this->html($this->page('/ueber-uns'));
        self::assertStringContainsString('--radius:12px;', $editing);

        $config = $this->bar($editing);
        self::assertSame(['publish' => true, 'discard' => true], $config['design']);
        self::assertSame('Design', $config['labels']['design']);
        self::assertSame(['sans' => 'Serifenlos', 'serif' => 'Mit Serifen', 'rounded' => 'Abgerundet', 'mono' => 'Gleichbreit'], $config['labels']['fontNames']);
    }

    public function testTellsTheBarAboutTheFieldsOfTheWebsite(): void
    {
        $config = $this->bar($this->html($this->page('/ueber-uns')));
        self::assertSame(['draft' => false, 'publish' => true, 'discard' => true], $config['site']);

        $this->runner()->run(new UpdateSite('de', ['brand' => 'Bohnenglück']), Context::system());
        $html = $this->html($this->page('/ueber-uns'));
        self::assertSame(['draft' => true, 'publish' => true, 'discard' => true], $this->bar($html)['site']);
        self::assertStringContainsString('data-fb-field="brand" data-fb-type="headline" data-fb-label="Name" data-fb-site', $html);
    }

    public function testShowsWhatAnEditorMayDo(): void
    {
        $id = $this->createUser('jane@example.org', []);
        $this->runner()->run(new AssignRole($id, 'editor', 'page:' . $this->about), Context::system());
        $this->session = $this->signIn('jane@example.org');
        $team = $this->createPage($this->about, 'Team');

        $start = $this->bar($this->html($this->page('/')));
        self::assertFalse($start['marking'], 'Outside the branch nothing is marked.');
        self::assertNull($start['page'], 'And the bar shows nothing of the page.');
        self::assertNull($start['design'], 'The design is one for the website, a branch is not enough.');
        self::assertNull($start['site'], 'The fields of the website are the same on every page, a branch is not enough.');

        $config = $this->bar($this->html($this->page('/ueber-uns/team')));
        self::assertTrue($config['marking']);
        self::assertNotNull($config['page']);
        self::assertSame('draft', $config['page']['status']);
        self::assertFalse($config['page']['published']);
        self::assertNull($config['page']['visitorUrl']);
        self::assertSame($team, $config['page']['id']);
        self::assertTrue($config['page']['mayPublish'], 'Once a field changes, the bar offers to publish.');

        $none = $this->createUser('joe@example.org', []);
        self::assertGreaterThan(0, $none);
        $this->session = $this->signIn('joe@example.org');
        self::assertStringNotContainsString('fb-edit', $this->html($this->page('/')), 'Without page.show no bar.');
    }

    public function testLeadsFromThePageDetailsIntoTheMode(): void
    {
        $html = $this->html($this->request('GET', '/cms/pages/' . $this->about, session: $this->session));

        self::assertStringContainsString('<form method="post" action="/cms/edit-mode">', $html);
        self::assertStringContainsString('<input type="hidden" name="next" value="/ueber-uns">', $html);
    }

    protected function environment(): Environment
    {
        return Environment::Production;
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site')))], 'backend-edit-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }

    private function page(string $path, bool $editing = true): ResponseInterface
    {
        $response = $this->requestWithCookies($path, $editing);
        self::assertSame(200, $response->getStatusCode(), (string) $response->getBody());

        return $response;
    }

    private function requestWithCookies(string $path, bool $editing): ResponseInterface
    {
        $cookies = [AuthenticationMiddleware::COOKIE => $this->session];

        if ($editing) {
            $cookies[EditMode::COOKIE] = '1';
        }

        return $this->request('GET', $path, cookies: $cookies);
    }

    /**
     * @return array{editing: bool, marking: bool, csrf: ?string, actions: string, queries: string, language: string, toggle: string, tokens: string, labels: array<string, string|array<string, string>>, page: array<string, mixed>|null, design: array{publish: bool, discard: bool}|null, site: array{draft: bool, publish: bool, discard: bool}|null}
     */
    private function bar(string $html): array
    {
        self::assertSame(1, preg_match('~<script type="application/json" id="fb-edit-config">(.*?)</script>~s', $html, $match), 'The bar is in the page.');
        $config = json_decode($match[1], true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($config);

        /** @var array{editing: bool, marking: bool, csrf: ?string, actions: string, queries: string, language: string, toggle: string, tokens: string, labels: array<string, string|array<string, string>>, page: array<string, mixed>|null, design: array{publish: bool, discard: bool}|null, site: array{draft: bool, publish: bool, discard: bool}|null} $config */
        return $config;
    }

    private function createPage(?string $parentId, string $title): string
    {
        return $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => $title, 'content' => ['fields' => ['heading' => $title]]]], $parentId), Context::system())->id;
    }
}
