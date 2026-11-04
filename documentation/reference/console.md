<!-- Written by bin/frootbox reference:build from the code. Do not edit. -->

# Console commands

Run them with `php bin/frootbox <command>`, `php bin/frootbox help <command>`
shows the same. The Doctrine commands `migrations:*` are there as well,
for details such as status or rollback.

## `about`

Shows version, environment and database state

```
php bin/frootbox about
```

## `actions`

Lists all actions and queries, or shows the input schema of one

```
php bin/frootbox actions [<name>]
```

| Argument or option | Description |
|---|---|
| `name` | Show the input schema of this action or query |

## `actions:log`

Shows the latest actions: who, what, when, and whether they can be undone

```
php bin/frootbox actions:log [options]
```

| Argument or option | Description |
|---|---|
| `--limit` | Number of entries |

## `actions:prune`

Deletes old undo data and old log entries

```
php bin/frootbox actions:prune
```

## `assets:publish`

Publishes the assets/ folders of all packages to public/assets

```
php bin/frootbox assets:publish
```

## `backup:create`

Makes a backup of the database that stays until it is deleted

```
php bin/frootbox backup:create
```

## `backup:list`

Lists the backups of the database, newest first

```
php bin/frootbox backup:list
```

## `backup:prune`

Thins out old backups like Time Machine

```
php bin/frootbox backup:prune
```

## `backup:restore`

Restores a backup of SQLite after a backup of the current state

```
php bin/frootbox backup:restore <name>
```

| Argument or option | Description |
|---|---|
| `name` | The backup, as backup:list shows it |

## `blocks`

Lists the available blocks and layouts with their variants

```
php bin/frootbox blocks
```

## `blocks:check`

Checks schemas, overrides and Twig syntax of all blocks and layouts

```
php bin/frootbox blocks:check
```

## `cache:clear`

Empties var/cache, e.g. after deploying changed templates

```
php bin/frootbox cache:clear
```

## `call`

Runs an action or query by name with JSON input

```
php bin/frootbox call <name> [<input>]
```

| Argument or option | Description |
|---|---|
| `name` | Name of the action or query, e.g. page.create |
| `input` | Input as a JSON object |

## `extension:check`

Checks an extension package: names, migrations, blocks and licenses

```
php bin/frootbox extension:check [options] [--] [<target>]
```

| Argument or option | Description |
|---|---|
| `target` | A folder with composer.json and frootbox.yaml, or the name of an installed package |
| `--json` | Print the reports as JSON |
| `--strict` | Count hints as errors, e.g. in CI |

## `extensions`

Lists the installed extensions in load order

```
php bin/frootbox extensions
```

## `fb1:analyze`

Lists what a website of Frootbox 1 uses and proposes a mapping

```
php bin/frootbox fb1:analyze [options] [--] <database>
```

| Argument or option | Description |
|---|---|
| `database` | The database of Frootbox 1, e.g. pdo-mysql://user:secret@localhost/old?charset=utf8mb4 |
| `--files` | The folder of the installation below files/, to check the uploads |
| `--mapping` | Write a proposed mapping to this file (never overwrites) |

## `fb1:import`

Writes a website of Frootbox 1 as a seed, by the mapping

```
php bin/frootbox fb1:import [options] [--] <database>
```

| Argument or option | Description |
|---|---|
| `database` | Address of the database of Frootbox 1, e.g. pdo-mysql://user:secret@localhost/old?charset=utf8mb4 |
| `--files` | The folder of the installation below files/, with uploads/ |
| `--mapping` | The mapping file |
| `--out` | The folder for the seed, written anew |
| `--publish` | Publish pages, navigations, forms and fields at the end, instead of leaving drafts |

## `install`

Sets up this installation: configuration, database and the first superuser

```
php bin/frootbox install [options]
```

| Argument or option | Description |
|---|---|
| `--env` | prod for live operation, dev for development |
| `--database-url` | e.g. pdo-mysql://user:secret@localhost:3306/frootbox, by default SQLite in storage/ |
| `--admin-email` | Email of the first superuser, by default from FROOTBOX_ADMIN_EMAIL |
| `--admin-name` | Name of the first superuser, by default from FROOTBOX_ADMIN_NAME or the part before the @ |

## `make:extension`

Creates a new project extension in extensions/

```
php bin/frootbox make:extension [options] [--] <name>
```

| Argument or option | Description |
|---|---|
| `name` | Composer package name, e.g. acme/website |
| `--title` | Title shown in the backend |
| `--theme` | Create a child theme instead of an extension with a class |
| `--parent` | Parent of the theme, the package name of an installed theme |

## `media:prune`

Removes old uploads and originals no longer used

```
php bin/frootbox media:prune
```

## `media:usages`

Builds the index of where media are used anew

```
php bin/frootbox media:usages
```

## `migrate`

Runs all pending migrations of the core and all extensions

```
php bin/frootbox migrate [options]
```

| Argument or option | Description |
|---|---|
| `--no-backup` | Migrate without a backup of the database before |

## `queue:run`

Runs the jobs of the queue that are due

```
php bin/frootbox queue:run [options]
```

| Argument or option | Description |
|---|---|
| `--seconds` | Start no new job after this many seconds |
| `--limit` | Run at most this many jobs |

## `reference:build`

Writes the reference for developers from the code of the installed packages

```
php bin/frootbox reference:build [options]
```

| Argument or option | Description |
|---|---|
| `--output` | The folder, relative to the project |
| `--check` | Write nothing, fail if the folder is behind |

## `schedule:run`

Publishes and takes offline what is due, then runs the queue; run it every minute from cron

```
php bin/frootbox schedule:run [options]
```

| Argument or option | Description |
|---|---|
| `--queue-seconds` | Start no new job of the queue after this many seconds, 0 for none |

## `search:rebuild`

Builds the index of the global search anew, of one source or of all

```
php bin/frootbox search:rebuild [options] [--] [<source>]
```

| Argument or option | Description |
|---|---|
| `source` | Only this source, e.g. "page" |
| `--website` | The published entries for the search on the website instead |

## `seed`

Runs the actions of a YAML file, e.g. to create demo content

```
php bin/frootbox seed <file>
```

| Argument or option | Description |
|---|---|
| `file` | Path of the file, or vendor/package:path in an extension |

## `storage:check`

Tries writing, reading and deleting in both stores

```
php bin/frootbox storage:check
```

## `storage:pull`

Copies the files in the bucket of STORAGE_DSN into storage/

```
php bin/frootbox storage:pull [options]
```

| Argument or option | Description |
|---|---|
| `--dry-run` | Only show what would be copied |

## `storage:push`

Copies the files in storage/ into the bucket of STORAGE_DSN

```
php bin/frootbox storage:push [options]
```

| Argument or option | Description |
|---|---|
| `--dry-run` | Only show what would be copied |

## `user:create`

Creates a user and asks for the password

```
php bin/frootbox user:create [options] [--] <email>
```

| Argument or option | Description |
|---|---|
| `email` | Email address to sign in with |
| `--name` | Display name, by default the part before the @ |
| `--role` | Role name, e.g. admin; repeat for more |
| `--no-password` | Create the user without a password |

## `user:token`

Creates an API token for a user

```
php bin/frootbox user:token [options] [--] <email>
```

| Argument or option | Description |
|---|---|
| `email` | Email address of the user |
| `--name` | What the token is for |
| `--days` | Valid for this many days, without it until revoked |
