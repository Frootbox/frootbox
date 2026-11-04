# Consent

Nothing loads from another server before the visitor agrees, and the
core needs no cookie for it. A video from YouTube, a map from Google, a
statistics script: each is a **service** that an extension registers
with its provider, purpose and reach.

```php
$registry->add(ExternalService::class, new ExternalService(
    'acme/stats/matomo', 'Matomo', 'Acme Hosting GmbH', 'https://acme.example/privacy',
    Purpose::Statistics, Reach::Site,
));
```

## In templates

```twig
{{ external('acme/video/service', html, {title: 'Video: …'}) }}   {# loads at its place after a click #}
{{ video_embed(url, {title: 'Video: …'}) }}                         {# YouTube and Vimeo #}
{{ map_embed({address: '12 Mill Lane, Northwind', provider: 'openstreetmap'}) }}
{{ privacy_settings() }}                                             {# the button to change the choice #}
```

Never put an iframe or a script of another server into a template
directly. The core registers YouTube, Vimeo, OpenStreetMap and Google
Maps itself.

## Scripts on every page

A script for every page goes into the head inactive, e.g. from a
listener on `BuildingHead`:

```php
$event->head->add($consent->deferred('acme/stats/matomo', '<script src="…"></script>'));
```

Then the core shows a banner with "Reject all", "Settings" and "Accept
all" of equal weight, only where such a script stands and the visitor
has not decided yet.

## Look and other tools

Placeholder, dialog and banner are partials of the core in
`partials/consent/`; a theme overrides them file by file. In the
browser, `window.frootboxConsent` tells `allowed(name)`, takes
`set({name: true})` and `open()`, and fires `frootbox:consent` on
`document` after each change. A consent tool of another provider takes
over through the same interface as a module of its own; the query
`consent.services` lists every service, so a tool needs no scanner.

An optional setting keeps a proof of each choice with a random ID and
the time, without address or browser.
