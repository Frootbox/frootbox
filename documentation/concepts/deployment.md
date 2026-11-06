# Deployment

Frootbox runs on ordinary web space: PHP 8.5 and a database, no Composer,
no build tools and no running processes on the server. Composer runs on
your computer; the server gets the finished folder.

## The folder

Upload the project with `vendor/`, without `.git`, `var/`, `.env` and,
when updating, without `storage/` and `public/media/` (they hold the
content of the live website).

1. **The web server shows `public/`, it is the document root.** Never
   the project folder: it holds `.env` and the database.
   `https://<address>/.env` must give 403 or 404. A `.htaccess` in the
   project folder locks it on Apache when the document root is wrong.
   The `.htaccess` in `public/` also passes the header `Authorization`
   on to PHP, which Apache with PHP as FastCGI drops otherwise: without
   it, API tokens and the connection to the hub do not work.
2. Create `.env` on the server: `APP_ENV=prod`, `DATABASE_URL`,
   `APP_SECRET`. A new website runs `php bin/frootbox install` once.
3. Set `app.url` in `config/app.yaml`, it is required live.
4. The web server may write to `storage/` and `var/`.
5. A cron job runs `php bin/frootbox schedule:run` every five minutes:
   scheduled publishing, backups, the queue, statistics, mails. Without
   a console, connect the website to the hub with its status on: the
   hub then asks it to run every five minutes (see
   [the hub](hub.md#the-schedule-without-cron)). Otherwise visitors
   run it.

## Updates

```bash
php bin/frootbox migrate        # backs up the database first
php bin/frootbox cache:clear
```

Migrations only run forward. Read the Upgrade section of the
[changelog](../../CHANGELOG.md) before a new second digit (`0.1` to
`0.2`).

## Backups

The database is backed up automatically before the first action of each
day and before every `migrate`, in `storage/backups/`. `backup:create`,
`backup:list`, `backup:prune` and `backup:restore` (SQLite) manage them.
A full backup is the database, `storage/` and `.env`. Restored on
another server, it brings the connection to the hub along; see
[the hub](hub.md#local-websites).

## Mails

Set the SMTP server of your mailbox in the backend under **Settings,
Email**, or `MAILER_DSN` in `.env`, and send a test mail there.
