<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Tests;

use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Category\CreateCategory;
use Frootbox\Core\Media\CreateMedium;
use Frootbox\Core\Media\ShowMedium;
use Frootbox\Core\Media\Uploads;
use Frootbox\Core\Page\CreatePage;
use Frootbox\Core\Page\PublishPages;
use Frootbox\Core\Plugin\AssignPlugin;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\ProjectPaths;
use Frootbox\Core\Url\Urls;
use Frootbox\People\Blocks\PersonList;
use Frootbox\People\CategoryChoices;
use Frootbox\People\Location\CreateLocation;
use Frootbox\People\Location\PublishLocation;
use Frootbox\People\Person\CreatePerson;
use Frootbox\People\Person\DeletePerson;
use Frootbox\People\Person\ListPeople;
use Frootbox\People\Person\PersonEditor;
use Frootbox\People\Person\PublishPeople;
use Frootbox\People\Person\ShowPerson;
use Frootbox\People\Person\UnpublishPerson;
use Frootbox\People\Person\UpdatePerson;
use Frootbox\People\PersonPlugin;
use Frootbox\People\Website\Cards;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(PersonPlugin::class)]
#[CoversClass(PersonList::class)]
#[CoversClass(PersonEditor::class)]
#[CoversClass(Cards::class)]
#[CoversClass(CategoryChoices::class)]
final class PluginTest extends PeopleTestCase
{
    public function testPeopleGetProfilesBelowThePageOfTheirSpace(): void
    {
        $start = $this->tree();
        $team = $this->teamPage($start, 'Team');
        $maria = $this->runner()->run(new CreatePerson(givenName: 'Maria', familyName: 'Rossi', prefix: 'Dr.', email: 'maria@example.org', translations: ['de' => ['role' => 'Röstmeisterin', 'text' => 'Röstet seit zwanzig Jahren.']]))->id;
        self::assertSame('dr-maria-rossi', $this->runner()->ask(new ShowPerson($maria))->current()->slug, 'The slug comes from the name.');
        $this->runner()->run(new PublishPeople([$maria]));

        $html = $this->html('/team');
        self::assertStringContainsString('<a href="/team/dr-maria-rossi">Dr. Maria Rossi</a>', $html, 'The card links to the profile.');

        $profile = $this->html('/team/dr-maria-rossi');
        self::assertStringContainsString('<h1 class="people-profile__name">Dr. Maria Rossi</h1>', $profile, 'The profile has the heading of the page.');
        self::assertStringContainsString('<title>Dr. Maria Rossi', $profile);
        self::assertStringContainsString('<meta name="description" content="Röstmeisterin">', $profile);
        self::assertStringContainsString('"@type":"Person","name":"Dr. Maria Rossi","honorificPrefix":"Dr.","givenName":"Maria","familyName":"Rossi","jobTitle":"Röstmeisterin"', $profile);
        self::assertStringContainsString('<a href="/team">', $profile, 'Back to the team.');
        self::assertSame(['de' => '/team/dr-maria-rossi', 'en' => '/en/team/dr-maria-rossi'], $this->runner()->ask(new ShowPerson($maria))->urls);

        // The block Team on another page links there too.
        $other = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => 'Kontakt', 'content' => ['fields' => ['heading' => 'Kontakt'], 'areas' => ['main' => [['block' => 'frootbox/people/People'], ['block' => 'frootbox/people/Person', 'options' => ['person' => $maria]]]]]]], $start))->id;
        $this->runner()->run(new PublishPages([$other]));
        self::assertSame(2, substr_count($this->html('/kontakt'), '<a href="/team/dr-maria-rossi">Dr. Maria Rossi</a>'));

        // The name changes, the address follows and the old one redirects.
        $this->runner()->run(new UpdatePerson($maria, prefix: ''));
        $this->runner()->run(new PublishPeople([$maria]));
        self::assertStringContainsString('<h1 class="people-profile__name">Maria Rossi</h1>', $this->html('/team/maria-rossi'));
        self::assertSame('/team/maria-rossi', $this->get(Urls::class)->path('frootbox/people/person:' . $maria, 'de'));

        // Offline the profile is gone, the card too.
        $this->runner()->run(new UnpublishPerson($maria));
        $this->get(Urls::class)->clear();
        self::assertNull($this->get(Urls::class)->path('frootbox/people/person:' . $maria, 'de'));
        self::assertStringNotContainsString('Maria Rossi', $this->html('/team'));
        self::assertNotNull($this->runner()->ask(new ShowPerson($maria))->draft, 'It stays as a draft.');

        $this->runner()->run(new PublishPeople([$maria]));
        $this->runner()->run(new DeletePerson($maria));
        $this->get(Urls::class)->clear();
        self::assertNull($this->get(Urls::class)->path('frootbox/people/person:' . $maria, 'de'));
    }

    public function testProfilesAreAChoice(): void
    {
        $start = $this->tree();
        $this->teamPage($start, 'Team', details: false);
        $this->person('Jonas', 'Berger', 'Röster');

        $html = $this->html('/team');
        self::assertStringContainsString('class="people-card__name">Jonas Berger</h', $html, 'Without profiles no links.');
        self::assertSame([], $this->runner()->ask(new ShowPerson($this->runner()->ask(new ListPeople())[0]->id))->urls);
    }

    public function testSlugsStayUniqueAcrossSpaces(): void
    {
        $doctors = $this->runner()->run(new CreateSpace('frootbox/people/person', 'Ärzte'))->id;
        $first = $this->runner()->run(new CreatePerson(givenName: 'Lukas', familyName: 'Hansen'))->id;
        $second = $this->runner()->run(new CreatePerson(givenName: 'Lukas', familyName: 'Hansen', space: $doctors))->id;
        self::assertSame(['lukas-hansen', 'lukas-hansen-2'], [$this->runner()->ask(new ShowPerson($first))->current()->slug, $this->runner()->ask(new ShowPerson($second))->current()->slug], 'One from the name finds a free one.');

        try {
            $this->runner()->run(new UpdatePerson($second, slug: 'lukas-hansen'));
            self::fail('A slug someone else has.');
        } catch (InvalidInputException $exception) {
            self::assertArrayHasKey('/slug', $exception->errors);
        }

        try {
            $this->runner()->run(new UpdatePerson($second, slug: 'Lukas Hansen'));
            self::fail('No valid slug.');
        } catch (InvalidInputException $exception) {
            self::assertArrayHasKey('/slug', $exception->errors);
        }

        $this->runner()->run(new UpdatePerson($second, slug: 'dr-hansen'));
        $this->runner()->run(new UpdatePerson($second, familyName: 'Hansen-Berg'));
        self::assertSame('dr-hansen', $this->runner()->ask(new ShowPerson($second))->current()->slug, 'One given stays.');

        $this->expectException(InvalidInputException::class);
        $this->runner()->run(new CreatePerson(familyName: 'Neu', space: 'gibt-es-nicht'));
    }

    public function testTheTeamShowsItsSpaceAndFiltersByCategoryAndTag(): void
    {
        $start = $this->tree();
        $doctors = $this->runner()->run(new CreateSpace('frootbox/people/person', 'Ärzte'))->id;
        $this->teamPage($start, 'Team');
        $this->teamPage($start, 'Ärzte', $doctors);
        $care = $this->runner()->run(new CreateCategory('frootbox/people/categories', ['de' => ['title' => 'Pflege']]))->id;
        $intensive = $this->runner()->run(new CreateCategory('frootbox/people/categories', ['de' => ['title' => 'Intensivpflege']], $care))->id;
        $office = $this->runner()->run(new CreateCategory('frootbox/people/categories', ['de' => ['title' => 'Verwaltung']]))->id;

        $anna = $this->runner()->run(new CreatePerson(givenName: 'Anna', familyName: 'Albers', categories: [$intensive], tags: ['Nachtdienst']))->id;
        $bernd = $this->runner()->run(new CreatePerson(givenName: 'Bernd', familyName: 'Brandt', categories: [$office]))->id;
        $clara = $this->runner()->run(new CreatePerson(givenName: 'Clara', familyName: 'Conrad', prefix: 'Dr.', space: $doctors))->id;
        $this->runner()->run(new PublishPeople([$anna, $bernd, $clara]));

        $html = $this->html('/team');
        self::assertStringContainsString('Anna Albers', $html);
        self::assertStringNotContainsString('Clara Conrad', $html, 'Only its space.');
        self::assertStringContainsString('<a class="people-filter__link" href="/team?category=intensivpflege">Intensivpflege</a>', $html);
        self::assertStringNotContainsString('?category=pflege"', $html, 'Only categories people have.');
        self::assertStringNotContainsString('?tag=', $html, 'One tag is no filter.');
        self::assertStringContainsString('Clara Conrad', $this->html('/aerzte'));

        $html = $this->html('/team?category=verwaltung');
        self::assertStringContainsString('Bernd Brandt', $html);
        self::assertStringNotContainsString('Anna Albers', $html);

        // The block Team on any page: a category with the ones below it, a tag, a space.
        $choices = $this->runner()->ask(new CategoryChoices());
        self::assertSame(['', $care, $intensive, $office], array_column($choices, 'value'));
        self::assertSame('– Intensivpflege', $choices[2]['label']);
        $page = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => 'Station', 'content' => ['fields' => ['heading' => 'Station'], 'areas' => ['main' => [
            ['block' => 'frootbox/people/People', 'options' => ['category' => $care]],
            ['block' => 'frootbox/people/People', 'options' => ['tag' => 'nachtdienst']],
            ['block' => 'frootbox/people/People', 'options' => ['space' => $doctors]],
        ]]]]], $start))->id;
        $this->runner()->run(new PublishPages([$page]));
        $html = $this->html('/station');
        self::assertSame(2, substr_count($html, 'Anna Albers'), 'In the category below and with the tag.');
        self::assertSame(1, substr_count($html, 'Clara Conrad'));
        self::assertStringNotContainsString('Bernd Brandt', $html);
    }

    public function testPhotosAndImagesBecomePublicWithThePersonOrTheLocation(): void
    {
        [$photo, $picture] = [$this->medium(), $this->medium()];
        $person = $this->runner()->run(new CreatePerson(familyName: 'Rossi', image: ['media' => $photo, 'alt' => 'Maria']))->id;
        $location = $this->runner()->run(new CreateLocation(['de' => ['name' => 'Rösterei']], image: ['media' => $picture]))->id;
        self::assertFalse($this->runner()->ask(new ShowMedium($photo))->public);

        $this->runner()->run(new PublishPeople([$person]));
        $this->runner()->run(new PublishLocation($location));
        self::assertTrue($this->runner()->ask(new ShowMedium($photo))->public);
        self::assertTrue($this->runner()->ask(new ShowMedium($picture))->public);
    }

    /**
     * A new image, each one different.
     */
    private function medium(): string
    {
        $image = imagecreatetruecolor(32, 20);
        imagefilledrectangle($image, 0, 0, 16, 20, (int) imagecolorallocate($image, random_int(0, 255), random_int(0, 255), random_int(0, 255)));
        $file = $this->get(ProjectPaths::class)->var('people-' . bin2hex(random_bytes(4)) . '.png');
        @mkdir(\dirname($file), 0o775, true);
        imagepng($image, $file);

        return $this->runner()->run(new CreateMedium($this->get(Uploads::class)->store($file, 'bild.png')))->id;
    }

    /**
     * The start page, published.
     */
    private function tree(): string
    {
        $start = $this->page('Start');
        $this->runner()->run(new PublishPages([$start]));

        return $start;
    }

    /**
     * A published page in both languages that shows a space of the people.
     */
    private function teamPage(string $parentId, string $title, string $space = Space::DEFAULT, ?bool $details = null): string
    {
        $content = ['fields' => ['heading' => $title], 'areas' => ['main' => []]];
        $id = $this->runner()->run(new CreatePage('acme/base/Page', ['de' => ['title' => $title, 'content' => $content], 'en' => ['title' => $title, 'content' => $content]], $parentId))->id;
        $this->runner()->run(new AssignPlugin($id, 'frootbox/people/person', $space, $details));
        $this->runner()->run(new PublishPages([$id]));

        return $id;
    }
}
