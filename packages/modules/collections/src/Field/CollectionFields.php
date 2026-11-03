<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Collections\Field;

use Frootbox\Database\Repository;

/**
 * @extends Repository<CollectionField>
 */
final class CollectionFields extends Repository
{
    public const string TABLE = 'frootbox_collections_fields';

    /**
     * The fields of a collection in their order.
     *
     * @return list<CollectionField>
     */
    public function ofSpace(string $space): array
    {
        return $this->fetch(['where' => ['space' => $space], 'order' => ['position', 'id']])->all();
    }

    public function named(string $space, string $name): ?CollectionField
    {
        return $this->fetchOne(['where' => ['space' => $space, 'name' => $name]]);
    }

    protected function table(): string
    {
        return self::TABLE;
    }

    protected function entity(): string
    {
        return CollectionField::class;
    }
}
