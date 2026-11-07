# Delivery and caching

## Fast for guests

Live (`APP_ENV=prod`), a guest gets each page from a **full-page cache**:
the HTML is built once and then delivered without database queries.
Every action that changes what visitors see empties it, including the
actions of modules that write through a repository; drafts don't. After
a deployment with changed templates,
run:

```bash
php bin/frootbox cache:clear
```

A block whose output depends on the request, e.g. search results, tells
the core not to cache the page (`Delivery::withoutCache()`), otherwise
every query would fill the cache.

A block that shows data from another system, which changes without an
action in Frootbox (a calendar of bookings, stock), keeps the page in the
cache for a while only: `Delivery::cacheFor(300)`. The shortest time of
all blocks on the page counts; after it the next visitor gets a fresh
page.

Visitors never cause writes to the database. A module that records
something per visit, like statistics, appends lines to files in `var/`
and counts them into its tables on the next scheduled run.

## Visitors with a session

A cart or a signed-in customer needs a session. `Visitor\VisitorSession`
keeps values per package for the visitor of the current request:

```php
$session->set('acme/shop', 'cart', ['p1' => 2]);
$session->get('acme/shop', 'cart');
$session->regenerate(); // a new cookie on sign-in and sign-out
```

The cookie `fb_visitor` (HttpOnly, SameSite=Lax) only comes with the
first value, after something the visitor did, never from just looking at
a page. A session ends 30 days after the last request or when its last
value is removed. A visitor with a session gets every page without the
cache, marked `private, no-store`. Requests with an access token (REST
API, MCP) have no session. Encrypt secrets yourself with
`Security\Secrets` before you store them.

## Live for editors

Signed-in users with the right to edit get the page without the cache,
with the **editor bar** at the bottom. **Edit** switches to the edit
mode on the website itself: click a text to change it, add, move and
remove blocks, see the draft as it will look.

## Development mode

With `APP_ENV=dev` there is no cache at all: templates, schemas,
manifests and styles are read again on every request. Change a file,
reload the page.

## Addresses

When the address of a published page changes, the old one answers with
a 301 to the new one. Further redirects are kept in the backend under
**Redirects**; addresses that were not found are listed there too.
