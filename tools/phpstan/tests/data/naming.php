<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Tools\PHPStan\Tests\Data;

final class good_class
{
    public const string maxLength = 'a';

    public const string MAX_LENGTH = 'b';

    public int $Count = 0;

    public int $total_count = 0;

    public int $userId = 0;

    public function __construct(public string $first_name = '') {}

    public function Find_by_slug(string $Slug): string
    {
        $page_title = $Slug;
        $pageTitle = $page_title . $this->first_name . $_SERVER['argv'][0];

        return $pageTitle;
    }

    public function findBySlug(): void {}
}

enum status: string
{
    case draft = 'draft';
    case Published = 'published';
    case IN_REVIEW = 'review';
}

interface PageRepository {}

function render_page(): void {}
