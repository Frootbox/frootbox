---
title: Einstellungen
---
Erweiterungen wie ein Shop oder ein Newsletter halten ihre Optionen und
Zugangsdaten unter **Einstellungen**. Geheimnisse wie ein API-Schlüssel
werden verschlüsselt gespeichert und nie wieder angezeigt; Du kannst
sie nur ersetzen oder entfernen. Ein Wert, den der Entwickler in der
Konfiguration des Projekts festgelegt hat, ist hier gesperrt.

## Datenschutz

Unter **Datenschutz** legst Du fest, wie Besucher Diensten anderer
Anbieter zustimmen, etwa Videos, Karten oder einer Statistik:

- **Consent-Tool**: Ist das Modul eines Consent-Tools eingerichtet, fragt
  es statt der Website. Bei mehreren trägst Du den Namen des Tools ein,
  das gelten soll.
- **Nachweis der Einwilligung aufbewahren**: bewahrt jede Wahl eines
  Besuchers mit einer zufälligen ID auf, ohne Adresse und Browser. Die ID
  findet der Besucher in den Datenschutz-Einstellungen der Website,
  damit Du sie später nachschlagen kannst.
- **Nachweise aufbewahren**: wie viele Tage, standardmäßig 1095 (drei
  Jahre).

Ein Banner zeigt die Website nur, wenn ein Dienst auf jeder Seite lädt.
Inhalte wie ein Video fragen an ihrer Stelle.

## E-Mail

Unter **E-Mail** legst Du fest, wie die Website Mails verschickt, etwa
die Einsendungen von Formularen. Ohne SMTP-Server gehen sie mit mail()
von PHP hinaus. Das klappt auf den meisten Webservern, landet aber oft
im Spam.

- **Absender**: die Adresse, von der Mails kommen, am besten die des
  SMTP-Kontos, z. B. info@example.org.
- **SMTP-Server** und **Port**: von Deinem Mail-Anbieter, meist Port
  587. Port 465 ist von Anfang an verschlüsselt.
- **Benutzername** und **Passwort**: der Zugang des Postfachs. Das
  Passwort wird verschlüsselt gespeichert. Mit Benutzername muss die
  Verbindung verschlüsselt sein, damit das Passwort nie offen durchs
  Netz geht.

Mit **Testmail senden** geht sofort eine kurze Mail hinaus. Lehnt der
Server sie ab, erscheint sein Fehler direkt dort.

Die Karte zeigt, wie Mails gerade hinausgehen. Der Entwickler kann den
Zugang in `.env` als `MAILER_DSN` setzen, das geht vor den Einstellungen
hier. Im Entwicklungsmodus landen Mails im Log und erreichen niemanden,
damit eine Kopie einer Live-Website nichts verschickt.
