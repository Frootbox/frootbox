# MCP: AI clients

Every Frootbox website is an [MCP](https://modelcontextprotocol.io)
server at `/api/mcp`. Claude, ChatGPT and other programs that speak MCP
work with the website through the same actions and queries as the
backend, with the rights of the person whose token they use. No module
is needed.

## Connecting a client

1. Create an access token for your account with
   `php bin/frootbox user:token you@example.com --name "Claude"` or the
   action `account.create-token`. For a program that runs on its own,
   use a service account (`user.create-token`).
2. Add the server to the client with the address and the header:

```json
{
  "mcpServers": {
    "my-website": {
      "type": "http",
      "url": "https://www.example.com/api/mcp",
      "headers": { "Authorization": "Bearer fbx_…" }
    }
  }
}
```

In Claude Code:

```bash
claude mcp add --transport http my-website https://www.example.com/api/mcp --header "Authorization: Bearer fbx_…"
```

Only a Bearer token signs in. Without one the endpoint answers `401`.
Clients that can only sign in with OAuth cannot connect yet.

## Tools

The tools are the actions and queries the person may run. Actions meant
for visitors (signing in, sending a form) are left out. A tool's name is
the name of the action with `_` for `.` and `__` for `/`, because many
models only accept letters, digits, `_` and `-`:

| Action or query | Tool |
|---|---|
| `page.create` | `page_create` |
| `frootbox/news/article.update` | `frootbox__news__article_update` |

The title of a tool is the original name, its description and input
schema come from the action. Queries are marked `readOnlyHint`. Actions
that a person should confirm are marked `destructiveHint`: publishing,
deleting, everything about users, roles, settings, extensions and the
system, preview links, and every action that cannot be undone. Changes to
drafts are not; they stay invisible to visitors until someone publishes
them. An action sets this itself with `#[AsAction(confirm: true)]` or
`confirm: false`.

Clients ask the person before a tool runs. The hints help them ask for
the right ones.

## Results and errors

A tool returns the result of the action as JSON, as text and as
`structuredContent.data`. After an action that can be undone, the
result names the entry in the action log, so the model can take it back:
`structuredContent.undo` is `{"tool": "action_undo", "arguments": {"id": 350}}`.

Errors the model can fix come back as a result with `isError: true`:
invalid input with every field, a missing right, something not found.
An unknown tool is a JSON-RPC error. Everything runs through the runner
on the channel `mcp`, so `bin/frootbox actions:log` shows who did what
through MCP.

## The protocol

- Streamable HTTP, one JSON-RPC message per `POST`, one JSON answer.
  No sessions, no streams, nothing that keeps running on the server, so
  it works on ordinary web space. `GET` answers `405`.
- The protocol version 2026-07-28, with `server/discover`, the protocol
  fields in `_meta` of every request and the headers `MCP-Protocol-Version`,
  `Mcp-Method` and `Mcp-Name`, which must match the body.
- Older clients (2025-03-26 to 2025-11-25) start with `initialize`; they
  get an answer without a session and work the same way.
- Batches are not supported. A request with an `Origin` header must come
  from the website's own host.

See [actions and queries](actions-and-queries.md) and
[users, roles and rights](rights.md).
