# Users, roles and rights

## Rights

Every action and query has exactly one right, by default named like the
action (`page.publish`). A **role** is a set of rules over these names:

```
*                   everything
page.*              every action and query on pages
acme/specials/*     everything of a module
-page.delete        except this
```

## Levels

Roles have a level. The installation brings **superuser** (100),
**admin** (50) and **editor** (10); more can be created in the backend
under **Roles**. Nobody changes, undoes or assigns anything to someone
above them, so an admin can't make themselves superuser.

## Branches

A role can be given for a branch of the site tree only: a user who is
editor for "Kindergarten" may edit that page and the pages below it, and
nothing else. Actions that work on a page say which page they touch, so
the check is the same in the backend, the API and the console. Modules
with spaces (several news, several job boards) can scope a role to one
space the same way.

## Sessions and tokens

Users sign in with email and password. Sessions and API tokens share one
table; the REST API takes `Authorization: Bearer fbx_…`:

```bash
php bin/frootbox user:create jane@example.com --role editor
php bin/frootbox user:token jane@example.com --name "Deploy"
```

A forgotten password is mailed as a link from the sign-in page
(`<backend.path>/password`). `account.request-password-reset {email}`
answers the same whether the account exists or not and sends at most
three mails to an address within 15 minutes. The link works for 60
minutes and only once: it is signed over the current password hash, so
any change of the password voids it. `account.reset-password {token,
password}` sets the new password, ends all sessions and forgets failed
sign-ins. The link takes its address from `app.url`, never from the
request, so a website without `app.url`, `APP_SECRET` or a way for mails
offers no link (`account.password-reset-show`).

The AI acts with the rights of the user it works for.
