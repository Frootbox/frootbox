<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Auth\AuthenticationMiddleware;
use Frootbox\Core\Design\DesignPage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * The design page with the translations of the backend, which hold the
 * German texts of the core.
 */
#[CoversClass(DesignPage::class)]
final class DesignPageLanguageTest extends BackendTestCase
{
    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site')))], 'backend-design-language-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch'], 'en' => ['title' => 'English']], 'backend' => ['language' => 'en']];
    }

    public function testSpeaksTheLanguageOfThePage(): void
    {
        // Its own texts follow the page, not the English backend (decision 0207).
        $this->createUser('admin@example.org', ['admin']);
        $session = $this->signIn('admin@example.org');

        foreach (['/_design' => 'Grundelemente', '/_design?language=en' => 'Basic elements'] as $path => $title) {
            $response = $this->request('GET', $path, cookies: [AuthenticationMiddleware::COOKIE => $session]);
            self::assertSame(200, $response->getStatusCode(), (string) $response->getBody());
            preg_match_all('~<h2 id="fb-design-[a-z]+-title">(.*?)</h2>~', (string) $response->getBody(), $titles);
            self::assertContains($title, $titles[1]);
        }
    }
}
