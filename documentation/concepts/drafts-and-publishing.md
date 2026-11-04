# Drafts and publishing

Nothing changes on the live website by accident. Every change of a page,
a navigation, the fields of the website or an object of a module goes
into a **draft**. Visitors see the published version until someone
publishes the draft, at once or at a planned time.

- Drafts may be unfinished. Required fields and minimum counts are
  checked when publishing.
- Each publication becomes a **version**. An older version can be
  brought back into the draft and published again.
- `page.schedule` plans when a draft goes live and when a page goes
  offline. The cron job `schedule:run` publishes on time, and every
  request checks for something due, so a missed cron run delays nothing.
- Changes made by the AI land in drafts as well and wait for a person.
- A **preview link** shows the draft to someone without an account,
  e.g. a client.

Under the hood drafts and versions are snapshots in the table
`revisions`; the tables of the content hold only what is published. IDs
are ULIDs from the start, so a draft can be referenced before it exists
live.

Modules with objects (news, events, jobs) follow the same pattern: a
draft per object in `revisions`, and actions to update, publish and
discard it.

When the address of a published page changes, the old address answers
with a permanent redirect (301) to the new one by itself.
