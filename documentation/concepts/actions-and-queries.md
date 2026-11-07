# Actions and queries

Every change of data in Frootbox is an **action**, every read a
**query**. The backend, the REST API, the console, seed files, the AI
and the app use only these. There is no second way to change data.

## Why

- **One check for everything.** Input is validated against one schema,
  rights are checked in one place. A REST client cannot do what the
  backend forbids.
- **Undo and log.** Every run is logged with who, what and when. Every
  change of rows inside an action is recorded and can be undone with
  `action.undo`.
- **An API for free.** An action is `POST /api/v1/<name>`, a query
  `GET /api/v1/<name>?…`, described in `/api/v1/openapi.json`.
- **AI without special cases.** The AI gets the same actions with the
  same rights as the user it works for, and its changes land in drafts.

## An action

```php
/**
 * @implements Action<Special>
 */
#[AsAction('acme/specials/special.create', 'Adds a special of the day')]
final readonly class CreateSpecial implements Action
{
    public function __construct(
        #[Length(1, 100)]
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

- The **constructor is the input**: public promoted properties. Their
  types and the attributes `#[Length]`, `#[Range]`, `#[Description]`,
  `#[ListOf]`, `#[Email]` and `#[Sensitive]` make the JSON schema.
- **`handle()`** gets its services injected and returns the result.
- The **name** is `<object>.<verb>`; in an extension it starts with the
  Composer package. Names without a slash belong to the core.
- `undoable: false` marks an action that cannot be undone, e.g. one that
  sends a mail.
- `confirm: true` or `false` says whether a person confirms the action
  before an AI client runs it. Without it Frootbox derives it: publishing,
  deleting, users, roles, settings, extensions, the system, preview links
  and everything that cannot be undone. See [MCP](mcp.md).
- `transactional: false` runs an action without a database transaction.
  Only core actions under `system.*` that cannot be undone may use it,
  e.g. `system.migrate`, whose changes to the schema end a transaction on
  MySQL. Such an action does not run inside another one.

A query looks the same with `#[AsQuery]` and `implements Query`.

## Who may run it

- By default the right with the name of the action. Roles grant rights
  by name or pattern (`acme/specials/*`, `page.*`, `-page.delete`).
- `public: true`: everyone, also visitors.
- `signedIn: true`: every signed-in user, for their own account.
- An action that works on a page implements `Auth\Scoped` and names its
  pages, so roles limited to a branch of the site tree apply.

## Running one

```php
$runner->run(new CreateSpecial('Rye loaf', 450));   // an action
$runner->ask(new ListSpecials());                    // a query
$runner->call('acme/specials/special.list', []);     // by name, e.g. from input
```

```bash
php bin/frootbox call acme/specials/special.create '{"title": "Rye loaf", "price": 450}'
php bin/frootbox actions                       # all of them
php bin/frootbox actions acme/specials/special.create   # its schema
```

## Writing inside an action

Write through repositories. Inside an action the writer records every
change for undo; outside an action nothing can be written. When an action
writes past the repositories (own SQL, files, another service) it is not
undoable by itself: mark it `undoable: false`, or register compensations
that undo the side effect. A rule over several rows (e.g. "at least one
superuser") is an `UndoCheck`, which refuses an undo that would break it.

Listeners, jobs and scheduled work also change data only by running
actions.

## History and proof

The log answers "who changed this?" for a year, without SQL.

- Every entry in `action_log` keeps who ran the action, through which
  channel and which token, and the device: for a session a short name
  from the browser at sign-in, e.g. "Safari · iPhone", for an API token
  its name. The address of the client is not kept.
- For `actions.undo_days` (default 30) every change is complete and the
  action can be undone. After that `actions:prune`, and once an hour the
  scheduler, shortens the changes instead of deleting them: of an update
  only what changed, a JSON column as the paths that changed with their
  old and new value; of a delete the whole row, since it is the lost
  content; of an insert only table and id. A new draft is the exception:
  it is a copy of what was published then, so it keeps the paths it
  changed from that revision, like an update. Everything goes with the
  entry after `actions.log_days` (default 365).
- Every migration leaves an entry `system.migrate` by the system with
  package, version and description. A migration that rewrites content
  changes each row with `updateRow()`, so the change shows in the history
  like any other:

  ```php
  $this->updateRow('acme_shop_products', $id, ['body' => $old], ['body' => $new]);
  ```

- `page.history` lists the entries of one page, newest first, with each
  change resolved to language, block and field and its old and new value,
  publishing, discarding and the scheduler included. It needs `page.show`
  and filters by block, path and language. Each change also carries
  `blockTitle` and `field` in the language of the person asking (e.g.
  "Teaser" and "Slides › Title") and `oldText` and `newText` as short
  plain text, so an app or the AI can show it as it is. `action.log`
  lists the whole log with filters by user, action (`page.*`), channel,
  status and time, for roles with the permission `action.log`.
- The backend shows the latest changes on the page, the whole history
  under **History** and the log under **Log**; in the edit mode the clock
  at a block opens its history.
- A module offers the same for its objects with `Action\History`: it
  collects the entries that changed a set of rows, also rows that are
  deleted by now, and `Action\RowDiff` compares two states of a row.

## Errors

An action throws, the API answers with `application/problem+json`:
`422` for invalid input with a pointer to each field, `401` without
sign-in, `403` without the right, `404` for something missing, `409`
for a conflict. `503` with the code `busy` and `Retry-After` means that
something else holds what the action needs right now, e.g. a locked
database or another step of a sync: the same call a moment later
works. Throw `Action\BusyException` for that.

See the [reference of all actions and queries](../reference/actions.md)
and [your first module](../tutorials/first-module.md).
