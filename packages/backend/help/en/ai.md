---
title: AI
about: [screen:backend.ai, action:ai.test, query:ai.usage, query:ai.status]
permission: ai.usage
order: 127
---
**AI** shows which provider answers for the AI of the website, what it
cost in a month and how much of the monthly limit is left. It appears
once a provider is installed, e.g. Anthropic.

## Set it up

1. Store the API key of the provider under **Settings**, at the
   provider.
2. Set a **monthly limit in US dollars** under **Settings**, **AI**.
   When the costs of the month reach it, the AI stops until the next
   month. The website goes on as before; only the AI is missing.
3. Choose **Test the connection**. It sends one short sentence and
   shows the answer, the tokens and what it cost.

## Who may use it

Admins may use the AI. For other roles, add the permission `ai.use`
under **Roles**. The AI acts with the rights of the person who asks: it
cannot change what that person could not change.

## Costs

Each request counts with its tokens and the prices of its model, by
day, feature, person and model. You pay the provider directly; the
figures here are an estimate from its list prices.

**Prices** says where they come from: from the hub for a website
connected to frootbox.de, which keeps them up to date, else from the
module of the provider, or from `config/app.yaml` for an own contract.

## Privacy

Only what a feature sends goes to the provider, e.g. the text you work
on, never the whole website. Name the provider as a processor in your
privacy policy.
