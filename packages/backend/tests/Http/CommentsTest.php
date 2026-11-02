<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Comments\CommentsHandler;
use Frootbox\Backend\Http\PreviewActionHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Backend\View\EditorBar;
use Frootbox\Backend\View\Menu;
use Frootbox\Backend\View\PreviewNote;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Auth\AuthenticationMiddleware;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\EditMode;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Preview\PreviewAccess;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;
use Psr\Http\Message\ResponseInterface;

#[CoversClass(PreviewActionHandler::class)]
#[CoversClass(CommentsHandler::class)]
#[CoversClass(PreviewNote::class)]
#[CoversClass(EditorBar::class)]
#[CoversClass(Menu::class)]
final class CommentsTest extends BackendTestCase
{
    private string $about;

    private string $session;

    private string $cookie;

    protected function setUp(): void
    {
        parent::setUp();

        $start = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => 'Start', 'content' => ['fields' => ['heading' => 'Start']]]]), Context::system())->id;
        $this->about = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => 'Über uns', 'content' => ['fields' => ['heading' => 'Wer wir sind']]]], $start), Context::system())->id;
        $this->runner()->run(new PublishPages([$start, $this->about]), Context::system());

        $this->createUser('editor@example.org', ['editor']);
        $this->session = $this->signIn('editor@example.org');
        $link = $this->action('preview.create', ['note' => 'Frau Müller'], $this->session)['data'];
        self::assertIsArray($link);
        self::assertIsString($link['path']);
        $open = $this->request('GET', $link['path']);
        $this->cookie = self::cookie($open, PreviewAccess::COOKIE);
    }

    public function testTheNoteOfAPreviewOffersComments(): void
    {
        $html = $this->html($this->request('GET', '/ueber-uns', cookies: [PreviewAccess::COOKIE => $this->cookie]));

        self::assertStringContainsString('"comments":true', $html);
        self::assertStringContainsString('"pageId":"' . $this->about . '"', $html);
        self::assertStringContainsString('"actions":"/cms/preview/actions/"', $html);
        self::assertStringContainsString('"queries":"/cms/preview/queries/"', $html);
        self::assertStringContainsString('"pickHint":"Klicke auf die Stelle, die Du kommentieren willst."', $html);
        self::assertStringContainsString('<h1 data-fb-field="heading" data-fb-label="Überschrift">Wer wir sind</h1>', $html, 'Light marks to pick a place.');
    }

    public function testAGuestCommentsThroughThePreview(): void
    {
        $thread = $this->guest('POST', 'actions/comment.create', ['pageId' => $this->about, 'body' => 'Bitte das Foto tauschen.', 'authorName' => 'Frau Müller', 'field' => 'heading', 'excerpt' => 'Wer wir sind']);
        self::assertSame(200, $thread->getStatusCode(), (string) $thread->getBody());
        self::assertStringContainsString('no-store', $thread->getHeaderLine('Cache-Control'));
        $data = self::data($thread);
        self::assertSame('Frau Müller', self::at($data, 'comment', 'authorName'));
        self::assertTrue(self::at($data, 'comment', 'guest'));

        $list = self::data($this->guest('GET', 'queries/comment.list?pageId=' . $this->about));
        self::assertCount(1, $list);

        // Errors in the language of the backend, by field.
        $invalid = $this->guest('POST', 'actions/comment.create', ['pageId' => $this->about, 'body' => 'Ohne Namen']);
        self::assertSame(422, $invalid->getStatusCode());
        self::assertStringContainsString('{"pointer":"/authorName","message":"darf nicht leer sein."}', (string) $invalid->getBody());

        // Only what the preview may do, and only for guests of a link.
        self::assertSame(404, $this->guest('POST', 'actions/comment.resolve', ['id' => $data['id']])->getStatusCode());
        self::assertSame(404, $this->guest('POST', 'actions/page.create', [])->getStatusCode());
        self::assertSame(405, $this->guest('GET', 'actions/comment.create')->getStatusCode(), 'Actions only by POST.');
        self::assertSame(404, $this->guest('GET', 'queries/comment.create')->getStatusCode(), 'No action as a query.');
        self::assertSame(400, $this->guest('POST', 'actions/comment.create', ['pageId' => $this->about, 'body' => 'x', 'authorName' => 'y'], header: false)->getStatusCode());
        self::assertSame(403, $this->request('POST', '/cms/preview/actions/comment.create', headers: [PreviewActionHandler::HEADER => '1'], json: ['pageId' => $this->about, 'body' => 'x', 'authorName' => 'y'])->getStatusCode(), 'Without a link.');
    }

    public function testEditorsSeeAndAnswerComments(): void
    {
        $data = self::data($this->guest('POST', 'actions/comment.create', ['pageId' => $this->about, 'body' => "Erste Zeile\nZweite <Zeile>", 'authorName' => 'Frau Müller', 'excerpt' => 'Wer wir sind', 'path' => '/ueber-uns']));
        self::assertIsString($data['id']);

        $html = $this->html($this->request('GET', '/cms/comments', session: $this->session));
        self::assertStringContainsString('<h1 class="fb-heading-1">Kommentare</h1>', $html);
        self::assertMatchesRegularExpression('~href="/cms/comments" aria-current="page">.*?<span>Kommentare</span><span class="fb-nav__count"><span class="fb-visually-hidden">, </span>1<span class="fb-visually-hidden"> offen</span>~s', $html, 'The menu counts open threads.');
        self::assertStringContainsString('<a href="/ueber-uns">Über uns</a>', $html);
        self::assertStringContainsString("Erste Zeile\nZweite &lt;Zeile&gt;", $html, 'Plain text, escaped.');
        self::assertStringContainsString('<fb-form action="comment.reply"', $html);
        self::assertStringContainsString('<fb-form action="comment.resolve"', $html);

        $this->action('comment.reply', ['commentId' => $data['id'], 'body' => 'Ist getauscht.'], $this->session);
        $this->action('comment.resolve', ['id' => $data['id']], $this->session);

        $open = $this->html($this->request('GET', '/cms/comments', session: $this->session));
        self::assertStringContainsString('Keine offenen Kommentare', $open);
        self::assertStringNotContainsString('fb-nav__count', $open);
        $done = $this->html($this->request('GET', '/cms/comments?status=done', session: $this->session));
        self::assertStringContainsString('Ist getauscht.', $done);
        self::assertStringContainsString('Erledigt von Jane Doe.', $done);

        // The customer sees the reply and the status.
        $seen = self::data($this->guest('GET', 'queries/comment.list'));
        self::assertSame('done', self::at($seen, 0, 'status'));
        self::assertSame('Ist getauscht.', self::at($seen, 0, 'replies', 0, 'body'));
    }

    public function testTheBarHasTheComments(): void
    {
        $html = $this->html($this->request('GET', '/ueber-uns', cookies: [AuthenticationMiddleware::COOKIE => $this->session, EditMode::COOKIE => '1']));

        self::assertStringContainsString('"comments":{"resolve":true,"delete":true}', $html);
        self::assertStringContainsString('"resolve":"Erledigen"', $html);
        self::assertStringContainsString('"commentPin":"Kommentar {number}: {text}"', $html);
    }

    protected function environment(): Environment
    {
        return Environment::Production;
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site')))], 'backend-comments-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']]];
    }

    /**
     * @param array<string, mixed>|null $json
     */
    private function guest(string $method, string $path, ?array $json = null, bool $header = true): ResponseInterface
    {
        return $this->request($method, '/cms/preview/' . $path, headers: $header ? [PreviewActionHandler::HEADER => '1', 'Accept' => 'application/json'] : [], json: $json, cookies: [PreviewAccess::COOKIE => $this->cookie]);
    }

    /**
     * @return array<mixed>
     */
    private static function data(ResponseInterface $response): array
    {
        $body = json_decode((string) $response->getBody(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($body);
        self::assertIsArray($body['data'] ?? null, (string) $response->getBody());

        return $body['data'];
    }

    /**
     * A value deep inside decoded JSON, null if a key is missing.
     */
    private static function at(mixed $value, string|int ...$keys): mixed
    {
        foreach ($keys as $key) {
            $value = \is_array($value) ? $value[$key] ?? null : null;
        }

        return $value;
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
}
