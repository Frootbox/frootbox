# Installation

## Requirements

- PHP 8.5 with the extensions `intl`, `pdo_sqlite` or `pdo_mysql`, and
  `gd` or `imagick` for images
- SQLite (nothing to set up), MySQL 8 or MariaDB 10.11 or newer
- Composer on your computer. The web server does not need it: a website
  is uploaded with its `vendor/` folder.
- A web server that shows the folder `public/` (Apache with
  `mod_rewrite`, nginx, or `php -S` while developing)

## A new website

```bash
composer create-project frootbox/skeleton northwind
cd northwind
php bin/frootbox install
```

`install` asks for the database (SQLite by default), tests it, writes
`.env`, runs the migrations and creates the first superuser. Without
questions, e.g. in a script:

```bash
php bin/frootbox install --no-interaction --admin-email you@example.com
```

The password is shown once. It can also come from
`FROOTBOX_ADMIN_PASSWORD`.

Turn on the development mode in `.env`:

```bash
APP_ENV=dev
```

Now nothing is cached: change a file, reload the page. Start PHP's own
web server:

```bash
php -S localhost:8000 -t public public/index.php
```

http://localhost:8000 shows a welcome page until the website has its
first page. Sign in at http://localhost:8000/cms with the superuser.

## Name and language

`config/app.yaml` holds what the developer decides and Git keeps. The
skeleton starts with German as its only language and without a theme.
Set the languages before the first page, since the first one is the
default and has no prefix in the address, and choose a theme, e.g. the
base theme the skeleton brings:

```yaml
app:
  name: Northwind Bakery
  url: https://www.northwind-bakery.example   # required live
  timezone: Europe/Berlin

languages:
  en: { title: English }
  # de: { title: Deutsch }   # /de/… shows English where a page has no translation yet

theme: frootbox/theme-base
```

More languages can come at any time: pages show the content of the
default language until they have a translation.

## Modules

The skeleton brings the core, the backend, the base theme, forms and
SEO. News, events, people, jobs, collections, search for visitors,
statistics and the other [official modules](../concepts/extensions.md#official-modules)
come when the website needs them. An installed module is active, so
each one adds its screens and blocks:

```bash
composer require frootbox/news
php bin/frootbox migrate
```

## The first page

In the backend under **Pages**, create a page with the layout **Start
page** and add blocks to it on the website: the editor bar at the bottom
of the page switches to the edit mode. **Publish** makes the draft
visible to visitors.

The same can come from a file, e.g. to set up a website again and again
while developing. Every step of a seed file is an action with its input:

```yaml
# content/start.yaml
- page.create:
    layout: frootbox/theme-base/Start
    translations:
      en:
        title: Northwind Bakery
        description: Sourdough bread and pastries, baked every morning.
        content:
          areas:
            main:
              - block: frootbox/theme-base/Hero
                fields:
                  title: Bread with time
                  text: Our sourdough rests for 48 hours before it goes into the oven.
  as: start

- page.publish:
    ids: ['${start.id}']
```

```bash
php bin/frootbox seed content/start.yaml
```

`as` names the result of a step, later steps use it as `${start.id}`.
`php bin/frootbox blocks` lists the blocks and their variants,
[the reference](../reference/actions.md) every action and its input.

## The project

```
config/app.yaml          name, address, time zone, languages, theme
config/extensions/       settings of extensions as files, they win over the backend
.env                     database, secrets, APP_ENV; never in Git
extensions/              packages of this website: its theme, its modules
public/                  the document root, nothing else is served
storage/                 the SQLite database, originals of media, backups
var/                     cache and logs, may be deleted at any time
bin/frootbox             the console
AGENTS.md                the rules of a Frootbox website, for coding agents
```

A backup is the database, `storage/` and `.env`.

## Next

- [A website from a design](../tutorials/website-from-a-design.md)
- [Your first module](../tutorials/first-module.md)
- [Deployment](../concepts/deployment.md)
