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

### Where the prices come from

A model counts with the first prices that are there:

1. `ai.prices.<model>` in `config/app.yaml`, e.g. for an own contract:
   `input`, `output` and optionally `cacheRead` and `cacheWrite` in US
   dollars per million tokens. Without prices for the cache, reading and
   writing it costs as much as the input.
2. The list of the hub, for a website connected to frootbox.de.
3. The prices the provider module brings.

A connected website asks the hub for the list of its provider only when
it used the AI since its last list and that list is older than a day,
after a run of the schedule. It tells the hub only the name of the
provider package, nothing about the use. The hub signs the answer; one
without a valid signature is no list. The list lives in
`var/hub/ai-prices.json` and may get lost with `var/`: the prices of the
module count until the next one. A new list changes only the costs of
new requests. `ai.status` says where the prices of the chosen model come
from (`config`, `hub` or `module`).

```yaml
# config/app.yaml
ai:
    prices:
        claude-opus-5-5: { input: 3.5, output: 17.5 }
```

## Writing at a field

Three actions suggest texts and change nothing. A person takes a
suggestion with the action of the field, like an own input, so it lands
in the draft and can be undone. All need `ai.use`; the costs count under
the feature named below.

| Action | Suggests | Takes it | Feature |
|---|---|---|---|
| `ai.field-write` | a headline, text or rich text of a page from its draft: `task` is `rephrase`, `shorten`, `expand`, `correct`, `translate` (with `from`, another language of the page) or `instruct` (with `instruction`, also for an empty field) | `page.update-field` with `value` | `field.<task>` |
| `ai.alt-text` | an alternative text for an image, from a copy of at most 1568 pixels | `media.update` with `texts` | `media.alt-text` |
| `ai.page-snippet` | a title and a description for search engines from the text of the draft | `page.update` with `seoTitle` and `description` | `page.snippet` |

A rich text goes to the model as HTML and comes back as a document of
the field: only what the field allows passes, a suggestion that does not
fit is refused with `422`. Each request carries the name of the website,
the title of the page, the language and the field with its limits, never
more of the website than the feature needs. Every attempt costs, also
one that is not taken.

```bash
curl -X POST https://example.org/api/v1/ai.field-write \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"id": "01J…", "language": "de", "path": "title", "block": "k3x9q2mf", "task": "shorten"}'
```

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
