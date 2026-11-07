---
title: PHP
---
**PHP** unter Verwaltung zeigt, wie PHP auf dem Server eingerichtet
ist, ähnlich wie `phpinfo()`: die Version, die Schnittstelle zum
Webserver, die geladene php.ini, OPcache, die wichtigsten
Einstellungen und jede geladene Erweiterung mit ihren Einstellungen.
Weicht eine Einstellung von der php.ini ab, etwa wegen einer
`.htaccess`, steht **Geändert** daneben, und Du siehst beide Werte.
Die Suche findet Erweiterungen und Einstellungen nach Namen, etwa
`upload` für die größte Datei, die jemand hochladen darf.

Umgebungsvariablen, die Anfrage und Cookies erscheinen nicht, und
Werte, die nach Passwort oder Schlüssel klingen, stehen als `***` da.
Eine Datei mit `phpinfo()` auf dem Server, die jeder aufrufen könnte,
brauchst Du also nicht.
