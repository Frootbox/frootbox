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
PHPStan also enforces the naming rules of PSR-1 and PER Coding Style with
the rules in `tools/phpstan/`: PascalCase for classes and enum cases,
camelCase for methods, properties and variables, UPPER_SNAKE_CASE for
constants. New tables and columns must be snake_case.

`composer sandbox` creates `sandbox/`, a local test installation that loads
the packages from `packages/`. Point a web server with PHP 8.5 to
`sandbox/public`, or run `composer serve` and open http://localhost:8000.
The sandbox uses SQLite in `sandbox/storage/` and runs its migrations on
creation. Its console is `sandbox/bin/frootbox`, for example
`php sandbox/bin/frootbox about` or `php sandbox/bin/frootbox migrate`.

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

Tests run against in-memory SQLite. Set `DATABASE_URL` to run them against
MySQL or MariaDB, as the CI does.

## License

Frootbox is licensed under the GNU Lesser General Public License v3.0 only
(`LGPL-3.0-only`). See [`COPYING.LESSER`](COPYING.LESSER) and
[`COPYING`](COPYING).

Contributions are not accepted yet.
