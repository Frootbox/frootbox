<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\People;

use Frootbox\Backend\Screen;
use Frootbox\Backend\SearchCommand;
use Frootbox\Backend\SearchLink;
use Frootbox\Core\Category\CategoryGroup;
use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;
use Frootbox\People\Backend\LocationHandler;
use Frootbox\People\Backend\LocationsHandler;
use Frootbox\People\Backend\PeopleHandler;
use Frootbox\People\Backend\PersonHandler;
use Frootbox\People\Location\CreateLocation;
use Frootbox\People\Location\DeleteLocation;
use Frootbox\People\Location\DiscardLocation;
use Frootbox\People\Location\ListLocations;
use Frootbox\People\Location\LocationChoices;
use Frootbox\People\Location\LocationStore;
use Frootbox\People\Location\PublishLocation;
use Frootbox\People\Location\ShowLocation;
use Frootbox\People\Location\UpdateLocation;
use Frootbox\People\Person\CreatePerson;
use Frootbox\People\Person\DeletePerson;
use Frootbox\People\Person\DiscardPerson;
use Frootbox\People\Person\ListPeople;
use Frootbox\People\Person\PersonChoices;
use Frootbox\People\Person\PersonStore;
use Frootbox\People\Person\PublishPeople;
use Frootbox\People\Person\ShowPerson;
use Frootbox\People\Person\UnpublishPerson;
use Frootbox\People\Person\UpdatePerson;

/**
 * People and locations (decision 0226): drafts in revisions, the blocks
 * Team, Contact person and Location, the search and the screens of the
 * backend, these only with the backend. The people are a plugin with
 * spaces, profiles as a choice, categories and tags (decision 0242).
 */
final class PeopleExtension implements Extension
{
    public function register(Registry $registry): void
    {
        $registry->action(CreatePerson::class);
        $registry->action(UpdatePerson::class);
        $registry->action(PublishPeople::class);
        $registry->action(UnpublishPerson::class);
        $registry->action(DiscardPerson::class);
        $registry->action(DeletePerson::class);
        $registry->query(ListPeople::class);
        $registry->query(ShowPerson::class);
        $registry->query(PersonChoices::class);
        $registry->action(CreateLocation::class);
        $registry->action(UpdateLocation::class);
        $registry->action(PublishLocation::class);
        $registry->action(DiscardLocation::class);
        $registry->action(DeleteLocation::class);
        $registry->query(ListLocations::class);
        $registry->query(ShowLocation::class);
        $registry->query(LocationChoices::class);

        $registry->query(SpaceChoices::class);
        $registry->query(CategoryChoices::class);

        $registry->plugin(PersonPlugin::class);
        $registry->add(CategoryGroup::class, new CategoryGroup(PersonStore::CATEGORIES, 'Categories of the people', [PersonStore::TYPE]));
        $registry->searchSource(PersonSource::class);
        $registry->searchSource(LocationSource::class);

        if (class_exists(Screen::class)) {
            $this->backend($registry);
        }
    }

    /**
     * The screens in the backend, only if it is installed.
     */
    private function backend(Registry $registry): void
    {
        $id = '{id:[0-7][0-9A-HJKMNP-TV-Z]{25}}';
        $registry->mount('backend.path', '/cms')
            ->get('/people', PeopleHandler::class, 'frootbox.people.people')
            ->get('/people/new', PersonHandler::class, 'frootbox.people.people.new')
            ->get('/people/locations', LocationsHandler::class, 'frootbox.people.locations')
            ->get('/people/locations/new', LocationHandler::class, 'frootbox.people.locations.new')
            ->get('/people/locations/' . $id, LocationHandler::class, 'frootbox.people.locations.show')
            ->get('/people/' . $id, PersonHandler::class, 'frootbox.people.people.show');

        $registry->add(Screen::class, new Screen('People', 'frootbox.people.people', Screen::CONTENT, 'users', PeopleHandler::PERMISSION, order: 27));
        $registry->add(SearchLink::class, new SearchLink(PersonStore::TYPE, 'frootbox.people.people.show', 'id', 'users'));
        $registry->add(SearchLink::class, new SearchLink(LocationStore::TYPE, 'frootbox.people.locations.show', 'id', 'users'));
        $registry->add(SearchCommand::class, new SearchCommand('New person', 'frootbox.people.people.new', 'frootbox/people/person.create'));
        $registry->add(SearchCommand::class, new SearchCommand('New location', 'frootbox.people.locations.new', 'frootbox/people/location.create'));
    }
}
