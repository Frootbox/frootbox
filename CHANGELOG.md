# Changelog

All packages of Frootbox share one version. This file lists what changed
in each of them, after [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Frootbox follows [Semantic Versioning](https://semver.org/): in `0.x` a new
second digit (`0.1` to `0.2`) may break, a new third digit only fixes and
adds. Every version that breaks something has an **Upgrade** section with
the steps.

What counts as the contract: names, input, output and rights of actions
and queries (and with them the REST API), the schema of blocks and
layouts, field types, Twig functions and partials of themes, theme
tokens, extension points of the registry, events, attributes and
interfaces an extension implements, console commands, configuration keys,
`.env` variables, and the layout of a project and an extension.
Migrations always run forward. Classes marked `@internal` and the
backend's own templates, styles and scripts are not part of it.

## [Unreleased]

## [0.1.0] - 2026-11-04

The developer preview: the first version for developers outside the
project. Everything is new.

### Added

- Pages from blocks with a schema, layouts, areas, drafts, revisions and
  scheduled publishing.
- Themes with a parent chain, design tokens, fonts and site fields;
  the base theme and the demo theme Bohnenglück.
- The edit mode on the website and the backend under `/cms`: sitemap,
  media, users and roles with branches, navigations, redirects,
  categories, tags, settings, help and search.
- Languages with prefixes or domains, translated slugs and a fallback
  language.
- Every change is an action, every read a query, the same for the backend,
  the REST API under `/api/v1` with OpenAPI, and the console.
- Undo for every action, daily backups, a full page cache for guests and
  scheduled tasks with a queue.
- Consent for content of other services, video and map embeds.
- Mails over `mail()` of PHP, SMTP from the settings or `MAILER_DSN`.
- Official modules: news, forms with spam protection and reCAPTCHA,
  events, people, jobs, collections, SEO, search, statistics, Google
  Fonts, webhooks and storage in S3-compatible buckets.
- Tools: the workbench for many local websites and the import from
  Frootbox 1.
- Documentation for developers, a reference written from the code
  (`bin/frootbox reference:build`: actions, console, extension points,
  Twig functions, field types, events) and an `AGENTS.md` for coding
  agents in every new website.

[Unreleased]: https://github.com/Frootbox/frootbox/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Frootbox/frootbox/releases/tag/v0.1.0
