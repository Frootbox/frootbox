<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\GoogleFonts\Font;

use Frootbox\Database\Repository;

/**
 * @extends Repository<ImportedFont>
 */
final class ImportedFonts extends Repository
{
    public const string TABLE = 'frootbox_google_fonts_fonts';

    /**
     * @return list<ImportedFont>
     */
    public function sorted(): array
    {
        return $this->fetch(['order' => ['family']])->all();
    }

    public function byKey(string $key): ?ImportedFont
    {
        return $this->fetchOne(['where' => ['key' => $key]]);
    }

    protected function table(): string
    {
        return self::TABLE;
    }

    protected function entity(): string
    {
        return ImportedFont::class;
    }
}
