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

## Where they live

- **Modules for many websites** are their own Composer packages, from
  Packagist or a private repository.
- **Packages of one website** (its theme, a small module) live in
  `extensions/` of the project. `bin/frootbox make:extension` creates
  one and adds `extensions/*` as a path repository.

## Official modules

Frootbox's own modules (news, forms, events, people, jobs, collections,
SEO, search, statistics, Google Fonts, webhooks, storage in S3) use only
the extension points that are open to everyone. Whatever they do, an
extension of yours can do too.

See [Themes](themes.md) and [your first module](../tutorials/first-module.md).
