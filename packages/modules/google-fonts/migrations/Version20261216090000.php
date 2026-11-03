<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Frootbox\Database\Migration;
use Frootbox\Database\Schema\Blueprint;

/**
 * The fonts imported from Google Fonts (decision 0252).
 */
final class Version20261216090000 extends Migration
{
    public function getDescription(): string
    {
        return 'Adds the fonts imported from Google Fonts';
    }

    public function up(Schema $schema): void
    {
        $this->createTable('frootbox_google_fonts_fonts', function (Blueprint $table): void {
            $table->ulid();
            $table->string('key', 80);
            $table->string('family', 100);
            $table->string('category', 20);
            $table->json('files');
            $table->boolean('italic')->default(false);
            $table->timestamps();
            $table->unique('key');
        });
    }

    public function down(Schema $schema): void
    {
        $this->dropTable('frootbox_google_fonts_fonts');
    }
}
