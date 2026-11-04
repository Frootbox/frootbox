---
title: reCAPTCHA
---
**reCAPTCHA** von Google schützt Deine Formulare vor Spam. Es steht
neben den Captchas der Formulare zur Wahl und lädt nur an einem
Formular, das es nutzt, und erst, wenn der Besucher zustimmt.

## Einrichten

1. Melde Deine Domain in der Admin-Konsole von reCAPTCHA bei Google an
   und wähl eine Version:
   - **v2** zeigt das Kästchen „Ich bin kein Roboter“,
   - **v3** ist unsichtbar und bewertet den Besucher von 0 (Bot) bis 1
     (Mensch).
2. Trag die Version, den **Websiteschlüssel** und den **geheimen
   Schlüssel** unter **Einstellungen**, **reCAPTCHA** ein. Die Schlüssel
   gehören zur gewählten Version.
3. Wähl **reCAPTCHA** im Reiter **Spam-Schutz** eines Formulars oder als
   Standard in den Einstellungen der Formulare. Solange nicht beide
   Schlüssel eingetragen sind, lässt es sich nicht wählen.

## Auf der Website

Am Formular sehen Besucher zuerst einen Hinweis mit Knopf. Erst danach
lädt das Skript von Google. Ohne es lässt sich das Formular nicht
senden, der Fehler sagt, warum. Bei v2 setzen Besucher das Häkchen, bei
v3 merken sie nichts.

Bei v3 kommt eine Einsendung unter der **niedrigsten Punktzahl**
(Standard 0,5) in den Spam-Ordner, statt verloren zu gehen. Genauso
eine Einsendung, während Google nicht erreichbar ist.
