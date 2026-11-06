<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

/**
 * Words for entries of a history and the log (decision 0174), for the
 * screens and the edit mode alike. Actions without a name here show
 * their name, e.g. those of modules.
 */
final class HistoryNames
{
    /** What an action did, in words to translate. */
    public const array ACTIONS = [
        'page.create' => 'Page created',
        'page.update' => 'Properties changed',
        'page.update-field' => 'Text changed',
        'page.rename' => 'Renamed',
        'page.add-block' => 'Block added',
        'page.copy-block' => 'Block copied',
        'page.move-block' => 'Block moved',
        'page.update-block' => 'Block settings changed',
        'page.remove-block' => 'Block removed',
        'page.add-list-entry' => 'Entry added',
        'page.move-list-entry' => 'Entry moved',
        'page.remove-list-entry' => 'Entry removed',
        'page.publish' => 'Published',
        'page.unpublish' => 'Taken offline',
        'page.schedule' => 'Times changed',
        'page.discard' => 'Draft discarded',
        'page.restore' => 'Version restored',
        'page.move' => 'Moved in the sitemap',
        'page.lock' => 'Locked for visitors',
        'page.unlock' => 'Unlocked',
        'page.delete' => 'Page deleted',
        'action.undo' => 'Undone',
        'system.migrate' => 'Update of the database',
    ];

    /** The channels by their value. */
    public const array CHANNELS = [
        'web' => 'Website and backend',
        'api' => 'REST API',
        'app' => 'App',
        'mcp' => 'MCP',
        'ai' => 'AI',
        'console' => 'Console',
        'system' => 'Scheduler',
    ];

    /** The states of an entry by their value. */
    public const array STATUSES = [
        'running' => 'Running',
        'succeeded' => 'Done',
        'failed' => 'Failed',
        'denied' => 'Not allowed',
        'invalid' => 'Invalid input',
    ];

    /** Where a change happened, besides the draft. */
    public const array STATES = [
        'published' => 'on the website',
        'version' => 'in an older version',
    ];

    /**
     * All of them translated, e.g. for the edit mode.
     *
     * @param callable(string): string $t
     *
     * @return array{actions: array<string, string>, channels: array<string, string>, statuses: array<string, string>, states: array<string, string>}
     */
    public static function translated(callable $t): array
    {
        return [
            'actions' => array_map($t, self::ACTIONS),
            'channels' => array_map($t, self::CHANNELS),
            'statuses' => array_map($t, self::STATUSES),
            'states' => array_map($t, self::STATES),
        ];
    }
}
