# frootbox/ai-anthropic

Claude by Anthropic as the AI provider of the
[Frootbox CMS](https://github.com/Frootbox/frootbox), with the official
PHP SDK of Anthropic (`anthropic-ai/sdk`):

- The API key in the settings "Anthropic" (stored encrypted) or as
  `ANTHROPIC_API_KEY` in `.env`, which comes first
- The model `claude-opus-5-5` (standard), `claude-sonnet-5-5` or
  `claude-haiku-5-5`, with their prices for the monthly limit of the AI
- One request per call with adaptive thinking, the effort of the feature
  and the automatic prompt cache; Opus and Sonnet hand a refused request
  to the fallback Anthropic recommends, and each model counts with its
  own tokens
- Errors of the API as messages for people (wrong key, too many
  requests, out of reach)

It is also an example for other providers: a `ProviderClient` with
`ready()`, `models()`, `model()` and `send()`, registered as a
`Provider`. Features never call it directly; they ask the `Assistant` of
the core, which checks the limit and notes the costs.

MIT licensed. The SDK of Anthropic is licensed under Apache 2.0.

## Source and issues

This package is developed in the [Frootbox monorepo](https://github.com/Frootbox/frootbox)
and mirrored here read-only. Questions, bugs and ideas go there, see the
[documentation](https://github.com/Frootbox/frootbox/tree/main/documentation).
