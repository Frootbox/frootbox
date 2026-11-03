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
 * Each published article belongs to a space of the news (decision 0232).
 */
final class Version20261207100000 extends Migration
{
    public function getDescription(): string
    {
        return 'Adds the space to the published articles';
    }

    public function up(Schema $schema): void
    {
        $this->alterTable('frootbox_news_articles', function (Blueprint $table): void {
            $table->string('space', 64)->default('default');
        });
    }

    public function down(Schema $schema): void
    {
        $this->alterTable('frootbox_news_articles', function (Blueprint $table): void {
            $table->dropColumn('space');
        });
    }
}
