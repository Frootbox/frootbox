<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\Theme\ThemeHandler;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Design\PublishDesign;
use Frootbox\Core\Design\UpdateDesign;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Tests\Support\FixtureSite;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(ThemeHandler::class)]
final class ThemeScreenTest extends BackendTestCase
{
    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createUser('admin@example.org', ['admin']);
        $this->session = $this->signIn('admin@example.org');
    }

    public function testEditorsDoNotSeeIt(): void
    {
        // Decision 0138: the design is for the whole website.
        $this->createUser('editor@example.org', ['editor']);
        $editor = $this->signIn('editor@example.org');

        self::assertSame(403, $this->request('GET', '/cms/theme', session: $editor)->getStatusCode());
        self::assertStringNotContainsString('/cms/theme"', $this->html($this->request('GET', '/cms', session: $editor)), 'The menu hides it.');
    }

    public function testShowsTheDesignAndLeadsToTheWebsite(): void
    {
        $html = $this->html($this->request('GET', '/cms/theme', session: $this->session));

        self::assertStringContainsString('<h1 class="fb-heading-1">Design</h1>', $html);
        self::assertStringContainsString('Farben, Schriften und Maße des Themes acme/site.', $html);
        self::assertStringContainsString('<input type="hidden" name="next" value="/_design#fb-design">', $html, 'The panel opens on the design page (decision 0207).');
        self::assertStringContainsString('<a class="fb-button fb-button--outline" href="/_design"><span>Alle Elemente</span></a>', $html);
        self::assertStringContainsString('Besucher sehen das Design des Themes.', $html);
        self::assertStringContainsString('<span class="fb-swatch" style="--fb-swatch: #cc0000" aria-hidden="true"></span>', $html);
        self::assertStringContainsString('<code>--radius</code>', $html);
        self::assertStringContainsString('Kontrast 2,7 : 1', $html, 'A colour that is hard to read is marked.');
        self::assertStringContainsString('Noch nicht veröffentlicht.', $html);
        self::assertStringContainsString('/cms/theme"', $html, 'The menu has the screen.');
    }

    public function testOffersToPublishAndRestore(): void
    {
        $this->runner()->run(new UpdateDesign(['radius' => '10px', 'font-heading' => 'lora']), Context::system());
        $this->runner()->run(new PublishDesign(), Context::system());
        $this->runner()->run(new UpdateDesign(['radius' => '12px']), Context::system());

        $html = $this->html($this->request('GET', '/cms/theme', session: $this->session));
        self::assertStringContainsString('Es gibt Änderungen, die Besucher noch nicht sehen.', $html);
        self::assertStringContainsString('<fb-form action="design.publish"', $html);
        self::assertStringContainsString('commandfor="design-discard"', $html);
        self::assertStringContainsString('Werte im Entwurf', $html);
        self::assertStringContainsString('Lora', $html);
        self::assertStringContainsString('Version 1', $html);
        self::assertStringContainsString('Online', $html);

        $published = $this->action('design.publish', [], $this->session);
        self::assertIsArray($published['data']);
        self::assertFalse($published['data']['draft']);

        $restored = $this->action('design.restore', ['version' => 1], $this->session);
        self::assertIsArray($restored['data']);
        self::assertTrue($restored['data']['draft']);
    }

    public function testNeedsThePermission(): void
    {
        $this->createUser('nobody@example.org', []);
        $nobody = $this->signIn('nobody@example.org');

        self::assertSame(403, $this->request('GET', '/cms/theme', session: $nobody)->getStatusCode());
        self::assertStringNotContainsString('/cms/theme"', $this->html($this->request('GET', '/cms', session: $nobody)));
    }

    protected function extensions(): Extensions
    {
        return new Extensions([self::backend(), ...array_values(iterator_to_array(FixtureSite::extensions('base', 'site')))], 'backend-theme-tests');
    }

    protected function config(): array
    {
        return ['app' => ['url' => 'https://example.org'], 'theme' => 'acme/site', 'languages' => ['de' => ['title' => 'Deutsch']], 'backend' => ['language' => 'de']];
    }
}
