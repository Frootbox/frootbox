# frootbox/captcha-recaptcha

reCAPTCHA by Google as a captcha for the forms of the
[Frootbox CMS](https://github.com/Frootbox/frootbox) (`frootbox/forms`):

- Version 2 with the box "I am not a robot" or version 3 with a score,
  set in the settings "reCAPTCHA" with the site key and the secret key
- Selectable for a form, or as the standard of the website, only once
  both keys are set (`ConfigurableCaptcha`)
- The markup sits behind the consent of the visitor (`external()`, the
  service `frootbox/captcha-recaptcha/recaptcha`); the script of Google
  loads only at the form, once per page, in the language of the form
- The server checks the token with `siteverify`, without the address
  of the visitor. No token or a failed v2 is an error at the captcha; a
  v3 score below the lowest score, a token of another action or Google
  out of reach puts the entry in the spam folder

It is also an example for other providers: a `CaptchaProvider` with
`widget()` and `verify()`, registered as a `Captcha` with a `service`,
and the events `frootbox:forms-sending` and `frootbox:forms-failed` of
the forms in the browser.

MIT licensed.
