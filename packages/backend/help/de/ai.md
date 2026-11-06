---
title: KI
---
**KI** zeigt, welcher Anbieter für die KI der Website antwortet, was sie
in einem Monat gekostet hat und wie viel vom monatlichen Limit übrig ist.
Die Seite erscheint, sobald ein Anbieter installiert ist, z. B.
Anthropic.

## Einrichten

1. Hinterlege den API-Schlüssel des Anbieters unter **Einstellungen**
   beim Anbieter.
2. Lege unter **Einstellungen**, **KI** ein **monatliches Limit in
   US-Dollar** fest. Erreichen die Kosten des Monats es, pausiert die KI
   bis zum nächsten Monat. Die Website läuft weiter wie bisher, nur die
   KI fehlt.
3. Wähle **Verbindung testen**. Sie schickt einen kurzen Satz und zeigt
   die Antwort, die Tokens und was sie gekostet hat.

## Wer sie nutzen darf

Admins dürfen die KI nutzen. Für andere Rollen ergänze unter **Rollen**
das Recht `ai.use`. Die KI handelt mit den Rechten der Person, die sie
fragt: Sie kann nichts ändern, was diese Person nicht ändern könnte.

## Kosten

Jede Anfrage zählt mit ihren Tokens und den Preisen ihres Modells, nach
Tag, Funktion, Person und Modell. Du bezahlst den Anbieter direkt; die
Zahlen hier sind eine Schätzung nach seinen Listenpreisen.

**Preise** zeigt, woher sie kommen: vom Hub bei einer Website, die mit
frootbox.de verbunden ist, er hält sie aktuell, sonst aus dem Modul des
Anbieters oder für einen eigenen Vertrag aus `config/app.yaml`.

## Datenschutz

Zum Anbieter geht nur, was eine Funktion schickt, z. B. der Text, an dem
Du arbeitest, nie die ganze Website. Nenne den Anbieter in Deiner
Datenschutzerklärung als Auftragsverarbeiter.
