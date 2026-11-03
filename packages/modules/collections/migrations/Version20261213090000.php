<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Frootbox\Database\Migration;

/**
 * Entries of collections have no tables, they live in revisions (decision 0246). The role
 * "editor" gets frootbox/collections/*.
 */
final class Version20261213090000 extends Migration
{
    private const string RULE = 'frootbox/collections/*';

    public function getDescription(): string
    {
        return 'Lets editors change the entries of collections';
    }

    public function up(Schema $schema): void
    {
        $this->change(static fn(array $rules): array => \in_array(self::RULE, $rules, true) || \in_array('*', $rules, true) ? $rules : [...$rules, self::RULE]);
    }

    public function down(Schema $schema): void
    {
        $this->change(static fn(array $rules): array => array_values(array_filter($rules, static fn(mixed $rule): bool => self::RULE !== $rule)));
    }

    private function change(callable $change): void
    {
        $rules = $this->connection->fetchOne('SELECT permissions FROM roles WHERE name = ?', ['editor']);

        if (!\is_string($rules)) {
            return;
        }

        $rules = json_decode($rules, true, flags: \JSON_THROW_ON_ERROR);

        if (\is_array($rules) && array_is_list($rules)) {
            $this->addSql('UPDATE roles SET permissions = ? WHERE name = ?', [json_encode($change($rules), \JSON_THROW_ON_ERROR), 'editor']);
        }
    }
}
