---
title: Log
about: [screen:backend.log, query:action.log]
permission: action.log
order: 125
---
The **Log** lists every action on the website, newest first: who ran
it, when, through which channel (website and backend, REST API, MCP,
AI, console, scheduler) and on which device. It also shows what was
not allowed, had an invalid input or failed. Updates of the database
appear as "Update of the database".

Filter by person, action, channel, status and days. An action ending
in `*` finds all of a kind, e.g. `page.*`. Steps that run inside another
action stay hidden unless you ask for them.

Entries are kept for a year (`actions.log_days` in `config/app.yaml`).
Superusers see the log; give other roles the right `action.log`.
