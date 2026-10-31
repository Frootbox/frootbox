<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText\Marks;

use Frootbox\RichText\Attribute;
use Frootbox\RichText\Html;
use Frootbox\RichText\MarkType;

/**
 * <a href>. Only relative URLs and the allowed protocols pass, so
 * "javascript:" never reaches the page. Links opening in a new window get
 * rel="noopener noreferrer".
 */
final readonly class Link implements MarkType
{
    /**
     * @param list<string> $protocols
     */
    public function __construct(private array $protocols = Attribute::PROTOCOLS) {}

    public function name(): string
    {
        return 'link';
    }

    public function attributes(): array
    {
        return [
            'href' => Attribute::url(required: true, protocols: $this->protocols),
            'target' => Attribute::choice(['_blank']),
        ];
    }

    public function open(array $attributes): string
    {
        $newWindow = '_blank' === ($attributes['target'] ?? null);

        return Html::open('a', [
            'href' => $attributes['href'] ?? null,
            'target' => $newWindow ? '_blank' : null,
            'rel' => $newWindow ? 'noopener noreferrer' : null,
        ]);
    }

    public function close(array $attributes): string
    {
        return Html::close('a');
    }
}
