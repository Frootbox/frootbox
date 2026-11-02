<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Frootbox\Database\Migration;
use Frootbox\Database\Schema\Blueprint;

/**
 * The published articles and the categories of the news (decision 0219).
 * Drafts and versions live in revisions. The role "editor" gets
 * frootbox/news/*.
 */
final class Version20261120090000 extends Migration
{
    private const string RULE = 'frootbox/news/*';

    public function getDescription(): string
    {
        return 'Adds the tables of the news';
    }

    public function up(Schema $schema): void
    {
        $this->createTable('frootbox_news_articles', function (Blueprint $table): void {
            $table->ulid();
            $table->dateTime('date')->index();
            $table->json('image')->nullable();
            $table->timestamps();
        });

        $this->createTable('frootbox_news_article_translations', function (Blueprint $table): void {
            $table->id();
            $table->ulid('article_id')->index();
            $table->string('language', 35);
            $table->string('title', 300);
            $table->string('slug', 100);
            $table->text('teaser');
            $table->json('text');
            $table->timestamps();
            $table->unique(['article_id', 'language']);
            $table->index(['language', 'slug']);
        });

        $this->createTable('frootbox_news_categories', function (Blueprint $table): void {
            $table->ulid();
            $table->integer('position');
            $table->json('translations');
            $table->timestamps();
        });

        $this->createTable('frootbox_news_article_categories', function (Blueprint $table): void {
            $table->id();
            $table->ulid('article_id')->index();
            $table->ulid('category_id')->index();
            $table->unique(['article_id', 'category_id']);
        });

        $this->change(static fn(array $rules): array => \in_array(self::RULE, $rules, true) || \in_array('*', $rules, true) ? $rules : [...$rules, self::RULE]);
    }

    public function down(Schema $schema): void
    {
        $this->change(static fn(array $rules): array => array_values(array_filter($rules, static fn(mixed $rule): bool => self::RULE !== $rule)));
        $this->dropTable('frootbox_news_article_categories');
        $this->dropTable('frootbox_news_categories');
        $this->dropTable('frootbox_news_article_translations');
        $this->dropTable('frootbox_news_articles');
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
