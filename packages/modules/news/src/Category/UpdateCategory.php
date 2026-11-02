<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Category;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Action\Schema\Range;
use Frootbox\Database\Ulid;

#[AsAction('frootbox/news/category.update', 'Changes a category of the news')]
final readonly class UpdateCategory implements Action
{
    /**
     * @param array<mixed> $translations
     */
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
        #[Description('Title and slug by language; languages left out stay, null removes one')]
        public array $translations = [],
        #[Range(min: 0)]
        public ?int $position = null,
    ) {}

    public function handle(CategoryEditor $editor): Category
    {
        return $editor->save('frootbox/news/category.update', $this->id, $this->translations, $this->position);
    }
}
