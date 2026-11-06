<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\AiAnthropic;

use Frootbox\Core\Ai\Provider;
use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;

/**
 * Claude by Anthropic as the AI provider (decision 0294).
 */
final class AnthropicExtension implements Extension
{
    public const string NAME = 'frootbox/ai-anthropic';

    public function register(Registry $registry): void
    {
        $registry->settings(AnthropicSettings::class);
        $registry->add(Provider::class, new Provider(self::NAME, 'Anthropic', AnthropicClient::class));
    }
}
