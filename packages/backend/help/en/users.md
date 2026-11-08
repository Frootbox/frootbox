---
title: Users and roles
about: [screen:backend.users, screen:backend.roles, action:user.create]
permission: user.list
order: 80
---
Every person who signs in has a user of their own. **Roles** bundle
what a user may do, e.g. an editor changes pages and media, an
administrator also users.

## Only a part of the website

A role can be given for a branch of the Sitemap only. Such a user sees
the way to their pages but changes nothing outside.

A role can also be given for one space of news, events, jobs or people,
e.g. only the jobs of the apprenticeships. Such a user sees only the
entries of that space, creates and publishes them there, but moves
nothing to another space.

## Disable instead of delete

A disabled user can no longer sign in; what they did stays known.

## Forgotten password

Under the sign-in, "Forgot your password?" mails a link to the email of
the account. It works for an hour and once, and after setting the new
password you are signed in, even after too many failed tries. Without
the address of the website in `app.url`, a secret in `APP_SECRET` or a
way for mails the link is missing; then an administrator sets a new
password under **Users**.

## Invitation

A new user can get an **invitation by mail** instead of a password from
you: they choose their password with the link, which works for 7 days.
As long as someone has no password, their page offers **Send an
invitation** again. The choice needs the same as a forgotten password.

## Your name and email

Under **Your account** everyone changes their own name and email. A new
email needs the current password and holds once you open the link in
the mail to it; the old address gets a note.
