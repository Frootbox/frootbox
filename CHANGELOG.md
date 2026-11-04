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

### Added

- Reference: the block schema, every key of `block.yaml` and of the
  header of a view, with its value and where it may stand.
- Backend: the screen **Extensions** under Administration lists what is
  installed besides the core, read only: version, theme, the website's
  own packages, and the blocks, layouts, actions, queries, field types,
  settings and tables each one brings. For superusers, through the new
  query `system.extension-list`.
- Core: `ExtensionPackage::$version` from Composer; `bin/frootbox
  extensions` shows it.
- Documentation: the official modules with their packages, in
  `concepts/extensions.md`, the installation and `AGENTS.md` of the
  skeleton.

- Core: the query `system.component-usages` lists the blocks and
  layouts on pages, in drafts or published, with the pages and whether
  their extension is installed. **Extensions** in the backend shows on
  how many pages each extension is, and a section **Missing blocks and
  layouts** with their pages.

- Core: the query `system.migration-list` lists pending migrations with
  their package, and the action `system.migrate` runs them after a backup
  (409 if none can be made, `withoutBackup: true` to go on). Backend: a
  card **Database** under **Extensions** with the list and a button, and
  a notice on the dashboard for superusers.
- Core: `#[AsAction(transactional: false)]` for `system.*` actions that
  cannot be undone, e.g. to change the schema.

### Changed

- Core: `Migrator` takes the connection and the migration sources and
  builds a fresh Doctrine factory for every run.
- Core: content an extension left behind when it was removed or updated
  no longer freezes a page. A block whose extension is gone, the view of
  a plugin, and a variant, option, field or area a block or layout no
  longer has stay as they were stored and are no error; new or changed
  ones still are. The edit mode shows a missing block as a placeholder
  that can be moved within its area and removed. A page whose layout is
  gone shows the first layout editors may choose.
- Skeleton: a new website brings only the core, the backend, the base
  theme, forms and SEO, so a small website keeps a short backend. The
  other official modules come with `composer require frootbox/<module>`
  and `php bin/frootbox migrate`. Existing websites keep their
  `composer.json` and do not change.

### Fixed

- Forms: `entry.release` and `entry.delete` fail with 422 for an id
  without an entry and change nothing. Before, an empty id, e.g. from a
  dialog opened before its script, reported success for nothing.
- Backend: a dialog that a button fills in, e.g. to edit a category,
  opens only once the script is in. Before, a click right after loading
  opened it empty, and a new category could land at the top instead of
  below the chosen one.

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
