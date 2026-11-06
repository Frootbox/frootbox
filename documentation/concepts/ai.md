# The AI

Frootbox works fully without AI. With a provider installed, features of
the AI become shortcuts over the same actions: they write a draft,
suggest a text or describe an image, and a person decides what is
published. The core holds the interface; each provider is a module, the
first one `frootbox/ai-anthropic` with Claude.

## Setting it up

1. Install a provider in the folder of the website:

```bash
composer require frootbox/ai-anthropic
```

2. Store its API key under **Settings**, **Anthropic**, or set
   `ANTHROPIC_API_KEY` in `.env`, which comes first.
3. Set a monthly limit in US dollars under **Settings**, **AI**.
4. Open **AI** in the backend and choose **Test the connection**.

Without a provider the screen **AI** and every feature of the AI stay
hidden. The query `ai.status` says why the AI cannot answer: no provider
(`provider`), no key (`setup`), the limit (`limit`) or no right
(`permission`).

## Rights

| Right | For |
|---|---|
| `ai.use` | features of the AI; admins have it, other roles get it under **Roles** |
| `ai.usage` | the screen **AI** with the costs (the query `ai.usage`) |
| `settings.update` | the test of the connection (`ai.test`) |

The AI acts with the rights of the person who asks. A feature that
changes something runs an action like everyone else, so it lands in the
draft and in the action log, and `action.undo` takes it back.

## Costs and the limit

Every request counts in the table `ai_usage` with its tokens, the model
and the costs at the list prices of the provider, in millionths of a US
dollar. The query `ai.usage` sums them up for a month by day, feature,
person and model. When the costs of the month reach the limit, the AI
answers `409` until the next month; the website goes on without it. The
last request before may pass the limit by its own costs.

The costs are written once the action that asked has ended, also when it
fails afterwards: the provider was paid either way.

## Using the AI in a feature

A feature is an action with the right `ai.use`. It asks the `Assistant`,
never a provider directly:

```php
#[AsAction('acme/shop/product.describe', 'Writes a description of a product', permission: 'ai.use')]
final readonly class DescribeProduct implements Action
{
    public function __construct(public string $id) {}

    public function handle(Assistant $assistant, Products $products): string
    {
        $product = $products->get($this->id);
        $answer = $assistant->ask(new Request(
            'You write short product descriptions for an online shop.',
            [Message::user($product->name . "\n\n" . $product->facts)],
            effort: Effort::Low,
        ), 'product.describe');

        return $answer->text();
    }
}
```

The second argument names the feature in the costs. A `Request` takes
the system prompt, the messages (`Text`, `Image`, `ToolCall`,
`ToolResult`), tools, the most tokens of the answer, the effort (`low`,
`medium`, `high`) and whether to cache the beginning of the prompt. The
`Response` has the parts of the answer, the reason it stopped
(`done`, `limit`, `tools`, `refused`) and the usage per model.

`Ai\Tools::of($actor)` turns the actions and queries a person may run
into tools, like the [MCP server](mcp.md) does, without those of the AI
itself. A part of an answer only the provider understands, such as the
thinking of the model before a tool call, comes as `Opaque`; keep it in
the conversation and send it back unchanged.

## Writing a provider

A provider is a module that registers a `Provider` with a client:

```php
$registry->add(Provider::class, new Provider('acme/ai-example', 'Example', ExampleClient::class));
```

The client implements `ProviderClient`: `ready()` (is the key there),
`models()` with their `Prices` per million tokens, `model()` (the one of
its settings) and `send(Request): Response`. It throws an `AiException`
with a message for people when the provider cannot answer. With several
providers installed, **Settings**, **AI**, **Provider** chooses one;
otherwise the first one answers.

## Privacy

Only what a feature sends goes to the provider, never the whole website.
Name the provider as a processor in the privacy policy of the website.

See [actions and queries](actions-and-queries.md),
[users, roles and rights](rights.md) and [MCP](mcp.md).
