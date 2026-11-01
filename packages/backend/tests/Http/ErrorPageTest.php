<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\BackendErrorPage;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Error\ErrorMiddleware;
use Frootbox\Core\Error\ErrorPages;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(BackendErrorPage::class)]
#[CoversClass(ErrorPages::class)]
#[CoversClass(ErrorMiddleware::class)]
final class ErrorPageTest extends BackendTestCase
{
    public function testAMissingPageShowsInsideTheBackend(): void
    {
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        $response = $this->request('GET', '/cms/pages/01JZZZZZZZZZZZZZZZZZZZZZZZ', session: $session);
        $html = (string) $response->getBody();

        self::assertSame(404, $response->getStatusCode());
        self::assertStringContainsString('<title>This does not exist (anymore) · ', $html);
        self::assertStringContainsString('<h1 class="fb-heading-1" id="fb-error-title">This does not exist (anymore)</h1>', $html);
        self::assertStringContainsString('Error 404', $html);
        self::assertMatchesRegularExpression('~<a class="fb-nav__item" href="/cms/pages" aria-current="page">~', $html, 'The menu marks the area.');
        self::assertMatchesRegularExpression('~<a class="fb-button fb-button--primary" href="/cms/pages"><span>Go to Pages</span></a>~', $html, 'The way back to the list.');
        self::assertStringContainsString('Technical details', $html, 'Details in development.');
        self::assertStringContainsString('EntityNotFoundException', $html);
        self::assertStringNotContainsString(' open>', $html, 'Closed for a missing page.');
    }

    public function testSaysWhenARightIsMissing(): void
    {
        $this->createUser('editor@example.org', ['editor']);
        $session = $this->signIn('editor@example.org');

        $response = $this->request('GET', '/cms/roles/editor', session: $session);
        $html = (string) $response->getBody();

        self::assertSame(403, $response->getStatusCode());
        self::assertStringContainsString('You may not open this', $html);
        self::assertStringContainsString('href="/cms"><span>Go to the dashboard</span>', $html);
    }

    public function testAGuestGetsACardWithTheSignIn(): void
    {
        $response = $this->request('GET', '/cms/nothing-here');
        $html = (string) $response->getBody();

        self::assertSame(404, $response->getStatusCode());
        self::assertStringContainsString('class="fb-login"', $html);
        self::assertStringContainsString('href="/cms/login"><span>Sign in</span>', $html);
        self::assertStringNotContainsString('fb-sidebar', $html);
    }

    public function testLeavesTheWebsiteAndJsonAlone(): void
    {
        $website = (string) $this->request('GET', '/nothing-here')->getBody();
        self::assertStringNotContainsString('fb-error-page', $website, 'The website keeps the page of the core.');

        $json = $this->request('GET', '/cms/nothing-here', headers: ['Accept' => 'application/json']);
        self::assertSame('application/problem+json', $json->getHeaderLine('Content-Type'));
    }
}
