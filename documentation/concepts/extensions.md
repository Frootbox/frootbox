# Extensions

Everything that adds to Frootbox is an **extension**: a Composer package
with a `frootbox.yaml`. The core itself, the backend, the official
modules, the themes and the packages of a single website all work the
same way. Installed means active; there is no switch to turn one on.

## The layout

Every extension has the same folders, all of them optional:

```
frootbox.yaml      title, description, the class, for themes "theme:"
composer.json
src/               PHP classes (PSR-4)
migrations/        database migrations, found by convention
blocks/<Name>/     blocks: views/, assets/, a controller, a preview
layouts/<Name>/    layouts of pages
partials/          Twig partials, e.g. for themes
views/             other templates, e.g. screens of the backend (@vendor/package/…)
assets/            CSS, JS, fonts, images; published to public/assets/<vendor>/<package>/
help/<language>/   pages of the help in the backend
translations/      texts of the backend and the website
```

## The class

```yaml
# frootbox.yaml
title: Daily specials
description: Specials of the day for the website
extension: Acme\Specials\SpecialsExtension
```

```php
final class SpecialsExtension implements Extension
{
    public function register(Registry $registry): void
    {
        $registry->action(CreateSpecial::class);
        $registry->query(ListSpecials::class);
        $registry->listen(ActionExecuted::class, NotifyKitchen::class);
        $registry->command(ImportCommand::class);
        $registry->get('/specials.json', FeedHandler::class);
    }
}
```

The [extension points](../reference/registry.md) list everything
`register()` can do: routes, actions, queries, listeners, commands, field
types, block groups, settings, jobs, search sources, plugins and more.
Services are wired by the container; constructors get what they need.

## Names

Everything an extension registers is named after its package, so two
extensions never collide:

| What | Example |
|---|---|
| Actions and queries | `acme/specials/special.create` |
| Blocks and layouts | `acme/specials/SpecialList` |
| Field types | `acme/shop/price` |
| Tables | `acme_specials_specials` |
| Templates | `@acme/specials/backend/specials.twig` |

Names without a slash belong to the core.

## Checking a package

`bin/frootbox extension:check` checks a package before it goes to other
websites, e.g. in CI:

```
php bin/frootbox extension:check extensions/acme-specials   # a folder
php bin/frootbox extension:check frootbox/news              # an installed package
php bin/frootbox extension:check --strict --json            # every package in extensions/
```

It boots the installation twice in a throwaway folder with SQLite in
memory, once without the package and once with it, so the website stays
as it is and the folder need not be installed. What the second boot has
more belongs to the package. Errors are a missing or incomplete
`composer.json` (name, license), a `frootbox.yaml` that cannot be read,
a class that does not load, a name that does not start with the
package (actions, queries, field types, and tables with
`<vendor>_<package>_`), a theme with actions, queries or tables, a
migration that fails on an empty database, and what `blocks:check`
reports for its blocks and layouts. Hints are those of `blocks:check`,
`frootbox/core` missing in `require`, and dependencies whose license is
unknown or copyleft (GPL, AGPL, LGPL, MPL), as far as they are installed.
`--strict` counts hints as errors. `--json` prints for each package its
name, version, license, the Frootbox version it needs, the errors and
hints with rule and place, what it brings (blocks, layouts, actions,
queries, field types, tables, settings, languages of its texts and help)
and its dependencies with their license.

## Where they live

- **Modules for many websites** are their own Composer packages, from
  Packagist or a private repository.
- **Packages of one website** (its theme, a small module) live in
  `extensions/` of the project. `bin/frootbox make:extension` creates
  one and adds `extensions/*` as a path repository.

## Official modules

Frootbox's own modules use only the extension points that are open to
everyone. Whatever they do, an extension of yours can do too.

A new website from the skeleton brings forms and SEO. The others come
with `composer require` and `php bin/frootbox migrate` when a website
needs them, so a small website keeps a short backend:

| Package | What it brings |
|---|---|
| `frootbox/forms` | forms with entries, mail and spam protection (in the skeleton) |
| `frootbox/seo` | sitemap, robots.txt, Open Graph, structured data, page check (in the skeleton) |
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

Before removing a module, look under **Extensions** on how many pages
its blocks and layouts are. A page keeps what an extension left on it
as it was and stays editable: visitors see nothing of a missing block,
the edit mode shows it as "Missing block" to remove, and a page whose
layout is gone shows the first layout editors may choose. The query
`system.component-usages` lists which pages use which blocks and
layouts and whether they are installed. Once the module is back,
everything is there again. Its tables and settings stay in the
database.

Superusers see what a website has installed under **Extensions** in the
backend, with version and what each one brings; the REST API and the
console give the same through the query `system.extension-list` and
`php bin/frootbox extensions`.

See [Themes](themes.md) and [your first module](../tutorials/first-module.md).
