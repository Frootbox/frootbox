<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People\Tests;

use Frootbox\Core\Action\AccessDeniedException;
use Frootbox\Core\Action\Channel;
use Frootbox\Core\Action\Context;
use Frootbox\Core\Auth\Actor;
use Frootbox\Core\Plugin\CreateSpace;
use Frootbox\Core\Plugin\Space;
use Frootbox\Core\Plugin\SpaceScopes;
use Frootbox\Core\User\AssignRole;
use Frootbox\Core\User\CreateUser;
use Frootbox\People\Person\CreatePerson;
use Frootbox\People\Person\DeletePerson;
use Frootbox\People\Person\ListPeople;
use Frootbox\People\Person\PersonStore;
use Frootbox\People\Person\PersonSummary;
use Frootbox\People\Person\PublishPeople;
use Frootbox\People\Person\UpdatePerson;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * An editor with a role only within one space (decision 0245).
 */
#[CoversClass(ListPeople::class)]
#[CoversClass(UpdatePerson::class)]
final class SpaceRightsTest extends PeopleTestCase
{
    public function testAnEditorWorksOnlyWithinTheSpace(): void
    {
        $space = $this->runner()->run(new CreateSpace(PersonStore::TYPE, 'Ärzte'))->id;
        $outside = $this->person('Lena', 'Hoffmann');
        $inside = $this->runner()->run(new CreatePerson(givenName: 'Paul', familyName: 'Berger', space: $space))->id;

        $user = $this->runner()->run(new CreateUser('jane@example.org', 'Jane', 'kaffeebohne42'))->user;
        $this->runner()->run(new AssignRole($user->id, 'editor', 'space:' . SpaceScopes::id(PersonStore::TYPE, $space)));
        $editor = new Context(Actor::user($user->id, $user->name), Channel::Api);

        self::assertSame([$inside], array_map(static fn(PersonSummary $item): string => $item->id, $this->runner()->ask(new ListPeople(), $editor)));
        $created = $this->runner()->run(new CreatePerson(givenName: 'Mia', familyName: 'Klein', space: $space), $editor)->id;
        $this->runner()->run(new UpdatePerson($inside, givenName: 'Paula'), $editor);
        self::assertCount(2, $this->runner()->run(new PublishPeople([$inside, $created]), $editor));

        foreach ([new CreatePerson(givenName: 'Max', familyName: 'Draußen'), new UpdatePerson($outside, givenName: 'Lea'), new UpdatePerson($inside, space: Space::DEFAULT), new PublishPeople([$inside, $outside]), new DeletePerson($outside)] as $action) {
            try {
                $this->runner()->run($action, $editor);
                self::fail(\sprintf('%s was allowed.', $action::class));
            } catch (AccessDeniedException) {
                self::assertSame('denied', $this->lastEntry()->status->value);
            }
        }
    }
}
