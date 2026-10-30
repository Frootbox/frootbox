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

## Development

Requirements: PHP 8.5 and Composer.

```bash
composer install
composer check
```

`composer check` runs PHP-CS-Fixer, PHPStan and PHPUnit. Single tools:
`composer cs`, `composer cs:fix`, `composer stan`, `composer test`.

`composer sandbox` creates `sandbox/`, a local test installation that loads
the packages from `packages/`. Point a web server with PHP 8.5 to
`sandbox/public`, or run `composer serve` and open http://localhost:8000.
The sandbox uses SQLite in `sandbox/storage/` and runs its migrations on
creation. Its console is `sandbox/bin/frootbox`, for example
`php sandbox/bin/frootbox about` or `php sandbox/bin/frootbox migrate`.

Migrations extend `Frootbox\Core\Database\Migration` and describe tables
with a short schema builder:

```php
$this->createTable('news', function (Blueprint $table): void {
    $table->id();
    $table->string('title');
    $table->json('content')->nullable();
    $table->timestamps();
});
```

Everything is an extension: a Composer package with a `frootbox.yaml`.
`bin/frootbox make:extension acme/website` creates one in `extensions/`;
after one `composer require acme/website` every change shows up directly.
`bin/frootbox extensions` lists the installed ones.

Tests run against in-memory SQLite. Set `DATABASE_URL` to run them against
MySQL or MariaDB, as the CI does.

## License

Frootbox is licensed under the GNU Lesser General Public License v3.0 only
(`LGPL-3.0-only`). See [`COPYING.LESSER`](COPYING.LESSER) and
[`COPYING`](COPYING).

Contributions are not accepted yet.
