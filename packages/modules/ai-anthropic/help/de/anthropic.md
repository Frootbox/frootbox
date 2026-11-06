---
title: Anthropic
---
**Anthropic** bringt Claude in die KI Deiner Website. Was die KI
verbraucht, bezahlst Du direkt bei Anthropic; die Seite **KI** zeigt,
was sie in diesem Monat gekostet hat.

## Einrichten

1. Lege in der Konsole von Anthropic unter
   [platform.claude.com](https://platform.claude.com) einen API-Schlüssel
   an und hinterlege dort eine Zahlungsart.
2. Speichere den Schlüssel unter **Einstellungen**, **Anthropic**,
   **API-Schlüssel**. Setzt der Server `ANTHROPIC_API_KEY` in der `.env`,
   gilt dieser.
3. Wähle bei Bedarf das Modell:
   - `claude-opus-5-5`, das beste und der Standard,
   - `claude-sonnet-5-5`, zum halben Preis,
   - `claude-haiku-5-5`, schnell und sehr günstig für kurze Texte.
4. Öffne **KI** und wähle **Verbindung testen**. Sie schickt einen kurzen
   Satz und zeigt die Antwort und was sie gekostet hat.

## Was zu Anthropic geht

Nur, was eine Funktion der KI schickt: der Text oder das Bild, an dem Du
arbeitest, und die Anweisungen der Funktion. Anthropic trainiert seine
Modelle nicht damit. Nenne Anthropic in Deiner Datenschutzerklärung als
Auftragsverarbeiter.

Lehnt Claude Opus oder Sonnet eine Anfrage ab, antwortet Anthropic mit
dem Modell, das es dafür empfiehlt. Beide Modelle zählen bei den Kosten.
