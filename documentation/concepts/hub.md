# The hub: connecting to frootbox.de

A website can connect to the hub, Frootbox Hub at
`https://hub.frootbox.de`. An agency then sees the state of all its
websites in one place: versions, cron, backups, drafts. The website
decides what the hub may do, and nothing is sent before a superuser
connects.

## Connecting

In the backend under **Administration, Connection**:

1. **Connect** opens a request at the hub and sends the browser there.
   The hub shows the address and name of the website from the stored
   request, never from the URL.
2. You sign in, choose the organization and confirm.
3. The hub checks that the server at the address holds the key of the
   website, then sends the browser back with a one-time code.
4. **Complete the connection** redeems the code.

For automatic deployment, or a website the hub cannot reach yet, make a
code in the account area and run:

```bash
php bin/frootbox hub:connect K7Q2-M9XD
```

The hub confirms the address later, once it can reach the website.

## A new installation

After a migration from Frootbox 1, or when a website is set up again
with a fresh database, the new installation has a key of its own.
Connect it as usual. When the hub already knows a website at the same
host and port in one of your organizations, the confirmation page offers
to continue that entry instead of adding a second one. The entry keeps
its id, customer, carers, log and status history; key, system, address
and the access to the status are new. The old installation is not told,
since the new one answers at its address now, and it can change nothing
at the hub afterwards.

For a new address, or to connect from the console, open the website in
the hub and choose **Connect a new installation**. The code continues
this entry:

```bash
php bin/frootbox hub:connect K7Q2-M9XD
```

For a migration: build the new website, switch the domain, then connect
from the new backend and continue the entry. In between, the hub cannot
read the status and reports the website as unreachable. Turn off the
status of the old installation first if you want to avoid those mails.

## What the hub sees

With the switch **status** on, the website creates a service account
whose role may only ask the query `status.show`, and gives the hub its
token. The hub reads `GET /api/v1/status.show` as often as it likes:
versions of Frootbox, PHP, the database and each extension, the last run
of cron, waiting and failed jobs, the last backup, free disk space,
drafts, open comments, the time of the last change and how mails leave
the server (`mail.transport` and `mail.source`, without server or
account). No names, emails, content or addresses of pages. The screen **Connection** shows exactly
this document and when the hub last read it.

## The schedule without cron

Webspace often has no cron job with a console. Without one, scheduled
publishing, backups, statistics and the queue run only when visitors
come. When the status of a connected website shows no own cron job
(`cron.lastRun` missing or older than ten minutes), the hub asks it every
five minutes to run its schedule, with a signed `POST
/.well-known/frootbox/tick`. The website answers `202` at once and works
after the response: what is due, then the queue for up to 20 seconds.
The hub does not wait for that. Such a run is noted apart from cron, as
`cron.lastTick` in the status, so the hub keeps asking. As soon as an
own cron job runs, the website answers `{"accepted": false}` and the hub
stops asking. Without the hub nothing changes: cron or visitors run the
schedule as before.

Turning the status off deletes the service account at once, its token
stops working. **Disconnect** deletes the access too and forgets the
keys of the hub, whether or not the hub can be told.

## Signing in through the hub

With the switch **Let people sign in through the hub** on the page
Connection, people sign in to the backend with their account at the hub,
by OpenID Connect. The sign-in page then shows **Sign in with
frootbox.de** above email and password. The password always stays, so
the website never depends on the hub: if it cannot be reached, a local
superuser signs in as before.

- **Roles stay local.** The hub says which standard role a person has on
  this website (`editor`, `admin` or `superuser`); the website takes at
  most the **highest role** chosen with the switch, `admin` unless chosen
  otherwise. `superuser` only on purpose: whoever takes over your account
  at the hub is then superuser of this website.
- **Accounts managed by the hub** are made at the first sign-in, or as
  soon as someone gives access in the hub. Their role follows the hub on
  every sign-in and message; taking access away locks the account and
  ends its sessions, it is never deleted. A local account with the same
  email is never opened by signing in: an admin links it in the hub, or
  its owner links it under **Your account**. A linked account keeps its
  roles and its password; it cannot sign in through the hub with more
  rights than the hub may give.
- **The first step stays on the website.** After switching on, link your
  own account once from the page Connection. Then the website knows you,
  and what you give in the hub works here, with your rights on the
  website.
- **Sessions** through the hub end 12 hours after signing in
  (`auth.provider_session_hours`), even while used. The backend then goes
  to the hub once without asking (`prompt=none`) and comes back to the
  same place; signing out on the website stops that. The hub ends
  sessions at once over the back channel, e.g. when someone leaves the
  team.
- Switching off or disconnecting ends all sessions through the hub at
  once. The links stay, so switching on again creates nobody anew. A copy
  of the website has no connection and so no sign-in through the hub.

## Local websites

A website at a local address (`localhost`, names ending in `.localhost`
or `.test`, private IP addresses) does not connect to the hub on the
internet: the hub could not reach it. Connect it live or on staging.
To develop against a hub running on your computer, point `hub.url` in
`config/app.yaml` to it; a local hub takes local websites.

The connection belongs to the installation, not to the content. A copy,
e.g. from `workbench build --with-content` or a backup restored on
another server, must not keep it, or two installations would share one
key. The workbench leaves it out; after restoring a backup elsewhere run:

```bash
php bin/frootbox hub:disconnect --local --forget-key
```

## The protocol

"frootbox.de Connect v1" is plain HTTPS with JSON; a Frootbox 1 module
speaks it as well. Paths carry the version, errors are
`application/problem+json`, and both sides ignore fields they do not
know.

**Keys.** Each website has an Ed25519 key pair, made when it first
connects; the secret key is encrypted with `APP_SECRET`, so a website
without it cannot connect. The hub has key pairs of its own, published at
`{hub}/.well-known/frootbox/keys` and read over TLS when connecting. Keys
are written as in Standard Webhooks: `whpk_` and `whsk_` with the base64
of the raw 32 bytes.

**Signatures.** Every request between the two, except reading the
status, is signed after [Standard Webhooks](https://www.standardwebhooks.com/)
in the asymmetric form `v1a`: headers `webhook-id`, `webhook-timestamp`
and `webhook-signature` over `<id>.<timestamp>.<body>`. The time may be
five minutes off, each `webhook-id` counts once. `Security\StandardWebhooks`
signs and verifies both forms.

**The website calls the hub:**

| Request | Body | Answer |
|---|---|---|
| `POST /connect/v1/requests` | `url`, `name`, `system` {`name`, `version`}, `publicKey`, `switches` {`status`, `packages`, `login`}, `return` | `id` of the request, valid 15 minutes |
| `POST /connect/v1/requests/<id>/complete` | `code`, `status` {`url`, `token`} or null | `connection`, `organization` |
| `POST /connect/v1/codes/<code>` | as a request, and `status` | `connection`, `organization` |
| `PATCH /connect/v1/connections/<id>` | `switches`, and only what changed: `status`, `login` {`redirectUri`, `logoutUri`, `initiateUri`, `maxRole`} or null | 204 |
| `DELETE /connect/v1/connections/<id>` | | 204 |
| `POST /connect/v1/connections/<id>/prices` | `provider`, the package of the AI provider | `provider`, `updatedAt`, `models` [{`id`, `input`, `output`, `cacheRead`, `cacheWrite`}] in US dollars per million tokens, signed with a key of the hub; empty for a provider the hub does not know |

The browser goes to `{hub}/connect/<id>` and comes back to `return` with
`?request=<id>&code=<code>`.

**The hub calls the website,** each signed with a key of the hub:

| Request | Body | Answer |
|---|---|---|
| `POST /.well-known/frootbox/verify` | `id` of the open request or the connection, `challenge` (16 to 128 characters of base64url) | `signature`: the `v1a` signature of `frootbox-connect-verify-v1:<id>:<challenge>` with the key of the website |
| `POST /.well-known/frootbox/disconnect` | `connection` | 204 |
| `POST /.well-known/frootbox/keys` | `keys`, the new list, signed with a current key | 204 |
| `POST /.well-known/frootbox/tick` | `connection` | 202 with `accepted`: whether it runs the schedule after the response (not with an own cron job) |
| `POST /.well-known/frootbox/access` | `connection`, `actor` {`sub`, `role`}, `person` {`sub`, `email`, `email_verified`, `name`}, `role` or null | 200 with `result` (`created`, `linked`, `updated`; `blocked`, `unlinked`, `none` for null), 404 if the website does not know the actor, 403 without the rights, 409 if the actor ranks above what the hub may give |

The text the website signs for `verify` has no dots, so it can never pass
as a webhook. These routes run past the password of a protected website,
like the REST API.

**Signing in** is OpenID Connect with the hub as issuer, its discovery at
`{hub}/.well-known/openid-configuration`. The client id is the id of the
connection; the website authenticates at the token endpoint with
`private_key_jwt`, an assertion signed with `EdDSA` and the key of the
connection, so there is no client secret. Authorization Code with PKCE
(`S256`), `state` and `nonce`; the ID token brings `sub`, `email`,
`email_verified`, `name`, `sid` and `hub_access` {`role`, `organization`}.
Nothing else is kept: no access token, no refresh token, no UserInfo.

| Address on the website | For |
|---|---|
| `{backend.path}/login/oidc/hub` | the way back (`redirectUri`) |
| `{backend.path}/login/oidc/hub/start` | the start from the hub, with `iss` (`initiateUri`) |
| `POST /_oidc/hub/logout` | Back-Channel Logout 1.0 with `logout_token`, 200 or 400 (`logoutUri`) |

Logout tokens carry `sid` (the sessions of one sign-in) or `sub` (all
sessions of the person through the hub), are at most five minutes old and
count once. Sessions with a password stay.

## In code

Actions `system.hub-connect`, `system.hub-complete`, `system.hub-switch`,
`system.hub-disconnect` and `system.hub-keys`, the query
`system.hub-show`, for superusers only; the classes are in `Hub\`.

Signing in is general: `Auth\Oidc\` holds the client, the hub is only its
first provider (`Hub\HubLogin`). The actions `account.oidc-start`,
`account.oidc-complete`, `account.oidc-link`, `account.oidc-unlink` and
`account.oidc-logout`, `user.grant-access` and `user.revoke-access`, the
queries `account.oidc-providers`, `account.oidc-identities` and
`user.identities`. Links live in the table `user_identities`. An
extension adds providers with
`$registry->add(OidcProviders::class, new OidcProviders(Source::class))`
and a `ProviderSource`. See
the [reference of actions](../reference/actions.md).

Go on with [deployment](deployment.md).
