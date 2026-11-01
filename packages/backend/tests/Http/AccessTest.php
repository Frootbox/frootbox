<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Access\AccessHandler;
use Frootbox\Backend\Http\BackendErrorPage;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Backend\View\EditorBar;
use Frootbox\Backend\View\PreviewNote;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Auth\AuthenticationMiddleware;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\EditMode;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Page\UpdatePage;
use Frootbox\Core\Preview\PreviewAccess;
use Frootbox\Core\Site\SiteProtection;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;
use Psr\Http\Message\ResponseInterface;

#[CoversClass(AccessHandler::class)]
#[CoversClass(PreviewNote::class)]
#[CoversClass(BackendErrorPage::class)]
#[CoversClass(EditorBar::class)]
final class AccessTest extends BackendTestCase
{
    private string $about;

    private string $session;

    protected function setUp(): void
    {
        parent::setUp();

        $start = $this->createPage(null, 'Start');
        $this->about = $this->createPage($start, 'Über uns');
        $this->runner()->run(new PublishPages([$start, $this->about]), Context::system());

        $this->createUser('admin@example.org', ['admin']);
        $this->session = $this->signIn('admin@example.org');
    }

    public function testListsAndRevokesPreviewLinks(): void
    {
        $empty = $this->html($this->request('GET', '/cms/access', session: $this->session));
        self::assertStringContainsString('<h1 class="fb-heading-1">Zugang</h1>', $empty);
        self::assertStringContainsString('href="/cms/access" aria-current="page"', $empty, 'The menu has the screen under Website.');
        self::assertStringContainsString('Noch keine Vorschaulinks', $empty);
        self::assertStringContainsString('<fb-form action="preview.create"', $empty);
        self::assertMatchesRegularExpression('~<option value="[^"]+" selected>14 Tage</option>~', $empty, 'Two weeks by default.');
        self::assertStringContainsString('<fb-form action="site.protect"', $empty);
        self::assertStringNotContainsString('commandfor="protection-off"', $empty, 'Nothing to switch off.');

        $link = $this->action('preview.create', ['note' => 'für Frau Müller'], $this->session)['data'];
        self::assertIsArray($link);
        self::assertIsString($link['id']);

        $html = $this->html($this->request('GET', '/cms/access', session: $this->session));
        self::assertStringContainsString('für Frau Müller', $html);
        self::assertStringContainsString('noch nicht geöffnet', $html);
        self::assertMatchesRegularExpression('~data-fb-copy="https://example\.org/\?fb-preview=[A-Za-z0-9_-]{43}"~', $html, 'The full address to copy.');
        self::assertStringContainsString('commandfor="preview-revoke"', $html);

        $this->action('preview.revoke', ['id' => $link['id']], $this->session);
        $revoked = $this->html($this->request('GET', '/cms/access', session: $this->session));
        self::assertStringContainsString('Zurückgezogen', $revoked);
        self::assertStringNotContainsString('data-fb-copy="https', $revoked, 'An ended link is not copied any more.');
        self::assertStringNotContainsString('commandfor="preview-edit" command="show-modal"', $revoked, 'A revoked link stays revoked.');
    }

    public function testEditorsShareLinksButLeaveTheProtection(): void
    {
        $this->createUser('jane@example.org', ['editor']);
        $session = $this->signIn('jane@example.org');

        $html = $this->html($this->request('GET', '/cms/access', session: $session));
        self::assertStringContainsString('<fb-form action="preview.create"', $html);
        self::assertStringNotContainsString('<fb-form action="site.protect"', $html, 'The protection is for admins.');
        self::assertStringContainsString('Passwortschutz', $html, 'But editors see whether it is on.');
    }

    public function testTheFrameSaysTheWebsiteIsProtected(): void
    {
        self::assertStringNotContainsString('fb-nav__item--notice', $this->html($this->request('GET', '/cms', session: $this->session)));

        $this->action('site.protect', ['password' => 'geheim1234'], $this->session);

        $html = $this->html($this->request('GET', '/cms', session: $this->session));
        self::assertStringContainsString('<a class="fb-nav__item fb-nav__item--small fb-nav__item--notice" href="/cms/access">', $html);
        self::assertStringContainsString('Website ist passwortgeschützt', $html);

        $access = $this->html($this->request('GET', '/cms/access', session: $this->session));
        self::assertStringContainsString('commandfor="protection-off"', $access);
        self::assertStringContainsString('Neues Passwort setzen', $access);
    }

    public function testGuestsGetThePasswordPageOfTheBackend(): void
    {
        $this->action('site.protect', ['password' => 'geheim1234'], $this->session);

        $page = $this->request('GET', '/ueber-uns');
        self::assertSame(401, $page->getStatusCode());
        $html = $this->html($page);
        self::assertStringContainsString('<main class="fb-login">', $html, 'Like the sign-in of the backend.');
        self::assertStringContainsString('Noch nicht öffentlich', $html);
        self::assertStringContainsString('name="fb-site-password"', $html);
        self::assertStringContainsString('href="/cms/login"', $html);

        $wrong = $this->request('POST', '/ueber-uns', ['fb-site-password' => 'falsch']);
        self::assertSame(401, $wrong->getStatusCode());
        self::assertStringContainsString('Das Passwort stimmt nicht.', $this->html($wrong));

        $right = $this->request('POST', '/ueber-uns', ['fb-site-password' => 'geheim1234']);
        self::assertSame(303, $right->getStatusCode());
        $cookie = self::cookie($right, SiteProtection::COOKIE);
        self::assertSame(200, $this->request('GET', '/ueber-uns', cookies: [SiteProtection::COOKIE => $cookie])->getStatusCode());
    }

    public function testGuestsWithALinkSeeTheNote(): void
    {
        $this->runner()->run(new UpdatePage($this->about, ['de' => ['content' => ['fields' => ['heading' => 'Neu im Entwurf']]]]), Context::system());
        $data = $this->action('preview.create', [], $this->session)['data'];
        self::assertIsArray($data);
        self::assertIsString($data['path']);
        self::assertIsString($data['id']);

        $open = $this->request('GET', $data['path']);
        self::assertSame(303, $open->getStatusCode());
        $cookie = self::cookie($open, PreviewAccess::COOKIE);

        $html = $this->html($this->request('GET', '/ueber-uns', cookies: [PreviewAccess::COOKIE => $cookie]));
        self::assertStringContainsString('>Neu im Entwurf</h1>', $html);
        self::assertStringContainsString('<script type="application/json" id="fb-preview-config">', $html);
        self::assertStringContainsString('"title":"Vorschau, noch nicht veröffentlicht"', $html);
        self::assertStringContainsString('"end":"/ueber-uns?fb-preview=0"', $html);
        self::assertStringContainsString('src="/assets/frootbox/backend/assets/build/preview.js?v=', $html);
        self::assertStringNotContainsString('fb-edit-config', $html, 'No bar for guests.');

        $own = $this->html($this->request('GET', '/ueber-uns', session: $this->session, cookies: [PreviewAccess::COOKIE => $cookie]));
        self::assertStringNotContainsString('fb-preview-config', $own, 'Signed-in users get their own view.');

        $this->action('preview.revoke', ['id' => $data['id']], $this->session);
        $ended = $this->request('GET', '/ueber-uns', cookies: [PreviewAccess::COOKIE => $cookie]);
        self::assertSame(410, $ended->getStatusCode());
        self::assertStringContainsString('Vorschaulink abgelaufen', $this->html($ended));
        self::assertStringContainsString('<main class="fb-login">', $this->html($ended));
    }

    public function testTheBarSharesPreviews(): void
    {
        $html = $this->html($this->request('GET', '/ueber-uns', cookies: [AuthenticationMiddleware::COOKIE => $this->session, EditMode::COOKIE => '1']));
        self::assertSame(1, preg_match('~<script type="application/json" id="fb-edit-config">(.*?)</script>~s', $html, $match));
        $config = json_decode($match[1], true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($config);
        self::assertIsArray($config['preview']);
        self::assertSame('/cms/access', $config['preview']['manage']);
        self::assertIsArray($config['preview']['durations']);
        self::assertCount(\count(AccessHandler::DAYS), $config['preview']['durations']);
        $selected = array_values(array_filter($config['preview']['durations'], static fn(mixed $duration): bool => \is_array($duration) && true === ($duration['selected'] ?? null)));
        self::assertCount(1, $selected);
        self::assertSame('14 Tage', $selected[0]['label'] ?? null, 'Two weeks by default.');
        self::assertSame('/cms/access', $config['access']);
        self::assertFalse($config['protection']);
        self::assertIsArray($config['labels']);
        self::assertSame('Vorschau teilen …', $config['labels']['share']);
    }

    protected function environment(): Environment
    {
        return Environment::Development;
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site')))], 'backend-access-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }

    private static function cookie(ResponseInterface $response, string $name): string
    {
        foreach ($response->getHeader('Set-Cookie') as $line) {
            if (1 === preg_match('/^' . preg_quote($name, '/') . '=([^;]+);/', $line, $match)) {
                return rawurldecode($match[1]);
            }
        }

        self::fail(\sprintf('No cookie %s in %s.', $name, implode(' | ', $response->getHeader('Set-Cookie'))));
    }

    private function createPage(?string $parentId, string $title): string
    {
        return $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => $title, 'content' => ['fields' => ['heading' => $title]]]], $parentId), Context::system())->id;
    }
}
