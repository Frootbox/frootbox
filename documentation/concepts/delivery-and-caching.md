# Delivery and caching

## Fast for guests

Live (`APP_ENV=prod`), a guest gets each page from a **full-page cache**:
the HTML is built once and then delivered without database queries.
Every publication empties it. After a deployment with changed templates,
run:

```bash
php bin/frootbox cache:clear
```

A block whose output depends on the request, e.g. search results, tells
the core not to cache the page (`Delivery::withoutCache()`), otherwise
every query would fill the cache.

Visitors never cause writes to the database. A module that records
something per visit, like statistics, appends lines to files in `var/`
and counts them into its tables on the next scheduled run.

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
