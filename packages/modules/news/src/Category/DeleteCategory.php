<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\News\Category;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Database\Ulid;

#[AsAction('frootbox/news/category.delete', 'Deletes a category; its articles stay')]
final readonly class DeleteCategory implements Action
{
    public function __construct(
        #[Pattern(Ulid::PATTERN)]
        public string $id,
    ) {}

    public function handle(CategoryEditor $editor): null
    {
        $editor->delete($this->id);

        return null;
    }
}
