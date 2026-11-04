---
title: Settings
about: [screen:backend.settings, action:settings.update, action:settings.set-secret, action:mail.test]
permission: settings.list
order: 110
---
Extensions such as a shop or a newsletter keep their options and access
data under **Settings**. Secrets such as an API key are stored
encrypted and never shown again; you can only replace or remove them.
A value that the developer set in the configuration of the project is
locked here.

## Privacy

Under **Privacy** you decide how visitors agree to services of other
providers, such as videos, maps or statistics:

- **Consent tool**: when a module of a consent tool is set up, it asks
  instead of the website. With several, enter the name of the one to use.
- **Keep a proof of consent**: keeps every choice of a visitor with a
  random ID, without address or browser. A visitor finds the ID in the
  privacy settings of the website, so you can look it up later.
- **Keep proofs**: how many days, 1095 (three years) as standard.

The website asks with a banner only when a service loads on every page.
Content such as a video asks at its place.

## Email

Under **Email** you set how the website sends mails, e.g. the entries
of forms. Without an SMTP server they go out with mail() of PHP, which
works on most web servers but often lands in spam.

- **Sender**: the address mails come from, best the one of the SMTP
  account, e.g. info@example.org.
- **SMTP server** and **Port**: from your mail provider, usually port
  587. Port 465 is encrypted from the start.
- **User name** and **Password**: the access of the mailbox. The
  password is stored encrypted. With a user name the connection must be
  encrypted, so the password never goes over the network in clear text.

With **Send a test mail** a short mail goes out at once. If the server
refuses it, its error shows right there.

The card says how mails go out right now. The developer can set the
access in `.env` as `MAILER_DSN`, which goes before the settings here.
In development mode mails go to the log and reach nobody, so a copy of
a live website sends nothing.
