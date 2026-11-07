<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use DateTimeImmutable;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\Action\ActionLog;
use Frootbox\Core\Auth\AccessTokens;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * An update was uploaded, but its migrations have not run (decision 0327):
 * the superuser still signs in and starts them in the backend.
 */
#[CoversClass(AccessTokens::class)]
#[CoversClass(ActionLog::class)]
final class NotYetMigratedTest extends BackendTestCase
{
    public function testTheSuperuserSignsInAndMigratesInTheBackend(): void
    {
        $this->createUser('root@example.org', ['superuser']);
        $this->forgetTheNewestMigrations();

        self::assertSame(0, $this->get(ActionLog::class)->prune(new DateTimeImmutable(), new DateTimeImmutable('-1 year'))['shortened'], 'Shortening waits for the migration.');

        $session = $this->signIn('root@example.org');
        self::assertStringContainsString('2 migrations are pending', $this->html($this->request('GET', '/cms', session: $session)));
        self::assertStringContainsString('2 pending', $this->html($this->request('GET', '/cms/extensions', session: $session)));

        // SQLite in memory cannot be backed up, so without one here.
        $ran = $this->action('system.migrate', ['withoutBackup' => true], $session)['data'] ?? null;
        self::assertIsArray($ran);
        self::assertSame(['Frootbox\Core\Migrations\Version20261222090000', 'Frootbox\Core\Migrations\Version20261224090000'], $ran['versions'] ?? null);

        self::assertSame(200, $this->request('GET', '/cms', session: $session)->getStatusCode(), 'The session from before the migration still works.');
        self::assertNotSame([], $this->connection()->fetchFirstColumn('SELECT device FROM access_tokens UNION ALL SELECT login_max_role FROM hub_connections UNION ALL SELECT 1'), 'The columns are back.');
        $this->signIn('root@example.org');
    }

    /**
     * Back to the schema before the migrations that added columns to
     * access_tokens, as on a website that was updated but not migrated.
     */
    private function forgetTheNewestMigrations(): void
    {
        $connection = $this->connection();
        $schema = $connection->createSchemaManager();
        $schema->dropIndex('access_tokens_provider_session', 'access_tokens');
        $schema->dropTable('user_identities');

        foreach (['access_tokens' => ['device', 'provider', 'provider_session'], 'action_log' => ['token_id', 'device'], 'action_changes' => ['shortened'], 'hub_connections' => ['login_max_role']] as $table => $columns) {
            foreach ($columns as $column) {
                $connection->executeStatement(\sprintf('ALTER TABLE %s DROP COLUMN %s', $connection->quoteSingleIdentifier($table), $connection->quoteSingleIdentifier($column)));
            }
        }

        foreach (['Version20261222090000', 'Version20261224090000'] as $version) {
            $connection->delete('migrations', ['version' => 'Frootbox\Core\Migrations\\' . $version]);
        }
    }
}
