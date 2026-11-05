# The hub: connecting to frootbox.de

A website can connect to the hub, the account area at
`https://account.frootbox.de`. An agency then sees the state of all its
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

## What the hub sees

With the switch **status** on, the website creates a service account
whose role may only ask the query `status.show`, and gives the hub its
token. The hub reads `GET /api/v1/status.show` as often as it likes:
versions of Frootbox, PHP, the database and each extension, the last run
of cron, waiting and failed jobs, the last backup, free disk space,
drafts, open comments and the time of the last change. No names, emails,
content or addresses of pages. The screen **Connection** shows exactly
this document and when the hub last read it.

Turning the status off deletes the service account at once, its token
stops working. **Disconnect** deletes the access too and forgets the
keys of the hub, whether or not the hub can be told.

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
| `PATCH /connect/v1/connections/<id>` | `switches`, `status` | 204 |
| `DELETE /connect/v1/connections/<id>` | | 204 |

The browser goes to `{hub}/connect/<id>` and comes back to `return` with
`?request=<id>&code=<code>`.

**The hub calls the website,** each signed with a key of the hub:

| Request | Body | Answer |
|---|---|---|
| `POST /.well-known/frootbox/verify` | `id` of the open request or the connection, `challenge` (16 to 128 characters of base64url) | `signature`: the `v1a` signature of `frootbox-connect-verify-v1:<id>:<challenge>` with the key of the website |
| `POST /.well-known/frootbox/disconnect` | `connection` | 204 |
| `POST /.well-known/frootbox/keys` | `keys`, the new list, signed with a current key | 204 |

The text the website signs for `verify` has no dots, so it can never pass
as a webhook. These routes run past the password of a protected website,
like the REST API.

## In code

Actions `system.hub-connect`, `system.hub-complete`, `system.hub-switch`,
`system.hub-disconnect` and `system.hub-keys`, the query
`system.hub-show`, for superusers only; the classes are in `Hub\`. See
the [reference of actions](../reference/actions.md).

Go on with [deployment](deployment.md).
