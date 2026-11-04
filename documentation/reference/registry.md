<!-- Written by bin/frootbox reference:build from the code. Do not edit. -->

# Extension points

An extension names a class in `extension:` of its `frootbox.yaml`. Its
method `register(Registry $registry)` registers what the package brings.
Migrations in `migrations/` are found without it.

## `route(array|string $methods, string $path, string $handler, ?string $name = null)`

## `mount(string $configKey, string $default)`

Routes below a path the installation can change in config/app.yaml, e.g. mount('backend.path', '/cms'). Their first segment is reserved for pages.

## `get(string $path, string $handler, ?string $name = null)`

## `post(string $path, string $handler, ?string $name = null)`

## `listen(string $event, object|array|string $listener, int $priority = 0)`

## `command(string $class)`

A console command for bin/frootbox. Its name comes from #[AsCommand].

## `import(string $name, string $file)`

An entry of the import map, so scripts can `import { html } from "lit"`. The file is relative to the package and must be in an assets/ folder. A name belongs to one package only.

## `asset(string $file, string $area)`

A style or script loaded on every page of an area, e.g. "backend". The file is relative to the package.

## `add(string $type, object $item)`

Registers an object of a type that the core does not need to know, e.g. a screen of the backend or a brand. items() returns them.

## `action(string $class)`

An action. Its name, description and permission come from #[AsAction]. An extension names it "<vendor>/<package>/…", e.g. "acme/shop/order.create".

## `query(string $class)`

A query. Its name, description and permission come from #[AsQuery].

## `sensitive(string $table, string ...$columns)`

Columns such as password hashes that are recorded only as "***" for undoing, e.g. sensitive('users', 'password').

## `fieldType(string $class)`

A field type for blocks and layouts. Its name comes from #[AsFieldType]; an extension names it "<vendor>/<package>/…", e.g. "acme/shop/price".

## `blockGroup(string $name, string $title)`

A group of the block picker, e.g. blockGroup('acme/shop/products', 'Products'). It follows the groups of the core, in load order. Blocks name it with "group:".

## `undoCheck(string $class)`

A check that runs after an action was undone and refuses the undo if it would break a rule across several rows.

## `errorPage(string $class)`

An error page for the requests it is responsible for, e.g. those of the backend. The first responsible one wins.

## `scope(string $kind, string $class)`

A kind of scope roles can be given for, e.g. "page" for branches of the page tree.

## `searchSource(string $class)`

A source of the global search. Its name comes from #[AsSearchSource]; an extension names it "<vendor>/<package>/…", e.g. "acme/news/article".

## `plugin(string $class)`

A type of objects that pages show in spaces, e.g. news articles.

## `scheduled(string $class)`

How the scheduler publishes objects of a plugin at their time.

## `settings(string $class)`

The settings of the package: a final readonly class with #[AsSettings]. It can be injected anywhere and has the values from the configuration, the backend or its defaults. One class per package, and one more per section.

## `job(string $class)`

A job for the queue. Its name comes from #[AsJob]; an extension names it "<vendor>/<package>/…".
