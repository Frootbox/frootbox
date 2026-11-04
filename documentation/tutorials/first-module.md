# Your first module

The Northwind Bakery wants its specials of the day on the website, kept
by the staff in the backend. This tutorial builds the module
`acme/specials`: a table, an action that adds a special, a query that
lists them, a block for the website and a screen in the backend. At the
end the REST API, the rights, undo and the log are there without a line
of code for them.

You need a project from the [installation](../getting-started/installation.md)
in development mode.

## 1. Create the extension

```bash
php bin/frootbox make:extension acme/specials --title "Daily specials"
composer require acme/specials
```

This creates `extensions/acme-specials/` with a `composer.json` (PSR-4
namespace `Acme\Specials\` for `src/` and `Acme\Specials\Migrations\`
for `migrations/`), the manifest `frootbox.yaml` and the class
`src/SpecialsExtension.php`, which registers what the package brings.
After the one `composer require`, every change shows up at once.

When it is done, the folder looks like this:

```
extensions/acme-specials/
  composer.json
  frootbox.yaml
  migrations/Version20261104120000.php
  src/
    SpecialsExtension.php
    Special.php                 the entity, one row
    Specials.php                the repository, the table
    CreateSpecial.php           the action
    ListSpecials.php            the query
    Backend/SpecialsHandler.php the screen
  blocks/SpecialList/
    SpecialList.php             the controller of the block
    views/Default.twig
  views/backend/specials.twig
  help/en/specials.md
```

## 2. The table

Migrations live in `migrations/` and are found without registration.
The class name holds the time, migrations of all packages run in that
order. Tables of a package start with its name: `acme_specials_…`.

```php
<?php

declare(strict_types=1);

namespace Acme\Specials\Migrations;

use Doctrine\DBAL\Schema\Schema;
use Frootbox\Database\Migration;
use Frootbox\Database\Schema\Blueprint;

final class Version20261104120000 extends Migration
{
    public function getDescription(): string
    {
        return 'Adds the table of the specials';
    }

    public function up(Schema $schema): void
    {
        $this->createTable('acme_specials_specials', function (Blueprint $table): void {
            $table->id();
            $table->string('title', 100);
            $table->integer('price');
            $table->timestamps();
        });
    }

    public function down(Schema $schema): void
    {
        $this->dropTable('acme_specials_specials');
    }
}
```

```bash
php bin/frootbox migrate
```

Use `$table->ulid()` instead of `$table->id()` for ids that must exist
before a row is saved, e.g. for drafts.

## 3. Entity and repository

An entity is a readonly class, one row. Columns map to constructor
parameters by name (`created_at` to `$createdAt`).

```php
<?php

declare(strict_types=1);

namespace Acme\Specials;

use DateTimeImmutable;
use Frootbox\Database\Entity;

final readonly class Special extends Entity
{
    public function __construct(
        public int $id,
        public string $title,
        public int $price,
        public DateTimeImmutable $createdAt,
        public DateTimeImmutable $updatedAt,
    ) {}
}
```

A repository reads and writes one table:

```php
<?php

declare(strict_types=1);

namespace Acme\Specials;

use Frootbox\Database\Repository;

/**
 * @extends Repository<Special>
 */
final class Specials extends Repository
{
    protected function table(): string
    {
        return 'acme_specials_specials';
    }

    protected function entity(): string
    {
        return Special::class;
    }
}
```

`fetch(['where' => ['price <' => 500], 'order' => 'title', 'limit' => 10])`,
`fetchById()`, `insert()`, `update()`, `delete()` and `count()` come with
it. Inside an action every write is recorded, so it can be undone.

## 4. The action

Every change of data is an action: a class whose constructor is the
input. The JSON schema for validation, the REST API and the AI is made
from its types and attributes; `handle()` gets its services injected.

```php
<?php

declare(strict_types=1);

namespace Acme\Specials;

use Frootbox\Core\Action\Action;
use Frootbox\Core\Action\AsAction;
use Frootbox\Core\Action\Schema\Description;
use Frootbox\Core\Action\Schema\Length;
use Frootbox\Core\Action\Schema\Range;

/**
 * @implements Action<Special>
 */
#[AsAction('acme/specials/special.create', 'Adds a special of the day')]
final readonly class CreateSpecial implements Action
{
    public function __construct(
        #[Length(1, 100)]
        #[Description('What it is, e.g. "Rye loaf"')]
        public string $title,
        #[Range(0, 100000)]
        #[Description('The price in cents')]
        public int $price,
    ) {}

    public function handle(Specials $specials): Special
    {
        return $specials->insert(['title' => $this->title, 'price' => $this->price]);
    }
}
```

The name starts with the package. The right to run it has the same name
by default; a role grants it by name or with a pattern such as
`acme/specials/*`.

## 5. The query

Every read is a query. `public: true` lets visitors run it, without it
the right `acme/specials/special.list` is needed.

```php
<?php

declare(strict_types=1);

namespace Acme\Specials;

use Frootbox\Core\Action\AsQuery;
use Frootbox\Core\Action\Query;

/**
 * @implements Query<list<Special>>
 */
#[AsQuery('acme/specials/special.list', 'Lists the specials of the day', public: true)]
final readonly class ListSpecials implements Query
{
    /**
     * @return list<Special>
     */
    public function handle(Specials $specials): array
    {
        return $specials->fetch(['order' => 'title'])->all();
    }
}
```

## 6. Register both

```php
<?php

declare(strict_types=1);

namespace Acme\Specials;

use Acme\Specials\Backend\SpecialsHandler;
use Frootbox\Backend\Screen;
use Frootbox\Core\Extension\Extension;
use Frootbox\Core\Extension\Registry;

final class SpecialsExtension implements Extension
{
    public function register(Registry $registry): void
    {
        $registry->action(CreateSpecial::class);
        $registry->query(ListSpecials::class);

        // The screen only where the backend is installed.
        if (class_exists(Screen::class)) {
            $registry->mount('backend.path', '/cms')
                ->get('/specials', SpecialsHandler::class, 'acme.specials');
            $registry->add(Screen::class, new Screen('Specials', 'acme.specials', Screen::CONTENT, 'list', 'acme/specials/special.list'));
        }
    }
}
```

The screen comes in step 8. `php bin/frootbox actions` lists the new
action and query.

## 7. A block for the website

A block with a controller has a PHP class next to `views/`, named like
the folder, in the namespace `<namespace of the extension>\Blocks`. Its
`data()` gives the template more variables. It reads through the query,
like everyone else:

```php
<?php

declare(strict_types=1);

namespace Acme\Specials\Blocks;

use Acme\Specials\ListSpecials;
use Acme\Specials\Special;
use Frootbox\Core\Action\Runner;
use Frootbox\Core\Component\BlockContext;
use Frootbox\Core\Component\BlockController;

final readonly class SpecialList implements BlockController
{
    public function __construct(private Runner $runner) {}

    public function data(BlockContext $context): array
    {
        $specials = $this->runner->ask(new ListSpecials());

        return [
            'specials' => array_map(static fn(Special $special): array => [
                'title' => $special->title,
                'price' => number_format($special->price / 100, 2),
            ], $specials),
        ];
    }
}
```

```twig
{# frootbox
title: Specials of the day
description: The specials of the day with their prices, as kept in the backend under Specials.
group: list
fields:
  title: { type: headline, label: Heading, optional: true, placeholder: "Today" }
#}
<section class="specials">
  {{ heading('title', 0, {class: 'specials__title'}) }}
  {% if specials %}
    <ul class="specials__list">
      {% for special in specials %}
        <li>{{ special.title }} <span class="specials__price">{{ special.price }} €</span></li>
      {% endfor %}
    </ul>
  {% else %}
    <p>{{ t('No specials today.') }}</p>
  {% endif %}
</section>
```

The block is `acme/specials/SpecialList`. Editors find it in the block
picker under **Lists**; `php bin/frootbox blocks:check` checks it.

## 8. A screen in the backend

The backend is only a surface over the same actions and queries. A
screen is a request handler that renders a template with the building
blocks of the backend; it reads with the query and changes with
`<fb-form>`, which sends the form to the action.

```php
<?php

declare(strict_types=1);

namespace Acme\Specials\Backend;

use Acme\Specials\ListSpecials;
use Frootbox\Backend\View\BackendView;
use Frootbox\Core\Action\Runner;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class SpecialsHandler implements RequestHandlerInterface
{
    public function __construct(
        private BackendView $view,
        private Runner $runner,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        if (null === $this->view->user()) {
            return $this->view->requireUser($request) ?? $this->view->redirect('/');
        }

        return $this->view->render($request, '@acme/specials/backend/specials.twig', [
            'specials' => $this->runner->ask(new ListSpecials()),
        ]);
    }
}
```

```twig
{% extends '@backend/layout.twig' %}
{% import '@backend/ui.twig' as ui %}

{% block title %}{{ t('Specials') }}{% endblock %}

{% block content %}
<div class="fb-stack fb-stack--lg">
    <header class="fb-page-header">
        <div class="fb-page-header__text">
            <h1 class="fb-heading-1" tabindex="-1" data-fb-focus>{{ t('Specials') }}</h1>
            <p class="fb-muted">{{ t('What the bakery offers today. The block "Specials of the day" shows them on the website.') }}</p>
        </div>
    </header>

    <section class="fb-card" aria-labelledby="specials-title">
        <div class="fb-card__header"><h2 class="fb-heading-4" id="specials-title">{{ t('Today') }}</h2></div>
        {% if specials is empty %}
        <div class="fb-card__body">{{ ui.empty({icon: 'list', title: t('No specials yet')}) }}</div>
        {% else %}
        <ul>
            {%- for special in specials %}
            <li class="fb-list__item"><span class="fb-list__main"><span class="fb-list__title">{{ special.title }}</span><span class="fb-list__meta">{{ (special.price / 100)|number_format(2) }} €</span></span></li>
            {%- endfor %}
        </ul>
        {% endif %}
    </section>

    {% if can('acme/specials/special.create') %}
    <section class="fb-card" aria-labelledby="specials-new">
        <div class="fb-card__header"><h2 class="fb-heading-4" id="specials-new">{{ t('New special') }}</h2></div>
        <div class="fb-card__body">
            <fb-form action="acme/specials/special.create" next="{{ path('acme.specials') }}" done="{{ t('The special is added.') }}">
                <form class="fb-stack" novalidate>
                    {{ ui.field({label: t('What it is'), name: 'title', id: 'special-title', required: true}) }}
                    {{ ui.field({label: t('Price in cents'), name: 'price', id: 'special-price', type: 'number', required: true}) }}
                    <div class="fb-form__actions">{{ ui.button({label: t('Add'), type: 'submit'}) }}</div>
                </form>
            </fb-form>
        </div>
    </section>
    {% endif %}
</div>
{% endblock %}
```

Templates of the package are `@acme/specials/…`, the folder `views/` is
its root. `can()` asks whether the user has a right, `t()` makes a text
translatable. The screen is registered only where the backend is
installed (step 6): a route below the configurable path of the backend,
and an entry in the sidebar with its icon and the right to see it.

## 9. Help

A page of the help of the backend is a Markdown file in
`help/<language>/`. `about` ties it to the screen and the action, so the
help button of the screen opens it:

```markdown
---
title: Specials
about: [screen:acme.specials, action:acme/specials/special.create]
permission: acme/specials/special.list
---
**Specials** keeps what the bakery offers today. Add one with its name
and its price in cents. The block **Specials of the day** shows them on
any page.
```

## 10. What you get for free

Add a special in the backend under **Specials**, put the block on a page
and publish it. Then try what nobody wrote:

**The REST API.** Every action is `POST /api/v1/<name>`, every query
`GET /api/v1/<name>`, with the same schema and the same rights:

```bash
php bin/frootbox user:token you@example.com --name "Tutorial"

curl -H "Authorization: Bearer fbx_…" -H "Content-Type: application/json" \
     -d '{"title": "Rye loaf", "price": 450}' \
     http://localhost:8000/api/v1/acme/specials/special.create

curl http://localhost:8000/api/v1/acme/specials/special.list
```

Wrong input answers with `422` and a pointer to each field, without a
token `401`. `/api/v1/openapi.json` describes the new endpoints.

**Rights.** A role gets `acme/specials/*` in the backend under **Roles**,
and its users can add specials, without it they see neither the screen
nor the form.

**Undo and log.** Every run is logged with who and when
(`php bin/frootbox actions:log`) and can be undone with `action.undo`.

**The console.** `php bin/frootbox call acme/specials/special.list` runs
the query, `php bin/frootbox actions acme/specials/special.create` shows
its schema.

## Next

- [Actions and queries](../concepts/actions-and-queries.md) in depth:
  scopes, compensations, rules over several rows.
- [Extensions](../concepts/extensions.md): settings, jobs, events,
  scheduled tasks.
- [The reference](../reference/README.md) of every extension point.
