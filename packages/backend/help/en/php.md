---
title: PHP
about: [screen:backend.php, query:system.php-info]
permission: system.php-info
order: 130
---
**PHP** under Administration shows how PHP is set up on the server,
much like `phpinfo()`: the version, the interface to the web server,
the loaded php.ini, OPcache, the most important settings and every
loaded extension with its settings. A setting that differs from the
php.ini, e.g. because of a `.htaccess`, is marked **Changed** and shows
both values. The search finds extensions and settings by name, e.g.
`upload` for the largest file a visitor may upload.

Environment variables, the request and cookies are not shown, and
values that sound like a password or key appear as `***`. So there is
no need for a file with `phpinfo()` on the server, which anyone could
open.
