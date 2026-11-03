<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections;

use Frootbox\Backend\Screen;
use Frootbox\Backend\SearchCommand;
use Frootbox\Backend\SearchLink;
use Frootbox\Collections\Backend\EntriesHandler;
use Frootbox\Collections\Backend\EntryHandler;
use Frootbox\Collections\Backend\FieldsHandler;
use Frootbox\Collections\Entry\CreateEntry;
use Frootbox\Collections\Entry\DeleteEntry;
use Frootbox\Collections\Entry\DiscardEntry;
use Frootbox\Collections\Entry\EntryStore;
use Frootbox\Collections\Entry\ListEntries;
use Frootbox\Collections\Entry\PublishEntries;
use Frootbox\Collections\Entry\ScheduleEntry;
use Frootbox\Collections\Entry\ShowEntry;
use Frootbox\Collections\Entry\UnpublishEntry;
use Frootbox\Collections\Entry\UpdateEntry;
use Frootbox\Collections\Field\CreateField;
use Frootbox\Collections\Field\DeleteField;
use Frootbox\Collections\Field\FieldSource;
use Frootbox\Collections\Field\ListFields;
use Frootbox\Collections\Field\MoveField;
use Frootbox\Collections\Field\UpdateField;
use Frootbox\Core\Category\CategoryGroup;
use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;
use Frootbox\Core\ObjectField\SpaceFields;

/**
 * Collections as a plugin (decisions 0178, 0232, 0246): each collection is a
 * space, its entries have drafts and their addresses below the page that
 * shows the collection, with the scheduler and the search. Admins add
 * fields to a collection (decision 0250).
 * The screens come only with the backend.
 */
final class CollectionsExtension implements Extension
{
    public function register(Registry $registry): void
    {
        $registry->action(CreateEntry::class);
        $registry->action(UpdateEntry::class);
        $registry->action(PublishEntries::class);
        $registry->action(UnpublishEntry::class);
        $registry->action(ScheduleEntry::class);
        $registry->action(DiscardEntry::class);
        $registry->action(DeleteEntry::class);
        $registry->query(ListEntries::class);
        $registry->query(SpaceChoices::class);
        $registry->query(CategoryChoices::class);
        $registry->query(ShowEntry::class);
        // The fields admins add to a collection (decision 0250).
        $registry->action(CreateField::class);
        $registry->action(UpdateField::class);
        $registry->action(MoveField::class);
        $registry->action(DeleteField::class);
        $registry->query(ListFields::class);
        $registry->add(SpaceFields::class, new SpaceFields(EntryStore::TYPE, FieldSource::class));

        $registry->plugin(EntryPlugin::class);
        $registry->add(CategoryGroup::class, new CategoryGroup(EntryStore::CATEGORIES, 'Categories of the collections', [EntryStore::TYPE]));
        $registry->scheduled(EntrySchedule::class);
        $registry->searchSource(EntrySource::class);

        if (class_exists(Screen::class)) {
            $this->backend($registry);
        }
    }

    /**
     * The screens in the backend (decision 0220), only if it is installed.
     */
    private function backend(Registry $registry): void
    {
        $registry->mount('backend.path', '/cms')
            ->get('/collections', EntriesHandler::class, 'frootbox.collections.entries')
            ->get('/collections/new', EntryHandler::class, 'frootbox.collections.entries.new')
            ->get('/collections/fields', FieldsHandler::class, 'frootbox.collections.fields')
            ->get('/collections/{id:[0-9A-Za-z]{26}}', EntryHandler::class, 'frootbox.collections.entries.show');

        $registry->add(Screen::class, new Screen('Collections', 'frootbox.collections.entries', Screen::CONTENT, 'layout-grid', EntriesHandler::PERMISSION, order: 21));
        $registry->add(SearchLink::class, new SearchLink(EntryStore::TYPE, 'frootbox.collections.entries.show', 'id', 'layout-grid'));
        $registry->add(SearchCommand::class, new SearchCommand('New entry', 'frootbox.collections.entries.new', 'frootbox/collections/entry.create'));
    }
}
