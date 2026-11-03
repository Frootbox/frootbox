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
 * The categories of the news move to the core (decision 0233): each one
 * keeps its id in the group "frootbox/news/categories", the categories
 * of the published articles become links of the core.
 */
final class Version20261208100000 extends Migration
{
    private const string GROUP = 'frootbox/news/categories';

    private const string TYPE = 'frootbox/news/article';

    public function getDescription(): string
    {
        return 'Moves the categories of the news to the categories of the core';
    }

    public function up(Schema $schema): void
    {
        foreach ($this->connection->fetchAllAssociative('SELECT id, position, translations, created_at, updated_at FROM frootbox_news_categories') as $row) {
            $this->addSql(
                'INSERT INTO categories (id, group_key, parent_id, position, translations, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, ?, ?)',
                [$row['id'], self::GROUP, $row['position'], $row['translations'], $row['created_at'], $row['updated_at']],
            );
        }

        foreach ($this->connection->fetchAllAssociative('SELECT article_id, category_id FROM frootbox_news_article_categories') as $row) {
            $this->addSql('INSERT INTO category_links (category_id, target_type, target_id) VALUES (?, ?, ?)', [$row['category_id'], self::TYPE, $row['article_id']]);
        }

        $this->dropTable('frootbox_news_article_categories');
        $this->dropTable('frootbox_news_categories');
    }

    public function down(Schema $schema): void
    {
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

        $this->addSql('DELETE FROM category_links WHERE target_type = ?', [self::TYPE]);
        $this->addSql('DELETE FROM categories WHERE group_key = ?', [self::GROUP]);
    }
}
