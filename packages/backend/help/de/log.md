---
title: Protokoll
---
Das **Protokoll** listet jede Aktion auf der Website, die neuesten
zuerst: wer sie wann ausgeführt hat, über welchen Kanal (Website und
Backend, REST-API, MCP, KI, Konsole, Zeitsteuerung) und auf welchem
Gerät. Es zeigt auch, was nicht erlaubt war, eine ungültige Eingabe
hatte oder fehlschlug. Aktualisierungen der Datenbank erscheinen als
„Aktualisierung der Datenbank“.

Filtere nach Person, Aktion, Kanal, Status und Tagen. Eine Aktion mit
`*` am Ende findet alle einer Art, etwa `page.*`. Schritte innerhalb
einer anderen Aktion bleiben verborgen, außer Du fragst danach.

Einträge bleiben ein Jahr (`actions.log_days` in `config/app.yaml`).
Superuser sehen das Protokoll, anderen Rollen gibst Du das Recht
`action.log`.
