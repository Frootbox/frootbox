<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\AiAnthropic;

use Anthropic\Beta\Messages\BetaAdvisorMessageIterationUsage;
use Anthropic\Beta\Messages\BetaAssistantMessageParam;
use Anthropic\Beta\Messages\BetaBase64ImageSource;
use Anthropic\Beta\Messages\BetaBase64ImageSource\MediaType;
use Anthropic\Beta\Messages\BetaCacheControlEphemeral;
use Anthropic\Beta\Messages\BetaFallbackMessageIterationUsage;
use Anthropic\Beta\Messages\BetaImageBlockParam;
use Anthropic\Beta\Messages\BetaMessage;
use Anthropic\Beta\Messages\BetaMessageIterationUsage;
use Anthropic\Beta\Messages\BetaOutputConfig;
use Anthropic\Beta\Messages\BetaRedactedThinkingBlock;
use Anthropic\Beta\Messages\BetaRedactedThinkingBlockParam;
use Anthropic\Beta\Messages\BetaTextBlock;
use Anthropic\Beta\Messages\BetaTextBlockParam;
use Anthropic\Beta\Messages\BetaThinkingBlock;
use Anthropic\Beta\Messages\BetaThinkingBlockParam;
use Anthropic\Beta\Messages\BetaThinkingConfigAdaptive;
use Anthropic\Beta\Messages\BetaTool;
use Anthropic\Beta\Messages\BetaTool\InputSchema;
use Anthropic\Beta\Messages\BetaToolResultBlockParam;
use Anthropic\Beta\Messages\BetaToolUseBlock;
use Anthropic\Beta\Messages\BetaToolUseBlockParam;
use Anthropic\Beta\Messages\BetaUserMessageParam;
use Anthropic\Client;
use Anthropic\Core\Exceptions\APIException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\AuthenticationException;
use Anthropic\Core\Exceptions\PermissionDeniedException;
use Anthropic\Core\Exceptions\RateLimitException;
use Anthropic\RequestOptions;
use Frootbox\Core\Ai\AiException;
use Frootbox\Core\Ai\Image;
use Frootbox\Core\Ai\Message;
use Frootbox\Core\Ai\Model;
use Frootbox\Core\Ai\Opaque;
use Frootbox\Core\Ai\Part;
use Frootbox\Core\Ai\Prices;
use Frootbox\Core\Ai\ProviderClient;
use Frootbox\Core\Ai\Request;
use Frootbox\Core\Ai\Response;
use Frootbox\Core\Ai\StopReason;
use Frootbox\Core\Ai\Text;
use Frootbox\Core\Ai\Tool;
use Frootbox\Core\Ai\ToolCall;
use Frootbox\Core\Ai\ToolResult;
use Frootbox\Core\Ai\Usage;
use Frootbox\Core\Config\Config;
use Frootbox\Core\Settings\Settings;
use Frootbox\Core\Support\Message as Note;
use Nyholm\Psr7\Factory\Psr17Factory;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpClient\Psr18Client;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Claude through the official SDK of Anthropic (decision 0294): one
 * request per call, without streaming, with adaptive thinking, the
 * effort of the request and the automatic prompt cache. Opus and Sonnet
 * hand a request they refuse to the fallback Anthropic recommends.
 */
final readonly class AnthropicClient implements ProviderClient
{
    public const string STANDARD = 'claude-opus-5-5';

    public const string API = 'https://api.anthropic.com';

    /** Models with a fallback on the server for refused requests. */
    public const array FALLBACKS = ['claude-opus-5-5', 'claude-sonnet-5-5'];

    public const string FALLBACK_BETA = 'server-side-fallback-2026-07-01';

    private HttpClientInterface $http;

    public function __construct(
        private Settings $settings,
        private Config $config,
        ?HttpClientInterface $http = null,
        /** Anthropic asks again after too many requests or when busy */
        private int $retries = 2,
    ) {
        $this->http = $http ?? HttpClient::create(['timeout' => 120, 'max_redirects' => 0]);
    }

    public function ready(): bool
    {
        return '' !== $this->key();
    }

    /**
     * The models with their prices in US dollars per million tokens. A
     * cache write costs 1.25 times the input, a read a tenth or less.
     * Haiku costs five times as much above 100,000 tokens of input,
     * which a website does not reach.
     */
    public function models(): array
    {
        return [
            new Model('claude-opus-5-5', 'Claude Opus 5.5', new Prices(4.0, 20.0, 0.2, 5.0)),
            new Model('claude-sonnet-5-5', 'Claude Sonnet 5.5', new Prices(2.0, 10.0, 0.2, 2.5)),
            new Model('claude-haiku-5-5', 'Claude Haiku 5.5', new Prices(0.1, 0.5, 0.01, 0.125)),
        ];
    }

    /**
     * The model of the settings; one this module does not know yet counts
     * with the prices of the standard model.
     */
    public function model(): Model
    {
        $id = trim($this->settings->get(AnthropicSettings::class)->model);
        $standard = null;

        foreach ($this->models() as $model) {
            if ($model->id === $id) {
                return $model;
            }

            if (self::STANDARD === $model->id) {
                $standard = $model;
            }
        }

        \assert(null !== $standard);

        return '' === $id ? $standard : new Model($id, $id, $standard->prices);
    }

    public function send(Request $request): Response
    {
        if (!$this->ready()) {
            throw new AiException('The API key of Anthropic is missing.');
        }

        $model = $this->model()->id;
        $fallback = \in_array($model, self::FALLBACKS, true);

        try {
            $message = $this->client()->beta->messages->create(
                maxTokens: $request->maxTokens,
                messages: array_map(self::message(...), $request->messages),
                model: $model,
                cacheControl: $request->cache ? BetaCacheControlEphemeral::with() : null,
                fallbacks: $fallback ? 'default' : null,
                outputConfig: BetaOutputConfig::with(effort: $request->effort->value),
                system: $request->system,
                thinking: BetaThinkingConfigAdaptive::with(),
                tools: [] === $request->tools ? null : array_map(self::tool(...), $request->tools),
                betas: $fallback ? [self::FALLBACK_BETA] : null,
            );
        } catch (APIException $error) {
            throw self::failure($error);
        }

        return $this->response($message);
    }

    /**
     * A wrong key, missing rights, too many requests or the service out
     * of reach, as a message for people. The text of Anthropic is
     * English and stays so.
     */
    public static function failure(APIException $error): AiException
    {
        return new AiException(match (true) {
            $error instanceof AuthenticationException => new Note('Anthropic does not accept the API key. Please check it in the settings.'),
            $error instanceof PermissionDeniedException => new Note('The API key of Anthropic may not use this model.'),
            $error instanceof RateLimitException => new Note('Anthropic gets too many requests from this account right now. Please try again in a minute.'),
            $error instanceof APIStatusException && ($error->status ?? 0) >= 500 => new Note('Anthropic cannot answer right now. Please try again later.'),
            $error instanceof APIStatusException => new Note('Anthropic refuses the request: {reason}', ['reason' => self::reason($error)]),
            default => new Note('Anthropic cannot be reached. Please check the connection of the server.'),
        }, $error);
    }

    private function key(): string
    {
        return trim($this->config->env('ANTHROPIC_API_KEY') ?? $this->settings->get(AnthropicSettings::class)->apiKey);
    }

    private function client(): Client
    {
        $factory = new Psr17Factory();

        return new Client(
            apiKey: $this->key(),
            baseUrl: self::API,
            requestOptions: RequestOptions::with(
                timeout: 120.0,
                maxRetries: $this->retries,
                transporter: new Psr18Client($this->http, $factory, $factory),
                uriFactory: $factory,
                streamFactory: $factory,
                requestFactory: $factory,
            ),
            openTelemetry: false,
        );
    }

    private function response(BetaMessage $message): Response
    {
        $parts = [];

        foreach ($message->content as $block) {
            $part = match (true) {
                $block instanceof BetaTextBlock => new Text($block->text),
                $block instanceof BetaToolUseBlock => new ToolCall($block->id, $block->name, $block->input),
                $block instanceof BetaThinkingBlock, $block instanceof BetaRedactedThinkingBlock => new Opaque(AnthropicExtension::NAME, self::data($block)),
                default => null,
            };

            if (null !== $part) {
                $parts[] = $part;
            }
        }

        return new Response(
            $parts,
            match ($message->stopReason) {
                'tool_use' => StopReason::Tools,
                'max_tokens', 'model_context_window_exceeded' => StopReason::Limit,
                'refusal' => StopReason::Refused,
                default => StopReason::Done,
            },
            self::usage($message),
            $message->model,
        );
    }

    /**
     * One usage per model: after a fallback the iterations tell which
     * model read and wrote how much.
     *
     * @return list<Usage>
     */
    private static function usage(BetaMessage $message): array
    {
        $usage = $message->usage;
        $byModel = [];

        foreach ($usage->iterations ?? [] as $iteration) {
            $model = match (true) {
                $iteration instanceof BetaFallbackMessageIterationUsage, $iteration instanceof BetaAdvisorMessageIterationUsage => $iteration->model,
                $iteration instanceof BetaMessageIterationUsage => $iteration->model ?? $message->model,
                default => $message->model,
            };
            $known = $byModel[$model] ?? new Usage($model);
            $byModel[$model] = new Usage(
                $model,
                $known->input + $iteration->inputTokens,
                $known->output + $iteration->outputTokens,
                $known->cacheRead + $iteration->cacheReadInputTokens,
                $known->cacheWrite + $iteration->cacheCreationInputTokens,
            );
        }

        if ([] !== $byModel) {
            return array_values($byModel);
        }

        return [new Usage($message->model, $usage->inputTokens, $usage->outputTokens, $usage->cacheReadInputTokens ?? 0, $usage->cacheCreationInputTokens ?? 0)];
    }

    private static function message(Message $message): BetaUserMessageParam|BetaAssistantMessageParam
    {
        $content = [];

        foreach ($message->parts as $part) {
            $block = self::block($part);

            if (null !== $block) {
                $content[] = $block;
            }
        }

        return Message::ASSISTANT === $message->role ? BetaAssistantMessageParam::with($content) : BetaUserMessageParam::with($content);
    }

    private static function block(Part $part): BetaTextBlockParam|BetaImageBlockParam|BetaToolUseBlockParam|BetaToolResultBlockParam|BetaThinkingBlockParam|BetaRedactedThinkingBlockParam|null
    {
        return match (true) {
            $part instanceof Text => BetaTextBlockParam::with($part->text),
            $part instanceof Image => BetaImageBlockParam::with(BetaBase64ImageSource::with(base64_encode($part->bytes), MediaType::tryFrom($part->mimeType) ?? throw new AiException(new Note('Anthropic does not read images of the type {type}.', ['type' => $part->mimeType])))),
            $part instanceof ToolCall => BetaToolUseBlockParam::with($part->id, $part->input, $part->name),
            $part instanceof ToolResult => BetaToolResultBlockParam::with($part->callId, content: $part->content, isError: $part->error),
            $part instanceof Opaque && AnthropicExtension::NAME === $part->provider => self::thinking($part->data),
            default => null,
        };
    }

    private static function tool(Tool $tool): BetaTool
    {
        return BetaTool::with(InputSchema::fromArray($tool->schema), $tool->name, description: $tool->description);
    }

    /**
     * A thinking block as Anthropic gave it, to send it back.
     *
     * @param array<string, mixed> $data
     */
    private static function thinking(array $data): BetaThinkingBlockParam|BetaRedactedThinkingBlockParam|null
    {
        $text = static fn(string $key): ?string => \is_string($data[$key] ?? null) ? $data[$key] : null;

        return match ($data['type'] ?? null) {
            'thinking' => null === $text('signature') || null === $text('thinking') ? null : BetaThinkingBlockParam::with($text('signature'), $text('thinking')),
            'redacted_thinking' => null === $text('data') ? null : BetaRedactedThinkingBlockParam::with($text('data')),
            default => null,
        };
    }

    /**
     * A thinking block of an answer as data of an Opaque part.
     *
     * @return array<string, mixed>
     */
    private static function data(BetaThinkingBlock|BetaRedactedThinkingBlock $block): array
    {
        return $block instanceof BetaThinkingBlock
            ? ['type' => 'thinking', 'thinking' => $block->thinking, 'signature' => $block->signature]
            : ['type' => 'redacted_thinking', 'data' => $block->data];
    }

    private static function reason(APIStatusException $error): string
    {
        $message = $error->getAPIMessage();

        return null !== $message && '' !== $message ? $message : $error->getMessage();
    }
}
