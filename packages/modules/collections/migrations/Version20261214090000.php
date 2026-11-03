<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Frootbox\Database\Migration;
use Frootbox\Database\Schema\Blueprint;

/**
 * The fields admins add to a collection (decision 0250). Editors keep
 * the entries but no longer get the fields: frootbox/collections/* becomes
 * the rules for entries and choices.
 */
final class Version20261214090000 extends Migration
{
    private const string ALL = 'frootbox/collections/*';

    private const array EDITOR = ['frootbox/collections/entry.*', 'frootbox/collections/space.choices', 'frootbox/collections/category.choices'];

    public function getDescription(): string
    {
        return 'Adds the fields of the collections';
    }

    public function up(Schema $schema): void
    {
        $this->createTable('frootbox_collections_fields', function (Blueprint $table): void {
            $table->ulid();
            $table->string('space', 64);
            $table->string('name', 40);
            $table->string('type', 20);
            $table->json('labels');
            $table->json('settings');
            $table->integer('position');
            $table->timestamps();
            $table->unique(['space', 'name']);
        });

        $this->change(static fn(array $rules): array => \in_array(self::ALL, $rules, true) ? [...array_values(array_filter($rules, static fn(mixed $rule): bool => self::ALL !== $rule)), ...self::EDITOR] : $rules);
    }

    public function down(Schema $schema): void
    {
        $this->change(static fn(array $rules): array => \in_array(self::EDITOR[0], $rules, true) ? [...array_values(array_filter($rules, static fn(mixed $rule): bool => !\in_array($rule, self::EDITOR, true))), self::ALL] : $rules);
        $this->dropTable('frootbox_collections_fields');
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
