---
title: reCAPTCHA
permission: frootbox/forms/form.show
order: 60
---
**reCAPTCHA** by Google protects your forms against spam. It is an
option next to the captchas of the forms and loads only at a form that
uses it, once the visitor agrees.

## Set it up

1. Register your domain in the admin console of reCAPTCHA at Google and
   choose a version:
   - **v2** shows the box "I am not a robot",
   - **v3** is invisible and rates the visitor from 0 (bot) to 1
     (person).
2. Enter the version, the **site key** and the **secret key** under
   **Settings**, **reCAPTCHA**. The keys belong to the version you chose.
3. Choose **reCAPTCHA** in the tab **Spam protection** of a form, or as
   the standard in the settings of the forms. Until both keys are set,
   you cannot choose it.

## On the website

At the form, visitors first see a note with a button. Only then the
script of Google loads. Without it the form cannot be sent; the error
says why. With v2 visitors tick the box, with v3 they notice nothing.

With v3, an entry rated below the **lowest score** (standard 0.5) goes
to the spam folder instead of being lost. So does an entry while Google
cannot be reached.
