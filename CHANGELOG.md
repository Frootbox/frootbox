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

- Core: sessions for visitors of the website. `Visitor\VisitorSession`
  keeps values per package, e.g. a cart, in the new table
  `visitor_sessions`. The cookie `fb_visitor` only comes with the first
  value; a session ends 30 days after the last request or with its last
  value, `regenerate()` gives it a new cookie. A visitor with a session
  gets pages without the page cache; requests with an access token have
  none.
- Core: functions of extensions for templates. An extension adds one
  with `$registry->add(TemplateFunction::class, new TemplateFunction('acme_cart', Cart::class, 'summary'))`;
  the name needs a prefix and never replaces one of the core.
- Shop: new module `frootbox/shop`, a neutral shop on the website for
  any shop provider. A provider implements `Provider\ShopProvider` and
  adds itself with `$registry->add(ShopProviderEntry::class, …)`. The
  catalog is mirrored into the tables `frootbox_shop_*` (products,
  categories of the core in the group `frootbox/shop/catalog`, images as
  public media in the folder "Shop"), with the action
  `frootbox/shop/catalog.sync`, every five minutes by the scheduler, on a
  webhook at `POST /_shop/webhook` and with `shop:sync --full`. Blocks
  "Product catalog" (a plugin with category and product pages), "Cart",
  "Checkout", "Sign-in to the shop" and "Customer account" work without
  JavaScript through forms at `POST /_shop/<form>`; prices, orders and
  invoices come live from the provider for the signed-in customer, the
  cart lives in the visitor session. Template functions `shop_customer()`
  and `shop_cart()`.
- Core: history and proof of changes. The log of actions keeps the token
  and the device of each run ("Safari · iPhone", or the name of an API
  token), every migration leaves an entry `system.migrate`, and
  migrations change content with `updateRow()` so it shows in the
  history. After the undo period `actions:prune` shortens changes instead
  of deleting them (only what changed, deleted rows whole) and the
  scheduler does so once an hour. New queries `page.history` (who changed
  which field of which block, with old and new value, filters by block,
  path and language) and `action.log` (the whole log with filters, for
  the permission `action.log`), and `Action\History` and
  `Action\RowDiff` for the history of objects of modules.
- Backend: the history of a page and the log. The details of a page show
  its latest changes, **Whole history** all of them with old and new
  text by language, the screen **Log** the whole log with filters for
  the permission `action.log`, and in the edit mode the clock at a block
  opens its history in the side panel. `page.history` names block and
  field and gives the values as plain text (`Page\ChangeLabels`).
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
- Core: an interface for the AI. Providers are modules that register a
  `Provider` with a `ProviderClient`; features ask the `Assistant` with a
  `Request` (text, images, tools, effort, prompt cache) and get a
  `Response`. Every request counts in the new table `ai_usage` with its
  tokens and costs in US dollars, written also when the action fails
  afterwards. The settings `frootbox/core.ai` choose the provider and a
  monthly limit; once it is reached the AI answers `409` until the next
  month. The right `ai.use` for features (admins have it), the queries
  `ai.status` and `ai.usage`, and the action `ai.test` for a very small
  request. `Ai\Tools` turns the actions a person may run into tools.
- Core: the prices of the AI come from `ai.prices` in `config/app.yaml`,
  then from the hub, then from the provider module. A website connected
  to frootbox.de asks the hub for the signed list of its provider after a
  run of the schedule, only when it used the AI since its last list and
  that list is older than a day. `ai.status` says where the prices come
  from, the screen **AI** shows it.
- Core: writing at a field with the AI. `ai.field-write` suggests a
  headline, text or rich text of a page (rephrase, shorten, expand,
  correct, translate from another language of the page, or an own
  instruction), `ai.alt-text` an alternative text from the image and
  `ai.page-snippet` a title and description for search engines. They
  save nothing; the actions of the fields take the suggestions.
  `Page\PageText` gives the plain text of a page.
- AI Anthropic: the new module `frootbox/ai-anthropic` brings Claude
  through the official SDK of Anthropic, with the API key in its settings
  or `ANTHROPIC_API_KEY` in `.env`, the models Opus 5.5 (standard),
  Sonnet 5.5 and Haiku 5.5, adaptive thinking, the server-side fallback
  for refused requests and errors of the API as messages for people.
- Backend: the screen **AI** under Administration, once a provider is
  installed, with provider, model, the costs of a month by day, feature,
  person and model, the limit and **Test the connection**. A `Screen`
  takes `needs:`, a type of the registry it is shown with.

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
- Core: the hub runs the schedule of a connected website without cron.
  It calls `POST /.well-known/frootbox/tick`, signed like the other
  callbacks; the website answers 202 at once and then runs what is due
  and the queue for up to 20 seconds, unless an own cron job runs.
  `status.show` reports such runs as `cron.lastTick`, apart from
  `cron.lastRun`.
- Workbench: every website in the workbench has a screen **Build**
  under Administration for superusers. It builds the website for upload
  in the background, with the diff since the build on the server in
  `<project>-latest/`, and shows the result. A button **Uploaded**
  notes the new build as the one on the server; until then every build
  compares with the same base. The actions
  `frootbox/workbench/build.start` and
  `frootbox/workbench/build.mark-uploaded` and the query
  `frootbox/workbench/build.show`, only in the workbench.

- Migrate: the mapping of `fb1:import` takes the page itself (`page:`,
  e.g. the header image and banner style as a block on top), translates
  values with `{ value: '{config.x}', map: { old: new } }`, reads the
  contact persons of a plugin as the list `persons` and plain values of
  objects such as `position` or `phone`. The images of a gallery go into
  a list one by one (`images: items.#.image`). Options read the image in
  a text with `{widget.align}` or `{widget.width}`.

### Changed

- Core: `status.show` tells how mails leave the server, as `mail` with
  `transport` (`smtp`, `native`, `log`, `null`, `memory`) and `source`
  (`environment`, `settings`, `default`), without server, account or
  sender. frootbox.de warns when mails go out without SMTP.
- Backend: the card **Email** in the settings warns when mails go out
  with `mail()` of PHP. Such mails often land in spam or are refused,
  and the website never learns of it.
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

- Migrate: of several files in one field the import takes the one
  Frootbox 1 shows (highest order), and files of contact persons no
  longer land on the object with the same id.
- Migrate: navigations keep the order of Frootbox 1, highest `orderId`
  first; the import had them the other way round.
- Base theme: the page grid no longer overflows when a theme makes
  `--width` narrower than `--width-narrow` (e.g. fixed content widths
  per breakpoint); the narrow column stays within the content.
- Google Fonts: a variable font whose weights go up to 1000 (such as
  Nunito) keeps its range. The import read it as weight 400, so browsers
  faked bold text. Import such a font again to get the right files.
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
