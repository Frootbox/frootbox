# Settings, secrets, jobs and events

## Where configuration lives

| What | Where | Who writes it |
|---|---|---|
| Structure: languages, theme, address | `config/app.yaml` | the developer, in Git |
| Settings of extensions as files | `config/extensions/<vendor>/<package>.yaml` | the developer, in Git |
| Secrets, database, environment | `.env` | the server, never in Git |
| Settings in the backend | the database, through actions | admins |

## Settings of an extension

```php
#[AsSettings('Specials', 'How the specials are shown')]
final readonly class SpecialsSettings
{
    public function __construct(
        #[Title('Currency sign')]
        public string $currency = '€',
        #[Sensitive]
        #[Title('API key of the till')]
        public string $tillKey = '',
    ) {}
}
```

Register it with `$registry->settings(SpecialsSettings::class)` and let
the container inject it anywhere. Its values come from
`config/extensions/acme/specials.yaml` first, then from the backend
(**Settings**), then from the defaults. Fields marked `#[Sensitive]` are
stored encrypted with `APP_SECRET` and never shown again. A package can
have more settings classes with a `section:`.

Settings that reach another service can offer a test. Name a class with
`test:` that implements `Settings\ConnectionTest`; the container makes
it, so it gets the settings injected:

```php
#[AsSettings('Specials', 'How the specials are shown', test: TillConnection::class)]
final readonly class SpecialsSettings { /* … */ }

final readonly class TillConnection implements ConnectionTest
{
    public function __construct(private SpecialsSettings $settings, private Till $till) {}

    public function run(): Message
    {
        if ('' === $this->settings->tillKey) {
            throw new ConnectionFailed('Store the API key of the till first.');
        }

        return new Message('The till answers with {count} products.', ['count' => $this->till->count()]);
    }
}
```

The card of the settings then shows **Test the connection**, which runs
the action `settings.test` with the stored values. The test only reads:
it never books, sends or stores anything. Whatever it throws is its
answer with `ok: false`, e.g. a certificate that is not trusted.

## Jobs

Work that takes time, like sending mails or calling another service,
goes to the queue:

```php
#[AsJob('acme/specials/till.sync', 'Sends the specials to the till')]
final readonly class SyncTill { … }
```

A job is built like an action, registered with `$registry->job()` and
pushed with `Queue::push()`, or with `Queue::pushOnce()` unless one of
the same name waits already. It runs with the rights of whoever pushed
it, and changes data only through actions. Long work runs in short
steps, each its own action: a job steps for some seconds and pushes the
next one, so a request without a cron is not held up and the database
is never locked for long. `schedule:run` works the
queue after the scheduled tasks; `queue:run` works it alone.

## Events

```php
$registry->listen(ActionExecuted::class, NotifyKitchen::class);
```

- `ActionExecuted` after every action, with its name, input and result.
- `ScheduleRan` after every run of the scheduler, e.g. to clean up.
- `BuildingHead` while the head of a page is built, to add tags.

Listeners are loaded only when their event fires. They change data only
through actions.

## Mails

Mails go through `Mail\Mailer` or the job `mail.send`: over `MAILER_DSN`
in `.env`, else over the SMTP server set in the backend, else with
`mail()` of PHP. In development mode they go to the log.

## Logs

`var/log/<environment>-<date>.log`, through `Psr\Log\LoggerInterface`.
