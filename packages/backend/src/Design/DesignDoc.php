<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\Backend\Design;

/**
 * Writes the token tables of DESIGN.md from tokens.yaml (decision 0114),
 * between the markers <!-- tokens:start --> and <!-- tokens:end -->.
 * `composer design-doc` updates the file, a test fails if it is behind.
 */
final readonly class DesignDoc
{
    public const string FILE = __DIR__ . '/../../DESIGN.md';

    private const string START = '<!-- tokens:start -->';

    private const string END = '<!-- tokens:end -->';

    public function __construct(private Tokens $tokens) {}

    /**
     * The document with the tables made from the tokens.
     */
    public function apply(string $document): string
    {
        $start = strpos($document, self::START);
        $end = strpos($document, self::END);

        if (false === $start || false === $end || $end < $start) {
            throw new DesignException(\sprintf('DESIGN.md needs the markers %s and %s.', self::START, self::END));
        }

        return substr($document, 0, $start + \strlen(self::START))
            . "\n<!-- Made by `composer design-doc` from tokens.yaml. Do not edit by hand. -->\n\n"
            . $this->tables()
            . substr($document, $end);
    }

    public function tables(): string
    {
        $out = '';

        foreach ([Token::BRAND => 'Brand', Token::SYSTEM => 'System'] as $group => $title) {
            foreach ($this->tokens->byCategory($group) as $category => $tokens) {
                $out .= \sprintf("#### %s: %s\n\n", $title, $category);

                if ($tokens[0]->isThemed()) {
                    $out .= "| Token | Light | Dark | Use |\n| --- | --- | --- | --- |\n";

                    foreach ($tokens as $token) {
                        $out .= \sprintf("| `%s` | `%s` | `%s` | %s |\n", $token->variable(), self::cell($token->in('light')), self::cell($token->in('dark')), self::cell($token->use ?? ''));
                    }
                } else {
                    $out .= "| Token | Value | Use |\n| --- | --- | --- |\n";

                    foreach ($tokens as $token) {
                        $out .= \sprintf("| `%s` | `%s` | %s |\n", $token->variable(), self::cell($token->value), self::cell($token->use ?? ''));
                    }
                }

                $out .= "\n";
            }
        }

        $out .= "#### Contrast (WCAG AA, at least 4.5:1)\n\n| Text | Background | Light | Dark |\n| --- | --- | --- | --- |\n";

        $results = $this->tokens->contrasts();

        for ($i = 0; $i < \count($results); $i += 2) {
            [$light, $dark] = [$results[$i], $results[$i + 1]];
            $out .= \sprintf("| `%s` | `%s` | %.2f | %.2f |\n", $light->foreground, $light->background, $light->ratio, $dark->ratio);
        }

        return $out . "\n";
    }

    private static function cell(string $text): string
    {
        return str_replace('|', '\|', $text);
    }
}
