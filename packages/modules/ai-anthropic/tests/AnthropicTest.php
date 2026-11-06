<?php

/*
 * SPDX-License-Identifier: MIT
 */

declare(strict_types=1);

namespace Frootbox\AiAnthropic\Tests;

use Frootbox\AiAnthropic\AnthropicClient;
use Frootbox\AiAnthropic\AnthropicExtension;
use Frootbox\AiAnthropic\AnthropicSettings;
use Frootbox\Core\Action\InvalidInputException;
use Frootbox\Core\Ai\AiException;
use Frootbox\Core\Ai\Effort;
use Frootbox\Core\Ai\Image;
use Frootbox\Core\Ai\Message;
use Frootbox\Core\Ai\Opaque;
use Frootbox\Core\Ai\Request;
use Frootbox\Core\Ai\ShowAiStatus;
use Frootbox\Core\Ai\StopReason;
use Frootbox\Core\Ai\TestAi;
use Frootbox\Core\Ai\Tool;
use Frootbox\Core\Ai\ToolCall;
use Frootbox\Core\Ai\ToolResult;
use Frootbox\Core\Config\Config;
use Frootbox\Core\Config\Environment;
use Frootbox\Core\Extension\ExtensionPackage;
use Frootbox\Core\Extension\Extensions;
use Frootbox\Core\Settings\SetSecret;
use Frootbox\Core\Settings\Settings;
use Frootbox\Core\Settings\UpdateSettings;
use Frootbox\Core\Tests\Support\NotesTestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use Symfony\Component\HttpClient\Exception\TransportException;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

/**
 * Claude with an API that answers from here: nothing goes to Anthropic.
 */
#[CoversClass(AnthropicClient::class)]
#[CoversClass(AnthropicExtension::class)]
#[CoversClass(AnthropicSettings::class)]
final class AnthropicTest extends NotesTestCase
{
    /** @var list<array{url: string, headers: array<string, string>, body: array<string, mixed>, raw: string}> */
    private array $sent = [];

    /** @var list<MockResponse|\Throwable> The answers of the API, one per request */
    private array $answers = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->container->set(AnthropicClient::class, $this->client($this->get(Config::class)));
    }

    public function testWithoutAKeyTheAiIsNotSetUp(): void
    {
        self::assertSame('setup', $this->runner()->ask(new ShowAiStatus())->reason);

        $this->runner()->run(new SetSecret(AnthropicExtension::NAME, 'apiKey', 'sk-ant-stored'));

        self::assertNull($this->runner()->ask(new ShowAiStatus())->reason);
        self::assertSame(['Anthropic', 'Claude Opus 5.5'], [$this->runner()->ask(new ShowAiStatus())->provider, $this->runner()->ask(new ShowAiStatus())->model]);
    }

    public function testTheKeyOfTheEnvironmentComesFirst(): void
    {
        $this->runner()->run(new SetSecret(AnthropicExtension::NAME, 'apiKey', 'sk-ant-stored'));
        $this->answers[] = self::answer('Hallo.');
        $client = $this->client(new Config(Environment::Development, [], ['ANTHROPIC_API_KEY' => 'sk-ant-env']));

        $client->send(new Request('System', [Message::user('Hallo')]));

        self::assertSame('Bearer sk-ant-env', $this->sent[0]['headers']['authorization']);
    }

    public function testTheTestSendsAShortRequestToOpus(): void
    {
        $this->runner()->run(new SetSecret(AnthropicExtension::NAME, 'apiKey', 'sk-ant-stored'));
        $this->answers[] = self::answer('Hallo, Testsite!', usage: ['input_tokens' => 100, 'output_tokens' => 20]);

        $result = $this->runner()->run(new TestAi());

        self::assertSame(['Anthropic', 'claude-opus-5-5', 'Hallo, Testsite!', 100, 20, 0.0008], [$result->provider, $result->model, $result->text, $result->inputTokens, $result->outputTokens, $result->cost]);
        $sent = $this->sent[0];
        self::assertSame('https://api.anthropic.com/v1/messages', $sent['url']);
        self::assertSame('Bearer sk-ant-stored', $sent['headers']['authorization']);
        self::assertStringContainsString(AnthropicClient::FALLBACK_BETA, $sent['headers']['anthropic-beta']);
        self::assertSame(['claude-opus-5-5', 1024, ['type' => 'adaptive'], ['effort' => 'low'], 'default'], [$sent['body']['model'], $sent['body']['max_tokens'], $sent['body']['thinking'], $sent['body']['output_config'], $sent['body']['fallbacks']]);
        self::assertArrayNotHasKey('cache_control', $sent['body'], 'The test is not worth a cache entry.');
        self::assertArrayNotHasKey('tools', $sent['body']);
        self::assertSame(800, $this->number('SELECT cost FROM ai_usage'));
    }

    public function testHaikuHasNoFallback(): void
    {
        $this->runner()->run(new UpdateSettings(AnthropicExtension::NAME, ['model' => 'claude-haiku-5-5']));
        $this->answers[] = self::answer('Hallo.', model: 'claude-haiku-5-5');

        $this->client(new Config(Environment::Development, [], ['ANTHROPIC_API_KEY' => 'sk-ant-env']))->send(new Request('System', [Message::user('Hallo')]));

        self::assertSame('claude-haiku-5-5', $this->sent[0]['body']['model']);
        self::assertArrayNotHasKey('fallbacks', $this->sent[0]['body']);
        self::assertArrayNotHasKey('anthropic-beta', $this->sent[0]['headers']);
    }

    public function testAFallbackCountsEachModel(): void
    {
        $this->runner()->run(new SetSecret(AnthropicExtension::NAME, 'apiKey', 'sk-ant-stored'));
        $this->answers[] = self::answer('Hallo.', model: 'claude-opus-4-8', usage: [
            'input_tokens' => 300,
            'output_tokens' => 60,
            'iterations' => [
                ['type' => 'message', 'model' => 'claude-opus-5-5', 'input_tokens' => 100, 'output_tokens' => 10, 'cache_read_input_tokens' => 0, 'cache_creation_input_tokens' => 0],
                ['type' => 'fallback_message', 'model' => 'claude-opus-4-8', 'input_tokens' => 200, 'output_tokens' => 50, 'cache_read_input_tokens' => 0, 'cache_creation_input_tokens' => 0],
            ],
        ]);

        $result = $this->runner()->run(new TestAi());

        self::assertSame([300, 60], [$result->inputTokens, $result->outputTokens]);
        $rows = $this->connection()->fetchAllKeyValue('SELECT model, cost FROM ai_usage ORDER BY model');
        // Opus 5.5: 100 × 4 + 10 × 20; the unknown Opus 4.8 with the prices of the chosen model: 200 × 4 + 50 × 20.
        self::assertEquals(['claude-opus-4-8' => 1800, 'claude-opus-5-5' => 600], $rows);
    }

    public function testAConversationWithToolsGoesOverAsAnthropicExpectsIt(): void
    {
        $this->answers[] = new MockResponse((string) json_encode([
            'id' => 'msg_2',
            'type' => 'message',
            'role' => 'assistant',
            'model' => 'claude-opus-5-5',
            'content' => [
                ['type' => 'thinking', 'thinking' => 'Die Seite fehlt noch.', 'signature' => 'sig-1'],
                ['type' => 'tool_use', 'id' => 'toolu_2', 'name' => 'page_create', 'input' => ['title' => 'Kontakt']],
            ],
            'stop_reason' => 'tool_use',
            'stop_sequence' => null,
            'usage' => ['input_tokens' => 10, 'output_tokens' => 5, 'cache_read_input_tokens' => 7, 'cache_creation_input_tokens' => 3],
        ]), ['response_headers' => ['content-type' => 'application/json']]);
        $client = $this->client(new Config(Environment::Development, [], ['ANTHROPIC_API_KEY' => 'sk-ant-env']));

        $response = $client->send(new Request(
            'You edit websites.',
            [
                Message::user('Lege eine Seite an.', new Image('image/webp', 'RIFF')),
                Message::assistant(new Opaque(AnthropicExtension::NAME, ['type' => 'thinking', 'thinking' => 'Erst die Liste.', 'signature' => 'sig-0']), new Opaque('acme/other', ['secret' => true]), new ToolCall('toolu_1', 'page_list', [])),
                Message::user(new ToolResult('toolu_1', '[]'), new ToolResult('toolu_0', 'Not found.', error: true)),
            ],
            [new Tool('page_create', 'Creates a page', ['type' => 'object', 'properties' => ['title' => ['type' => 'string']], 'required' => ['title'], 'additionalProperties' => false])],
            effort: Effort::High,
        ));

        $body = $this->sent[0]['body'];
        self::assertSame(['type' => 'ephemeral'], $body['cache_control']);
        self::assertSame(['effort' => 'high'], $body['output_config']);
        self::assertEquals([['name' => 'page_create', 'description' => 'Creates a page', 'input_schema' => ['type' => 'object', 'properties' => ['title' => ['type' => 'string']], 'required' => ['title'], 'additionalProperties' => false]]], $body['tools']);
        self::assertEquals(['type' => 'image', 'source' => ['type' => 'base64', 'media_type' => 'image/webp', 'data' => base64_encode('RIFF')]], self::at($body, 'messages', 0, 'content', 1));
        self::assertEquals([
            ['type' => 'thinking', 'thinking' => 'Erst die Liste.', 'signature' => 'sig-0'],
            ['type' => 'tool_use', 'id' => 'toolu_1', 'name' => 'page_list', 'input' => []],
        ], self::at($body, 'messages', 1, 'content'), 'The part of another provider stays out.');
        self::assertEquals(['type' => 'tool_result', 'tool_use_id' => 'toolu_0', 'content' => 'Not found.', 'is_error' => true], self::at($body, 'messages', 2, 'content', 1));
        self::assertStringContainsString('"input":{}', $this->sent[0]['raw'], 'An empty input is an object.');

        self::assertSame(StopReason::Tools, $response->stop);
        self::assertEquals([new ToolCall('toolu_2', 'page_create', ['title' => 'Kontakt'])], $response->toolCalls());
        self::assertInstanceOf(Opaque::class, $response->parts[0]);
        self::assertEquals(['type' => 'thinking', 'thinking' => 'Die Seite fehlt noch.', 'signature' => 'sig-1'], $response->parts[0]->data);
        self::assertSame([10, 5, 7, 3], [$response->usage[0]->input, $response->usage[0]->output, $response->usage[0]->cacheRead, $response->usage[0]->cacheWrite]);
    }

    public function testErrorsOfTheApiReadForPeople(): void
    {
        $client = $this->client(new Config(Environment::Development, [], ['ANTHROPIC_API_KEY' => 'sk-ant-wrong']));
        $errors = [
            'does not accept the API key' => self::error(401, 'authentication_error', 'invalid x-api-key'),
            'too many requests' => self::error(429, 'rate_limit_error', 'Slow down.'),
            'cannot answer right now' => self::error(529, 'overloaded_error', 'Overloaded'),
            'refuses the request: max_tokens: too large' => self::error(400, 'invalid_request_error', 'max_tokens: too large'),
            'cannot be reached' => new TransportException('Could not resolve host.'),
        ];

        foreach ($errors as $expected => $answer) {
            $this->answers[] = $answer;

            try {
                $client->send(new Request('System', [Message::user('Hallo')]));
                self::fail('The API failed: ' . $expected);
            } catch (AiException $error) {
                self::assertStringContainsString($expected, $error->getMessage());
            }
        }
    }

    public function testTheTestShowsTheErrorAtTheForm(): void
    {
        $this->runner()->run(new SetSecret(AnthropicExtension::NAME, 'apiKey', 'sk-ant-wrong'));
        $this->answers[] = self::error(401, 'authentication_error', 'invalid x-api-key');

        try {
            $this->runner()->run(new TestAi());
            self::fail('The key is wrong.');
        } catch (InvalidInputException $error) {
            self::assertSame('Anthropic does not accept the API key. Please check it in the settings.', $error->messages['']->text);
        }

        self::assertSame(0, $this->number('SELECT COUNT(*) FROM ai_usage'));
    }

    public function testAModelItDoesNotKnowCountsWithTheStandardPrices(): void
    {
        $this->runner()->run(new UpdateSettings(AnthropicExtension::NAME, ['model' => 'claude-opus-6']));

        $model = $this->get(AnthropicClient::class)->model();

        self::assertSame(['claude-opus-6', 4.0, 20.0], [$model->id, $model->prices->input, $model->prices->output]);
    }

    protected function extensions(): Extensions
    {
        $root = (string) realpath(__DIR__ . '/..');

        return new Extensions([ExtensionPackage::fromManifest(AnthropicExtension::NAME, $root, psr4: ['Frootbox\AiAnthropic\\' => ['src/']])], 'ai-anthropic');
    }

    protected function config(): array
    {
        return ['app' => ['name' => 'Testsite', 'url' => 'https://example.org']];
    }

    private function client(Config $config): AnthropicClient
    {
        $http = new MockHttpClient(function (string $method, string $url, array $options): MockResponse {
            $headers = [];

            $normalized = \is_array($options['normalized_headers'] ?? null) ? $options['normalized_headers'] : [];

            foreach ($normalized as $name => $lines) {
                $line = \is_array($lines) && \is_string($lines[0] ?? null) ? $lines[0] : '';
                $headers[(string) $name] = explode(': ', $line, 2)[1] ?? '';
            }

            $raw = \is_string($options['body'] ?? null) ? $options['body'] : '';
            $body = json_decode($raw, true);
            $this->sent[] = ['url' => $url, 'headers' => $headers, 'body' => \is_array($body) ? self::keyed($body) : [], 'raw' => $raw];
            $answer = array_shift($this->answers) ?? self::fail('No answer left for ' . $url);

            if ($answer instanceof \Throwable) {
                throw $answer;
            }

            return $answer;
        });

        return new AnthropicClient($this->get(Settings::class), $config, $http, retries: 0);
    }

    private function number(string $sql): int
    {
        $value = $this->connection()->fetchOne($sql);

        return is_numeric($value) ? (int) $value : -1;
    }

    /**
     * A value deep in the body that was sent, null if it is missing.
     */
    private static function at(mixed $value, int|string ...$path): mixed
    {
        foreach ($path as $key) {
            $value = \is_array($value) ? ($value[$key] ?? null) : null;
        }

        return $value;
    }

    /**
     * @param array<mixed> $values
     *
     * @return array<string, mixed>
     */
    private static function keyed(array $values): array
    {
        $keyed = [];

        foreach ($values as $key => $value) {
            $keyed[(string) $key] = $value;
        }

        return $keyed;
    }

    /**
     * @param array<string, mixed> $usage
     */
    private static function answer(string $text, string $model = 'claude-opus-5-5', array $usage = ['input_tokens' => 10, 'output_tokens' => 5]): MockResponse
    {
        return new MockResponse((string) json_encode([
            'id' => 'msg_1',
            'type' => 'message',
            'role' => 'assistant',
            'model' => $model,
            'content' => [['type' => 'thinking', 'thinking' => 'Kurz grüßen.', 'signature' => 'sig'], ['type' => 'text', 'text' => $text]],
            'stop_reason' => 'end_turn',
            'stop_sequence' => null,
            'usage' => $usage,
        ]), ['response_headers' => ['content-type' => 'application/json']]);
    }

    private static function error(int $status, string $type, string $message): MockResponse
    {
        return new MockResponse((string) json_encode(['type' => 'error', 'error' => ['type' => $type, 'message' => $message]]), ['http_code' => $status, 'response_headers' => ['content-type' => 'application/json']]);
    }
}
