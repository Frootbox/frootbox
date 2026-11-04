---
title: Erweiterungen
---
**Erweiterungen** zeigt, was außer dem Kern installiert ist: Module wie
News oder Formulare, Themes und die Pakete dieser Website. Zu jeder
stehen die Version und was sie mitbringt, etwa Blöcke, Aktionen,
Einstellungen und eigene Tabellen. **Aktives Theme** kennzeichnet das
Theme der Website und seine Eltern.

Eine installierte Erweiterung ist aktiv. Wer die Website entwickelt,
fügt eine per Composer im Ordner der Website hinzu. Bringt sie Tabellen
mit, nennt die Karte **Datenbank** die ausstehenden Migrationen, und
**Jetzt aktualisieren** führt sie nach einem Backup aus, wie
`php bin/frootbox migrate` in der Konsole. Ist vorher kein Backup
möglich, sichere die Datenbank selbst und nimm **Ohne Backup
aktualisieren**. Das Dashboard weist auf ausstehende Migrationen hin.
**Weitere offizielle Module** nennt die Module von Frootbox, die hier
nicht installiert sind, je mit ihrem Befehl für Composer. **Auf …
Seiten** zeigt, wo die Blöcke und Layouts einer Erweiterung stehen. Schau dort nach, bevor Du sie entfernst.

Fehlt eine Erweiterung, deren Blöcke noch auf Seiten stehen, nennt
**Fehlende Blöcke und Layouts** sie mit den Seiten dazu. Die Seiten
bleiben bearbeitbar und behalten die Blöcke unverändert. Besucher sehen
von einem fehlenden Block nichts, im Bearbeitungsmodus steht dort
„Block fehlt“ und lässt sich entfernen. Fehlt das Layout einer Seite,
zeigt sie das erste Layout des Themes. Kommt die Erweiterung zurück, ist
alles wieder da.
