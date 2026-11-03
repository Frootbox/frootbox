<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Tests;

use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PublishPages;
use Frootbox\People\Blocks\Location;
use Frootbox\People\Blocks\People;
use Frootbox\People\Blocks\Person;
use Frootbox\People\Person\UpdatePerson;
use Frootbox\People\Website\Cards;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * The blocks Team, Contact person and Location (decision 0226).
 */
#[CoversClass(Cards::class)]
#[CoversClass(People::class)]
#[CoversClass(Person::class)]
#[CoversClass(Location::class)]
final class WebsiteTest extends PeopleTestCase
{
    public function testShowsThePublishedTeam(): void
    {
        $harbour = $this->harbour();
        $maria = $this->person('Maria', 'Rossi', 'Röstmeisterin', [$harbour]);
        $this->person('Ben', 'Berg', 'Barista');
        $this->person('Dora', 'Draft', publish: false);
        $this->runner()->run(new UpdatePerson($maria, familyName: 'Changed'));

        $page = $this->page('Team', [
            ['block' => 'frootbox/people/People', 'fields' => ['title' => 'Unser Team']],
            ['block' => 'frootbox/people/People', 'options' => ['location' => $harbour]],
        ]);
        $this->runner()->run(new PublishPages([$page]));
        $html = $this->html('/');

        self::assertStringContainsString('<h1 class="people__title">Unser Team</h1>', $html);
        self::assertMatchesRegularExpression('#<h2 class="people-card__name">Ben Berg</h2>\s*<p class="people-card__role">Barista</p>#', $html, 'Each name a heading below the one of the block.');
        self::assertStringContainsString('<a href="tel:+4940123456" dir="ltr">+49 (40) 123 45-6</a>', $html);
        self::assertStringContainsString('<a href="mailto:maria@example.org" dir="ltr">maria@example.org</a>', $html);
        self::assertStringNotContainsString('Dora', $html, 'Drafts stay hidden.');
        self::assertStringNotContainsString('Changed', $html, 'Visitors see the published version.');
        self::assertSame(3, substr_count($html, 'class="people-card"'), 'Two of all locations, one of the harbour.');
    }

    public function testShowsAContactPersonAndALocation(): void
    {
        $harbour = $this->harbour();
        $maria = $this->person('Maria', 'Rossi', 'Röstmeisterin', [$harbour]);
        $page = $this->page('Kontakt', [
            ['block' => 'frootbox/people/Person', 'options' => ['person' => $maria]],
            ['block' => 'frootbox/people/Location', 'options' => ['location' => $harbour]],
            ['block' => 'frootbox/people/Location', 'options' => ['location' => $harbour, 'map' => 'none']],
            ['block' => 'frootbox/people/Person', 'options' => ['person' => '']],
        ]);
        $this->runner()->run(new PublishPages([$page]));
        $html = $this->html('/');

        self::assertStringContainsString('<div class="people-card people-card--contact">', $html);
        self::assertStringContainsString('<h2 class="people-location__name">Café am Hafen</h2>', $html, 'Without a heading of the block the name takes its rank, below the person before.');
        self::assertStringContainsString("Hafenstraße 12<br />\n20457 Hamburg", $html);
        self::assertStringContainsString("Mo–Fr 8–18 Uhr<br />\nSa 9–14 Uhr", $html, 'Empty lines of the opening hours fall away.');
        self::assertStringContainsString('<fb-external class="external" service="openstreetmap"', $html, 'The map waits for consent (decision 0225).');
        self::assertSame(1, substr_count($html, '<fb-external'), 'One location without a map.');
        self::assertStringContainsString('<script type="application/ld+json">{"@context":"https://schema.org","@type":"Place","name":"Café am Hafen","address":{"@type":"PostalAddress","streetAddress":"Hafenstraße 12","postalCode":"20457","addressLocality":"Hamburg"},"telephone":"+49 40 123456","email":"hafen@example.org","geo":{"@type":"GeoCoordinates","latitude":53.5444,"longitude":9.9663}}</script>', $html);
        self::assertStringNotContainsString('Choose a person', $html, 'Visitors see no hint for editors.');
    }

    public function testSpeaksTheLanguageOfThePage(): void
    {
        $harbour = $this->harbour();
        $content = ['fields' => ['heading' => 'Kontakt'], 'areas' => ['main' => [['block' => 'frootbox/people/Location', 'options' => ['location' => $harbour]]]]];
        $page = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => 'Kontakt', 'content' => $content], 'en' => ['title' => 'Contact', 'content' => $content]]))->id;
        $this->runner()->run(new PublishPages([$page]));

        self::assertStringContainsString('<h1 class="people-location__name">Café by the harbour</h1>', $this->html('/en'));
        self::assertStringNotContainsString('Mo–Fr', $this->html('/en'), 'The English version has no opening hours.');
    }
}
