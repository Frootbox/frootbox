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

- Core, Backend: the screen "PHP" under Administration shows how PHP is
  set up, like `phpinfo()`: versions, interface, ini files, OPcache, the
  most important settings and every extension with its settings, marked
  where they differ from the php.ini, with a search by name. It reads the
  new query `system.php-info` (superusers only), which leaves out
  environment variables and masks secrets in settings.

- Core, Shop: `bin/frootbox about` and the screen "Shop sync" name what
  writes the images (`Images::describe()`, e.g. "GD 2.3.3" or "Imagick
  (ImageMagick 7.1.1-43)"). The sync measures its steps: the screen
  shows the working time of the run going on or the last one, the
  seconds per product and the shares of the shop, loading images,
  preparing images and the rest.

- Backend: an empty area in the edit mode names itself and says
  "Insert a block". Without a theme, **New page** explains where layouts
  come from instead of a form that cannot be sent.
- Backend: the editor keeps every change of a field in the browser until
  the server confirms it. After a dropped connection, an expired session
  or a crash, the status offers the changes again on the next load of
  the page, with **Save them now** and **Discard**. They expire after 7
  days.
- Core: `actions:prune` keeps of a new draft the paths it changed from
  the revision published before, so the history of a page still shows
  the first change after each publish once the changes are shortened.
  New service `Revision\Baseline`.

- Workbench: **Sign in** next to each project on the start page opens its
  backend as the superuser without a password, only on this computer,
  with a ticket that works once. New action
  `frootbox/workbench/account.sign-in`, only in the workbench.

- Core, Backend: the list of users shows "through the hub" at accounts
  the hub manages. New query `user.managed-list`.
- Shop: the checkout block also hands its view the link to the catalog
  (`catalog`), e.g. to continue shopping after the order.
- Shop: the screen "Shop sync" in the backend shows where the sync of
  the catalog stands: the one going on with its progress, what the last
  one changed, products without an image, images the shop did not hand
  out with the last reason, and a failed job of the queue. "Sync
  changes" and "Sync the whole catalog" run the sync step by step in
  the browser, without cron or queue, and can be stopped. New query
  `frootbox/shop/catalog.status`; a step waits for another one instead
  of running beside it.
- Backend: `<fb-form until="done">` sends its action again until that
  value of the result is true, with `again` for the input of the later
  steps and a stop button `data-fb-stop`.
- Core, Backend: a forgotten password by mail. The sign-in page links to
  `<backend.path>/password`, which mails a link through the queue
  (`account.request-password-reset`, the same answer for unknown
  addresses, at most three mails to an address and ten requests from one
  address within 15 minutes). The link works for 60 minutes and once; it
  sets the new password, ends all sessions, forgets failed sign-ins and
  signs in (`account.reset-password`, `account.password-reset-show`).
  It needs `app.url`, `APP_SECRET` and a way for mails.
- Core, Backend: signing in through OpenID Connect, with the hub as the
  first provider. The switch "Let people sign in through the hub" on the
  page Connection tells the hub the addresses of the website and the
  highest role it may give (`admin` unless chosen otherwise); the sign-in
  page then shows a button for it, the password stays. The hub creates,
  links and locks accounts on behalf of a person with that person's
  rights (`POST /.well-known/frootbox/access`, `user.grant-access`,
  `user.revoke-access`); a local account with the same email is never
  opened by signing in, its owner links it under Your account. Sessions
  through a provider end after 12 hours with a silent sign-in, the
  provider ends them at once over `POST /_oidc/{provider}/logout`. The
  client in `Auth\Oidc\` is general (PKCE, `private_key_jwt`, ID and
  logout tokens checked with `firebase/php-jwt`), links live in
  `user_identities`.
- Core: `system.end-sessions` and `php bin/frootbox sessions:end` end
  the sessions of all users and visitors, e.g. in a copy of a website;
  API tokens stay.
- Workbench: a build with content ends the sessions of users and
  visitors and leaves out the backup made while building.
- Core: sessions for visitors of the website. `Visitor\VisitorSession`
  keeps values per package, e.g. a cart, in the new table
  `visitor_sessions`. The cookie `fb_visitor` only comes with the first
  value; a session ends 30 days after the last request or with its last
  value, `regenerate()` gives it a new cookie. A visitor with a session
  gets pages without the page cache; requests with an access token have
  none.
- Core: a formal form of address for visitors, e.g. German "Sie". A
  package puts the texts that differ into
  `translations/<language>.formal.yaml`; the setting "Form of address"
  chooses the default of the website and `I18n\VisitorFormality` the one
  of a visitor, which `t()` follows. The shop addresses a signed-in
  customer as the shop provider says, for Avaro as set at the contact.
  The texts for visitors of the base theme (banner and privacy settings,
  error pages), forms, reCAPTCHA, search, people and jobs come formally
  as well.
- Core: the icon of the website. A theme names a square PNG with
  `theme: { icon: assets/icon.png }`; the core makes `/favicon.ico`,
  `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png` and
  `/manifest.webmanifest` from it and puts the tags into the head of
  every page. The icon for Apple devices gets the background colour of
  the theme. A child's icon replaces the parent's.
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
  The sync removes copies of images that no product uses any more. The
  sign-in has an optional text above the form, new passwords need at
  least ten characters. Orders and invoices have fixed states
  (`OrderStatus`, `InvoiceStatus`) that the provider maps to and the
  account shows translated, with dates in the time zone of the website.
  A product without an image shows a neutral placeholder in the catalog,
  on its page and in the cart. Tags of a product at the provider become
  tags of the core. The catalog searches with `?q=`, its option `tag`
  shows only products with that tag on the start page (fields `intro`
  and `productsTitle`), and every view gets `navigation`, `search` and
  `start` for a sidebar in the theme.
- Migrate: a rule under `plugins:` in the mapping of `fb1:import` takes
  `plugin: <type>`, and the page then shows that plugin of Frootbox 2 in
  its default space (`plugin.assign` after the content). Without
  `block:` the plugin becomes no block in the area. With `block:` naming
  the block of the plugin itself, its fields and options become the
  view of the plugin instead of a second block.
- Migrate: the mapping of `fb1:import` puts the block from the page
  itself into an area of its own with `page: { area: head }`, e.g. a
  banner that stays on the pages of a plugin's objects, and gives pages
  a new title by their ID in Frootbox 1 with `pages: { 12: { title: … } }`;
  the address stays.
- Migrate: `content: [1, 5]` in the mapping of `fb1:import` takes the
  content of these pages only, the others come without blocks, and a
  navigation can be a list of pages and entries of `navigation.update`
  (`navigations: { main: [1, {page: 2, children: …}] }`) instead of a
  menu element. Rules under `plugins:` can name one element by its ID,
  `widgets: { Core/Video/Video: true }` takes a widget without a file,
  and teasers link to aliases and other websites too.
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

- Core: messages of the content check and of field types are templates
  with placeholders, so the backend shows them translated, e.g. when
  publishing finds an option a variant does not have.
  `FieldType::validate()` may return a `Support\Message`.
- Core: `role.create` refuses the name `new`, the backend uses it for
  the form of a new role.
- Backend: after publishing only the footer, images or objects, the bar
  says "The changes are published." instead of naming the page. A field
  label that would cover the label of its block shows below the field.

- Shop: the sync copies the images of the shop at most 2000 pixels on
  the longer side instead of in the size the shop delivers, which saves
  a lot of space with many products. The new settings `shrinkImages`
  and `imageSize` of `frootbox/shop` turn this off or change the size.
  Run "Sync the whole catalog" once to bring the images copied before to
  the new size. `MediaEditor::create()`, `MediaEditor::replace()` and
  `Images::prepare()` of the core take a `maxEdge` for this.
- Shop: the checkout asks for consent only to the legal texts the
  provider requires; the others, e.g. the privacy policy, are a notice
  with a link and no longer go out with the order.
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

- Core, Backend, Shop: a full sync of the catalog in the browser no
  longer stops with "Internal Server Error" when the queue syncs at the
  same time. A locked database (SQLite "database is locked") answers
  503 with code `busy` and `Retry-After` instead of 500, as does the new
  `BusyException`; `<fb-form until>` sends a busy step again for about a
  minute, and the job of the queue steps back while someone syncs in
  the browser. A sync that waits for another one now answers 503
  instead of 409.

- Core: signing in works on a website that was updated but not migrated
  yet, so the superuser can start the migrations in the backend; before,
  every sign-in failed with 500 because sessions wrote columns the
  database did not have yet. Shortening the action log waits for the
  migration on SQLite too.
- Core: longer names of actions, queries, blocks and field types with
  dashes, such as `account.request-password-reset`, no longer fail the
  check of the name: the pattern of package names ran out of PCRE
  backtracking.
- Shop: Enter in a quantity field of the cart updates the cart instead
  of removing the first product; the form starts with a hidden button
  to update.
- Shop: the position of the catalog sync belongs to the catalog it came
  from. A provider names it with the new `ShopProvider::source()`; when
  it differs, e.g. in a copy of the website connected to another
  installation of the shop, the next sync takes the whole catalog
  instead of waiting for changes that never come. The first sync after
  the update takes the whole catalog once (migration
  `frootbox_shop_sync.source`).
- Core: without cron, a page request runs the queue only where the
  server sends the response first (PHP-FPM, now also LiteSpeed). With
  Apache and mod_fcgid the visitor waited for the jobs, and after 40
  seconds Apache answered with a 500; there the ticks of the hub run
  the queue.
- Shop: the catalog sync runs in short steps, each its own transaction,
  and goes on where the last one stopped. A whole catalog of a thousand
  products no longer holds the database for minutes, which on SQLite
  made other writes such as carts and sign-ins fail with "database is
  locked". The categories come first. `frootbox/shop/catalog.sync` does
  one step and says with `done` whether the sync is through; the job
  steps for up to 10 seconds and queues the next one, `shop:sync` steps
  to the end. Only one process syncs at a time, and the scheduler and
  webhook queue a sync only when none waits (new `Queue::pushOnce()`).
- Migrate: the old address of an object of Frootbox 1, such as a contact
  person, leads to the page that showed it, no longer to the page that
  happens to have the id of the object.
- Migrate: of several files in one field the import takes the one
  Frootbox 1 shows (highest order), and files of contact persons no
  longer land on the object with the same id.
- Migrate: navigations keep the order of Frootbox 1, highest `orderId`
  first; the import had them the other way round.
- Migrate: the blocks of a page keep the order of Frootbox 1, highest
  `orderId` first, as navigations already did.
- Migrate: file names with umlauts (e.g. `fähre.png`) find their alt
  text in the mapping however the file system spells them.
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
