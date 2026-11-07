# Working on this website

This is a website built with [Frootbox](https://github.com/Frootbox/frootbox),
a content management system in PHP. These notes are for coding agents and
for people: how a Frootbox website is built so that editors keep a simple
interface and nothing breaks with the next update. The documentation is at
https://github.com/Frootbox/frootbox/tree/main/documentation.

## Ground rules

- **The look of the website lives in its own child theme** in
  `extensions/`, never in a package from `vendor/`. A parent theme
  (`frootbox/theme-base` by default) gives the structure, the child theme
  gives the design: its own CSS, tokens, partials, variants and blocks.
- **Every change of data is an action, every read a query.** The backend,
  the REST API, the console and the AI use the same ones. There is no
  second way to change data: no SQL in templates, no writes from a
  listener past an action.
- **Editors arrange finished blocks.** There is no free layout editor. A
  new kind of content is a new block or a new variant, with a schema.
- **Nothing is fixed in a template that an editor might want to change.**
  Texts that are the same on every page (name, address, opening hours in
  the footer) are site fields, texts on a page are fields of a block.
- **Standards are no feature.** Performance, on-page SEO, responsive
  layouts and accessibility always apply. Every default must be right,
  and no option of an editor may break the outline or the layout.
- No build chain on the server: plain CSS and JS from `assets/` folders,
  no Composer on the web space (upload `vendor/` with the website).

## Layout of the project

```
config/app.yaml          name, address, time zone, languages, active theme
config/extensions/       settings of extensions as files (wins over the backend)
.env                     secrets and the database, never in Git
extensions/<vendor>-<package>/   packages of this website (child theme, modules)
public/                  the document root of the web server, nothing else
storage/                 database (SQLite), originals of media, private files
var/                     cache and logs, may be deleted at any time
bin/frootbox             the console
```

Back up the database, `storage/` and `.env`. The web server must show
`public/` as its document root; `.htaccess` in this folder only locks
everything else in case it does not.

## Commands

```bash
php bin/frootbox install                        # once: database, .env, first superuser
php bin/frootbox migrate                        # after an update or a new extension
php bin/frootbox make:extension acme/site --theme   # a child theme in extensions/
php bin/frootbox make:extension acme/shop       # an extension with a class
php bin/frootbox blocks                         # blocks available to editors
php bin/frootbox blocks:check                   # schemas, templates, previews
php bin/frootbox extension:check                # names, migrations, licenses of extensions/*
php bin/frootbox seed content.yaml              # pages and media from a file ("upload" step, then media.create)
php bin/frootbox actions                        # every action and query
php bin/frootbox cache:clear                    # live, after changed templates
php bin/frootbox about                          # version, environment, database
```

After `make:extension`, run `composer require acme/site` once, then every
change shows up directly. Set `theme: acme/site` in `config/app.yaml`.

`APP_ENV=dev` in `.env` turns off every cache: change a file, reload the
page. Live (`APP_ENV=prod`) guests get cached pages; run `cache:clear`
after a deployment. Without a console, a superuser empties the cache
under **Extensions** in the backend (action `system.cache-clear`).

## Modules

A new website brings the core, the backend, the base theme, forms and
SEO. Every other official module comes when the website needs it, since
an installed module is active: its screens, blocks and tables appear.

```bash
composer require frootbox/news
php bin/frootbox migrate
```

The action `system.migrate` does the same for a superuser, after a
backup (409 if none can be made, `withoutBackup: true` to go on), and
`system.migration-list` shows what is pending.

| Package | What it brings |
|---|---|
| `frootbox/forms` | forms with entries, mail and spam protection (included) |
| `frootbox/seo` | sitemap, robots.txt, Open Graph, structured data, page check (included) |
| `frootbox/news` | articles with categories, list, teasers and RSS |
| `frootbox/events` | events with place, upcoming and past, calendar file |
| `frootbox/people` | team, contact persons, locations with opening hours |
| `frootbox/jobs` | open positions with application through a form |
| `frootbox/collections` | references, projects and similar entries |
| `frootbox/search` | search for visitors |
| `frootbox/statistics` | visits without cookies or personal data |
| `frootbox/google-fonts` | import Google Fonts to serve them from the own domain |
| `frootbox/captcha-recaptcha` | reCAPTCHA for forms, after consent |
| `frootbox/webhooks` | tell other services about changes |
| `frootbox/storage-s3` | media and files in an S3-compatible bucket |

Before removing a module, check the query `system.component-usages`
(or **Extensions** in the backend) for pages with its blocks and
layouts. Pages keep them as they were and stay editable; the edit mode
shows a missing block as a placeholder to remove. Content that was
stored is kept even when its block, option, field, variant or area is
gone; new or changed content is still checked.

## A child theme

`frootbox.yaml` with `theme: { parent: frootbox/theme-base }` and
optional `tokens` (colours, fonts, radius, spacing). Tokens become CSS
custom properties such as `var(--color-primary)`.

- A file with the same path as one of the parent replaces it: `views/`,
  `partials/`, `layouts/`, `blocks/`, `assets/`.
- Own variants of a block of another package go to
  `overrides/<vendor>/<package>/blocks/<Name>/views/<Variant>.twig`.
- Own blocks go to `blocks/<Name>/` (PascalCase): `views/Default.twig`
  with the schema in its header, `assets/` for CSS and JS,
  `preview.svg` or `preview.webp` (16:10) for the block picker.
- JS of a block is a custom element around its markup: while editing,
  the page content is swapped after each change, and a script that
  queries its elements once at load misses the new ones (otherwise
  listen to `frootbox:refresh` on `document`).
- Site fields are declared under `theme: fields:` and printed with
  `site_field('name')`, read with `site_value('name')`.
- The favicon comes from `theme: icon: assets/icon.png`, one square PNG
  of 512 pixels; the core makes every size and the tags. No favicon
  files or `<link rel="icon">` in templates.

A block:

```twig
{# frootbox
title: Teaser
group: teaser
fields:
  title: { type: headline }
  text: { type: richtext, optional: true }
  button: { type: link, optional: true }
#}
<section class="teaser">
    {{ heading('title', 0, {class: 'teaser__title'}) }}
    <div class="teaser__text">{{ field('text') }}</div>
    {{ field('button') }}
</section>
```

Rules for templates:

- **Headings only with `heading(name, rank)`** or, for a title from data,
  `heading_text(text, rank)`, never a fixed `<h1>` to `<h6>`. Rank 0 is
  the main heading of the block, 1 and deeper are below it; the core
  works out the real level from the place of the block, so the outline is
  always right. Style headings with classes, not with tags.
- Print fields with `field()` without a condition. While editing an empty
  field keeps its place and shows its placeholder, visitors get neither
  the field nor an element that only held empty fields. Use `value()` for
  attributes and conditions. A list field gives its entries to loop
  over: `{% for item in field('items') %}{{ item.field('text') }}{% endfor %}`.
- Values in seed files and actions follow the field types:
  `php bin/frootbox reference:build` writes the reference of this
  website to `documentation/reference/`, with every action, field type
  and Twig function, e.g. an image is `{media: <id>, alt: …}`, and
  every key of a block schema.
- Links with `url()`, navigations with `navigation()`, the language with
  `language()` and `alternates()`.
- Content of another server (video, map, script) only through
  `external()`, `video_embed()` or `map_embed()`: nothing loads before
  the visitor agrees.
- Images of the field type `image` may be wrapped (AI label): select them
  with `.teaser :is(picture, img)`, never with `> picture`.

CSS is plain modern CSS (custom properties, container queries, logical
properties), without `@layer` and without `@import`; the core puts every
file into the right layer by where it comes from. Values come from the
tokens, not from fixed colours.

## An extension with logic

A class from `extension:` in `frootbox.yaml` registers everything in
`register(Registry $registry)`: `action()`, `query()`, `get()`, `post()`,
`listen()`, `command()`, `fieldType()`, `settings()`, `job()`.

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
```

- The constructor is the input; the JSON schema for validation, REST and
  the AI comes from its types. Every action is a REST endpoint
  (`POST /api/v1/acme/news/article.publish`) with its right, and can be
  undone.
- Names start with the Composer package (`acme/news/…`, tables
  `acme_news_…`); names without a slash belong to the core.
- Tables and columns in `snake_case`, migrations in `migrations/` extend
  `Frootbox\Database\Migration` and use `createTable()` with a
  `Blueprint`. Repositories extend `Frootbox\Database\Repository`, no
  database-specific SQL.
- Settings are a final readonly class with `#[AsSettings]`; secrets only
  through `Security\Secrets`. Mails only through `Mail\Mailer`.
- Listeners and jobs change data only through actions.

## Conventions

- Identifiers, comments and READMEs in English. Classes PascalCase,
  methods, properties and variables camelCase, constants
  UPPER_SNAKE_CASE, field names camelCase.
- Every PHP file starts with `declare(strict_types=1)`.
- Times are in the time zone of `app.timezone`, also in the database.
- Secrets in `.env`, never in `config/` or in Git.
