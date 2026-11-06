---
title: Anthropic
permission: settings.list
order: 126
---
**Anthropic** brings Claude to the AI of your website. You pay Anthropic
directly for what the AI uses; the page **AI** shows what it cost this
month.

## Set it up

1. Create an API key in the console of Anthropic at
   [platform.claude.com](https://platform.claude.com) and add a payment
   method there.
2. Store the key under **Settings**, **Anthropic**, **API key**. If the
   server sets `ANTHROPIC_API_KEY` in `.env`, that one is used instead.
3. Choose the model if you like:
   - `claude-opus-5-5`, the best one and the standard,
   - `claude-sonnet-5-5`, half the price,
   - `claude-haiku-5-5`, fast and very cheap for short texts.
4. Open **AI** and choose **Test the connection**. It sends one short
   sentence and shows the answer and what it cost.

## What goes to Anthropic

Only what a feature of the AI sends: the text or the image you work on
and the instructions of the feature. Anthropic does not train its models
on it. Mention Anthropic as a processor in your privacy policy.

When Claude Opus or Sonnet declines a request, Anthropic answers with
the model it recommends for it. Both models count in the costs.
