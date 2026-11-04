# Frootbox

Frootbox is a content management system written in PHP: smart, simple and
AI-assisted, as an alternative to WordPress.

> **Status:** early development. Nothing here is usable yet.

## Repository

This monorepo contains the core, the official modules, the themes and the
tooling. Every package under `packages/` has its own `composer.json` and is
mirrored into a read-only repository.

| Path | Package |
|---|---|
| `packages/core` | `frootbox/core` |
| `packages/database` | `frootbox/database` |
| `packages/rich-text` | `frootbox/rich-text` (MIT) |
| `packages/themes/bohnenglueck` | `frootbox/theme-bohnenglueck`, demo theme (MIT) |

## Development

Requirements: PHP 8.5 and Composer.

```bash
composer install
composer check
```

`composer check` runs PHP-CS-Fixer, PHPStan and PHPUnit. Single tools:
`composer cs`, `composer cs:fix`, `composer stan`, `composer test`.
PHPStan also enforces the naming rules of PSR-1 and PER Coding Style with
the rules in `tools/phpstan/`: PascalCase for classes and enum cases,
camelCase for methods, properties and variables, UPPER_SNAKE_CASE for
constants. New tables and columns must be snake_case.

`composer sandbox` creates `sandbox/`, a local test installation that loads
the packages from `packages/`. Point a web server with PHP 8.5 to
`sandbox/public`, or run `composer serve` and open http://localhost:8000.
The sandbox uses SQLite in `sandbox/storage/` and is set up with
`bin/frootbox install`, which creates the superuser `admin@example.test`
and shows its password once. To keep your own superuser after
`composer sandbox -- --reset`, copy `sandbox.env.example` to `sandbox.env`
and set `FROOTBOX_ADMIN_EMAIL`, `FROOTBOX_ADMIN_NAME` and
`FROOTBOX_ADMIN_PASSWORD` there; variables in the shell win. It runs the demo theme Bohnenglück in German
and English with its demo website from
`packages/themes/bohnenglueck/demo/site.yaml`. Own test content, e.g. a
large website, follows after the demo: put seed files into `local/`
(ignored by Git) and list them in `FROOTBOX_SANDBOX_SEED`, separated by
commas. Its console is `sandbox/bin/frootbox`, for example
`php sandbox/bin/frootbox about` or `php sandbox/bin/frootbox migrate`.

Browser tests use [Playwright](https://playwright.dev) and need Node.js.
They build a fresh installation of the demo website in `var/e2e/`, in live
mode with SQLite, and serve it on http://127.0.0.1:8100:

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

`PHP` names the PHP 8.5 binary if `php` is another version,
`COMPOSER_BINARY` names Composer if it is not in the `PATH`.

The database layer is its own package, `frootbox/database`, usable in any
PHP project (see [its README](packages/database/README.md)).
Migrations extend `Frootbox\Database\Migration` and describe tables
with a short schema builder:

```php
$this->createTable('news', function (Blueprint $table): void {
    $table->id();
    $table->string('title');
    $table->json('content')->nullable();
    $table->timestamps();
});
```

A new installation needs one command after `composer install`. It asks
for the database (SQLite by default, or MySQL/MariaDB), tests it, writes
`.env`, runs the migrations and creates the first superuser:

```bash
php bin/frootbox install
php bin/frootbox install --no-interaction --admin-email jane@example.com
```

Email, name and password of the superuser can also come from
`FROOTBOX_ADMIN_EMAIL`, `FROOTBOX_ADMIN_NAME` and `FROOTBOX_ADMIN_PASSWORD`;
the options win over the variables. Without questions and without the
variable, the password is generated and shown once.

Everything is an extension: a Composer package with a `frootbox.yaml`.
`bin/frootbox make:extension acme/website` creates one in `extensions/`;
after one `composer require acme/website` every change shows up directly.
`bin/frootbox extensions` lists the installed ones.

Data changes only through actions. An action is a class whose constructor
is the input; the JSON schema for validation, REST, MCP and the AI is built
from its types. Repositories read and write the rows of a table as typed
entities:

```php
#[AsAction('acme/news/article.publish', 'Publishes an article')]
final readonly class PublishArticle implements Action
{
    public function __construct(public int $id) {}

    public function handle(Articles $articles): Article
    {
        return $articles->update($this->id, ['status' => 'published']);
    }
}

$articles->fetch(['where' => ['status' => 'published', 'date <=' => $now], 'order' => 'date desc', 'limit' => 10]);
```

Register it with `$registry->action(PublishArticle::class)`. Names of
extension actions start with the Composer package name, here `acme/news`,
so two extensions never collide; plain names like `page.create` belong to
the core. Every run is
checked, logged and can be undone with `action.undo`, unless the action
writes past the repositories or is marked `undoable: false`.
`bin/frootbox actions`, `call` and `actions:log` help along the way.

Users sign in with email and password. Roles bundle permissions with
rules such as `*`, `page.*`, `-page.delete` or `acme/*`, and rank by level:
`superuser` (100) manages `admin` (50), who manages `editor` (10). Nobody
changes, undoes or out-ranks someone above them. Sessions and API tokens
share one table and are sent as a cookie or as `Authorization: Bearer`:

```bash
php bin/frootbox user:create jane@example.com --role superuser
php bin/frootbox user:token jane@example.com --name "Deploy"
```

Every action and query is also a REST endpoint, with no extra code:
actions as `POST /api/v1/<name>` with a JSON body, queries as
`GET /api/v1/<name>?…`, e.g. `POST /api/v1/acme/news/article.publish`. Answers are `{"data": …}`, errors are
`application/problem+json` (RFC 9457). `GET /api/v1/openapi.json`
describes everything the caller may run:

```bash
curl -H "Authorization: Bearer fbx_…" -H "Content-Type: application/json" \
     -d '{"email": "joe@example.com", "name": "Joe", "roles": ["editor"]}' \
     https://example.com/api/v1/user.create
```

Blocks and layouts are folders in an extension. A block is one Twig file
whose header declares its fields; `block.yaml` holds the schema when there
are several variants:

```twig
{# frootbox
title: Teaser
fields:
  title: { type: headline }
  text: { type: richtext, optional: true }
  button: { type: link, optional: true }
#}
<section class="teaser"><h2>{{ field('title') }}</h2>{{ field('text') }}{{ field('button') }}</section>
```

```
blocks/Teaser/views/Default.twig        every block has a variant Default
blocks/Teaser/views/ImageLeft.twig      more variants
blocks/Teaser/assets/teaser.css
```

Blocks are named after their package, e.g. `acme/website/Teaser`. A theme
is an extension with `theme:` in its `frootbox.yaml` (parent and design
tokens) and is chosen with `theme: acme/website` in `config/app.yaml`. It
replaces single files of other blocks under
`overrides/<vendor>/<package>/blocks/<Name>/`. Field types are an
extension point: `$registry->fieldType()` with `#[AsFieldType]`; the core
brings `headline`, `text`, `richtext`, `link` and `list`.
A field may name a `placeholder`, shown in the empty field while
editing and never to visitors. A list field begins with `start` empty
entries when a block is added (else with `min`), so a new block looks like
itself right away:

```yaml
fields:
  items:
    type: list
    start: 3
    fields:
      title: { type: headline, placeholder: "A benefit in a few words" }
```

Print fields without a condition, e.g. `<p>{{ field('text') }}</p>`.
While editing, an empty field keeps its element and shows its placeholder.
Visitors get neither the empty field nor an element that held only empty
fields. Use `value()` for attributes and conditions. Entries of a list
that nobody filled are left out for visitors and are not checked on
publishing, unless the list needs them to reach its `min`.

In the block picker blocks stand in groups by use. A block names one
with `group:` (`header`, `heading`, `text`, `media`, `teaser`, `callout`,
`list`, `form`, `structure`, or one an extension registers with
`$registry->blockGroup('acme/shop/products', 'Products')`) and may add
`keywords` for the search. Its preview lies in its folder, next to
`views/`: `preview.svg` or `preview.webp` in 16:10, one per variant as
`preview.Split.webp`. The core delivers previews under `/previews/…` to
editors only; they are never published. Neutral SVGs take the colours
of the theme; see [the kit](tools/previews/README.md).

```yaml
title: Hero
group: header
keywords: [Stage, Intro]
```

`examples:` gives the block content for the design page under `/_design`,
each entry in the same form as a block on a page (`fields`, `areas`,
`options`), for every variant or with `variant:` for one. The page shows
every block the theme offers in each variant with its examples, next to
the tokens, the plain elements and rich text, in the frame of the website
and in the draft. It is open to users who may see the design and to
guests with a preview link, never to search engines. Texts are English and
go through the translations of the block's package and the themes. Image,
video and file fields take `sample:` with a path in `assets/` of a theme
(the child first) or of the block's package instead of a medium.

```yaml
examples:
  - fields:
      title: Fresh coffee, roasted next door
  - variant: Split
    options: { side: end }
    fields:
      image: { sample: examples/landscape.jpg, alt: Coffee beans }
```

Links on top of the page switch the language, the direction (right to
left also for a language written left to right) and the place and surface
the blocks stand on. A theme names those frames in its manifest, as blocks
of its own with the area that takes the block:

```yaml
theme:
  design:
    places:
      column: { label: In one of two columns, block: Section, variant: Two, area: first }
    surfaces:
      dark: { label: On dark, block: Section, options: { background: dark }, area: first }
```

A child theme replaces each list as a whole. Blocks the area does not
allow are listed instead. Every `partials/design/<Name>.twig` of the
themes becomes a section of its own before the blocks, e.g. for states
that are no block.

`bin/frootbox blocks` lists what is available, `blocks:check` checks all
schemas and templates and hints at missing groups and previews,
`cache:clear` empties `var/cache` after a deployment.

### Consent

Nothing loads from another server before the visitor agrees, and the
core needs no cookie for it. An extension registers each service of
another provider with its purpose and reach:

```php
$registry->add(ExternalService::class, new ExternalService(
    'acme/stats/matomo', 'Matomo', 'Acme Hosting GmbH', 'https://acme.example/privacy',
    Purpose::Statistics, Reach::Site,
));
```

Content such as a video sits in `{{ external('acme/video/service', html) }}`
and loads at its place after a click. A script on every page goes into the
head inactive, e.g. from a listener on `BuildingHead`:
`$event->head->add($consent->deferred('acme/stats/matomo', '<script src="…"></script>'))`.
Then the core shows a banner with "Reject all", "Settings" and "Accept
all" of equal weight, only where such a script stands and the visitor has
not decided yet. `{{ privacy_settings() }}` puts the button to change the
choice into the footer; without it, the core adds a floating one.

The placeholder, the dialog and the banner are partials of the core in
`partials/consent/` (`external.twig`, `settings.twig`, `banner.twig`). A
theme overrides them file by file like its own partials, keeping the
`fb-*` elements and the `data-external-*` and `data-consent-*`
attributes the script needs.

In the browser `window.frootboxConsent` tells `allowed(name)` (true,
false or null), takes `set({name: true})` and `open()`, and fires
`frootbox:consent` on `document` after each change. A consent tool of
another provider takes over: its module registers
`$registry->add(ConsentTool::class, new ConsentTool('acme/consent/tool', 'Acme Consent', AcmeConsent::class))`
with a `ConsentToolProvider` (`ready()`, `head()` for its script), and the
script calls `frootboxConsent.use({allowed(name), set(choices), open()})`
(or leaves the object in `window.frootboxConsentTool` when it loads
first) and `frootboxConsent.changed()` when the choice changes. The query
`consent.services`, public and in the REST API, lists every service, so a
tool needs no scanner.

The setting "Keep a proof of consent" of the core (off by default) keeps
each choice with a random ID, its version and the time, without address
or browser, for 1095 days. The query `consent.proof.list` finds them by
the ID the visitor reads in the privacy settings.

The maintainer of Frootbox also offers a consent tool. The core prefers
none: every tool uses the same interface and comes as a module of its
own.

Tests run against in-memory SQLite. Set `DATABASE_URL` to run them against
MySQL or MariaDB, as the CI does.

## License

Frootbox is licensed under the MIT License. See [`LICENSE`](LICENSE).
Extensions may use any license. Font files may also be licensed under the
SIL Open Font License 1.1, with `OFL.txt` next to them.

Questions, bugs and ideas are welcome, pull requests not yet; see
[`CONTRIBUTING.md`](CONTRIBUTING.md).
