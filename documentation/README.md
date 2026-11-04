# Frootbox documentation

Frootbox is a content management system in PHP. Editors arrange finished
blocks on their pages and keep a simple interface; developers build
themes, blocks and modules without hitting a wall. Every change is an
action, the same for the backend, the REST API, the console and the AI.
It runs on ordinary web space without a build chain on the server.

This is the documentation of the developer preview (`0.x`). The ideas
are settled, names and details may still change between versions; see
the [changelog](../CHANGELOG.md).

## Start here

- [Installation](getting-started/installation.md): a new website with
  `composer create-project`, the first page, the project layout.

## Build something in an hour

- [A website from a design](tutorials/website-from-a-design.md): a child
  theme with its own colours, a block of its own, another variant of a
  block, and a field for the footer.
- [Your first module](tutorials/first-module.md): a table, an action, a
  query, a block and a screen in the backend. The REST API and the
  rights come with it.

## Coming from elsewhere

- [Frootbox for WordPress developers](guides/for-wordpress-developers.md):
  hooks, shortcodes, custom fields, plugins and child themes, and what
  they are here.

## Understand

The [concepts](concepts/README.md) explain how Frootbox works and why:
actions, extensions, themes, blocks, drafts, rights, languages, caching,
consent, media, settings and deployment.

## Look up

The [reference](reference/README.md) is written from the code: every
action and query, the console commands, the extension points, the Twig
functions and the field types.

## With an AI agent

Every new project brings an `AGENTS.md` (and a `CLAUDE.md` that points
to it) with the rules of a Frootbox website, so a coding agent builds it
the right way from the start.

## About the numbers in the code

Comments in the code sometimes name a decision by its number, as in
"(decision NNNN)". They point to the internal notes in which the
maintainer records each decision about the design of Frootbox. Those
notes are not public; what matters for building with Frootbox is in
this documentation.
