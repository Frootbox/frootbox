<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\View;

use Frootbox\Core\Site\ProtectionStatus;

/**
 * What every backend view gets as "fb": language, brand, website, user,
 * menu, CSRF token and the tags of the head.
 */
final readonly class Frame
{
    /**
     * @param list<MenuGroup> $menu
     */
    public function __construct(
        public string $language,
        public string $brand,
        public ?string $logo,
        public ?string $logoDark,
        public string $site,
        public ?FrameUser $user,
        public array $menu,
        public ?string $csrf,
        public string $head,
        /** Null for guests */
        public ?ProtectionStatus $protection = null,
    ) {}
}
