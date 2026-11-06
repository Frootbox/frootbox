<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\AiAnthropic;

use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\Pattern;
use Frootbox\Core\Action\Schema\Sensitive;
use Frootbox\Core\Action\Schema\Title;
use Frootbox\Core\Settings\AsSettings;

/**
 * The key and the model of Anthropic (decision 0294). ANTHROPIC_API_KEY
 * in .env comes before the key stored here.
 */
#[AsSettings('Anthropic', 'The API key and the model of Claude for the AI of the website')]
final readonly class AnthropicSettings
{
    public function __construct(
        #[Title('API key'), Description('The key from the console of Anthropic (platform.claude.com). ANTHROPIC_API_KEY in .env comes first.'), Sensitive]
        public string $apiKey = '',
        #[Title('Model'), Description('claude-opus-5-5 (the best, standard), claude-sonnet-5-5 (half the price) or claude-haiku-5-5 (fast and very cheap).')]
        #[Length(max: 100)]
        #[Pattern('^claude-[a-z0-9-]+$')]
        public string $model = AnthropicClient::STANDARD,
    ) {}
}
