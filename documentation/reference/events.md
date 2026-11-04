<!-- Written by bin/frootbox reference:build from the code. Do not edit. -->

# Events

Events of the core that an extension can listen to:

```php
$registry->listen(ScheduleRan::class, PruneOldEntries::class);
```

The listener is a class with `__invoke()` that takes the event; it is
loaded only when the event fires. Listeners change data only through
actions.

## `ActionExecuted`

`Frootbox\Core\Action\ActionExecuted`

Fired after an action succeeded and its changes were saved, from the backend, the REST API, the console or a seed file alike, e.g. to clear caches or to tell other services. $descriptor->name is the name of the action, e.g. "page.publish", $action its input, $result what it gave.

| Property | Type |
|---|---|
| `$descriptor` | `Frootbox\Core\Action\Descriptor` |
| `$action` | `Frootbox\Core\Action\Action` |
| `$result` | `mixed` |
| `$context` | `Frootbox\Core\Action\Context` |
| `$entryId` | `int` |

## `BuildingHead`

`Frootbox\Core\View\BuildingHead`

Dispatched before the `<head>` of a page is written. The target says what is delivered, e.g. page:01J…:

```
$registry->listen(BuildingHead::class, AddFonts::class);
```

| Property | Type |
|---|---|
| `$head` | `Frootbox\Core\View\Head` |
| `$request` | `Psr\Http\Message\ServerRequestInterface` |
| `$target` | `?Frootbox\Core\Url\Target` |

## `ScheduleRan`

`Frootbox\Core\Schedule\ScheduleRan`

The scheduler ran, from cron or a page request, about once a minute. Extensions listen for work that is due now and then, e.g. deleting old form entries. A listener changes data only through actions run as the system and should look first whether anything is due at all.

| Property | Type |
|---|---|
| `$now` | `DateTimeImmutable` |
