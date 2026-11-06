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

- Core and Backend: the action `system.cache-clear` empties `var/cache`
  like `bin/frootbox cache:clear`, for superusers. The backend offers it
  under Extensions, for websites on webspace without a console.
- Core: an MCP server at `/api/mcp` for Claude, ChatGPT and other AI
  clients. Every action and query the user may run is a tool (`page.create`
  as `page_create`), with `readOnlyHint` for queries and `destructiveHint`
  for actions a person should confirm. Signs in with a Bearer token, runs
  on the channel `mcp` and names the entry for `action.undo` in each
  result. Protocol 2026-07-28 and older clients with `initialize`, without
  sessions, so it runs on ordinary web space.
- Core: `#[AsAction(confirm: …)]` and `Descriptor::$confirm`, whether a
  person confirms an action before an AI runs it; derived when not set.

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
- Core: `bin/frootbox extension:check [target] [--json] [--strict]`
  checks a package folder or an installed package without touching the
  website: `composer.json`, `frootbox.yaml`, loading, the names of
  actions, queries, field types and tables, migrations on an empty
  database, its blocks and layouts, and the licenses of its
  dependencies. `--json` lists what it brings. Without a target it
  checks the packages in `extensions/`.
- Core: a catalog of the official modules in
  `resources/official-modules.json`, written by `composer reference`
  from their manifests. `system.extension-list` returns those not
  installed as `available` with their Composer command; **Extensions**
  in the backend lists them under **More official modules**.
- Core: `frootbox.yaml` takes `icon` and `screenshots` for the extension
  directory. `extension:check` reads what a package says about itself
  (title, description, README, keywords, homepage, support, authors,
  icon, screenshots, previews of its blocks) and checks the files: type,
  size, inside the package, a square icon. A missing icon is a hint.
  `--json` returns it as `listing`.
- Core: `bin/frootbox extension:catalog <folders…> --out <dir>
  [--release <version>]` writes `catalog.json` with the listing of each
  package that passes the check and copies its files next to it.
  `composer catalog` does so for the official modules in `var/catalog/`.
- Modules: every official module has an icon, a homepage and links for
  issues, source and documentation.
- Core: service accounts. `user.create` takes `kind: service` for a user
  without email and password who never signs in; the new action
  `user.create-token` (right `user.update`) gives such an account an API
  token that acts with its roles. People still create their own tokens
  with `account.create-token`, a service account cannot. `user.update`
  takes `email: null` for a service account, `actions:log` marks what a
  service account did, and the backend shows service accounts without
  email and password.
- Database: `->change()` on a column in `alterTable()` changes an
  existing column, e.g. `$table->string('email')->nullable()->change()`.
- Core: the query `status.show` returns the technical status of the
  website as a versioned document: versions of Frootbox, PHP, the
  database and each extension, the last run of cron, due and failed jobs,
  the last backup, free disk space, drafts, open comments and the last
  change, without personal data or contents. It has a permission of its
  own, so a role for a service account can grant just this, e.g. for
  monitoring.
- Core: the connection to the hub, frootbox.de ("frootbox.de Connect v1").
  Under **Connection** in Administration a superuser connects the website
  (`system.hub-connect`, then `system.hub-complete` with the code the
  browser brings back), turns the status on or off (`system.hub-switch`)
  and disconnects (`system.hub-disconnect`); `bin/frootbox hub:connect
  <code>` connects with a code from the account area, e.g. in automatic
  deployment. The website gets an Ed25519 key pair and signs every
  request; the hub reads the status with a service account that may only
  ask `status.show`, and the screen shows exactly what it sees. Nothing
  is sent before a superuser connects. The hub is Frootbox Hub at
  `https://hub.frootbox.de`; `hub.url` in `config/app.yaml` points to
  another hub, e.g. one running locally. A local website does
  not connect to the hub on the internet.
- Core: `StandardWebhooks` signs and verifies asymmetric webhooks
  (`v1a`, Ed25519) with `keyPair()`, `publicKey()`, `signContent()` and
  `verifyContent()`; `verify()` takes a list of public keys.
- Workbench: `build --with-content` leaves the connection to the hub
  and the key of the website out of the copy
  (`bin/frootbox hub:disconnect --local --forget-key`).
- Workbench: `build --since <build>` also makes a folder with only the
  files that changed since the build on the server, and a list of the
  ones that are gone, for a small upload by FTP. Each build names itself
  in a file `BUILD`. Database, media and caches are never part of a
  diff, also when the earlier build had them. With `--latest` the
  diff is always `<project>-latest/`, for a fixed folder in an FTP
  client.

### Changed

- Core: routes whose first segment starts with a dot or an underscore,
  e.g. `/.well-known/frootbox/…` and `/_consent/proof`, count as routes
  like `/api`: they check access themselves and pass the password of the
  website.
- Core: `Migrator` takes the connection and the migration sources and
  builds a fresh Doctrine factory for every run.
- Core: the registry remembers which package added an item with
  `add()` (`Registry::origin()`) or a command (`commandsOf()`).
  `system.extension-list` returns the jobs, search sources and commands
  of each extension; **Extensions** in the backend also shows its
  screens.
- Backend: titles and descriptions of extensions are translated, the
  German texts of the official modules come with the backend.
- Core: `blocks:check` runs its checks through the new
  `Component\ComponentCheck`, which `extension:check` shares.
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

- Core: access tokens reach the website on Apache with PHP as FastCGI,
  usual on webspace. `public/.htaccess` of the skeleton passes the header
  `Authorization` on, and the core reads it from there. Without it the
  REST API, MCP and the hub got no token. Websites made before need the
  two lines in their `public/.htaccess`.
- Core: the status and the page "Connection" of the backend no longer
  fail on webspace that disables `disk_total_space()` or
  `disk_free_space()`; the status then has no disk space. Work after the
  response no longer needs `ignore_user_abort()`.
- Workbench: `workbench build` without `--with-content` no longer carries
  the empty SQLite database the build leaves in `storage/`. Uploaded over
  a running website, it replaced the database there. `var/` of a build is
  empty, the caches of the building machine stay home.
- Core: the page cache no longer loses a query parameter that a block
  declares when pages are cached at the same time. A lost `q` made every
  search get the cached search page without results.
- Core: images, files and videos in the objects of modules (articles,
  events, people, locations, jobs, entries of collections, forms) count
  as used. `media.delete` refuses a medium that a published object
  shows, `media.usages` lists objects with their kind and title (new
  field `kind`), and the filter "not used" in the media library leaves
  them out. Before, an image could be deleted while a live article
  showed it. Modules register nothing for this.
- Backend: the licence of the Lucide icons ships as `LICENSE-lucide`
  next to the icons of the backend and of every module whose `icon.svg`
  reuses them, as `DESIGN.md` already said.
- Forms: `entry.release` and `entry.delete` fail with 422 for an id
  without an entry and change nothing. Before, an empty id, e.g. from a
  dialog opened before its script, reported success for nothing.
- Backend: a dialog that a button fills in, e.g. to edit a category,
  opens only once the script is in. Before, a click right after loading
  opened it empty, and a new category could land at the top instead of
  below the chosen one.
- Workbench: names of builds and the time of a check use the time zone
  of the computer. Before, PHP ran in UTC (MAMP sets it in `php.ini`),
  and a build at 05:47 in Berlin was named `…-044714`.

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
