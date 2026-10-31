<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\RichText;

/**
 * Something in a document that does not fit the schema. It is left out
 * when rendering.
 */
final readonly class Violation implements \Stringable
{
    /**
     * @param string $pointer JSON pointer to the place in the document, e.g. "/content/0/marks/1/attrs/href"
     */
    public function __construct(
        public string $pointer,
        public string $message,
    ) {}

    public function __toString(): string
    {
        return ('' === $this->pointer ? '/' : $this->pointer) . ': ' . $this->message;
    }
}
