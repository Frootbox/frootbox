# frootbox/google-fonts

Google Fonts for the [Frootbox CMS](https://github.com/Frootbox/frootbox),
without loading anything from Google on the website:

- The query `frootbox/google-fonts/catalog.search` searches the catalog
  of Google Fonts, kept a day in `var/cache/`
- The action `frootbox/google-fonts/font.import` copies a family once:
  variable files where the font has them, only WOFF2, only the scripts
  the languages of the website need, kept in `storage/fonts/` and
  published to `public/media/fonts/`
- Imported fonts appear in the design next to the fonts of the theme,
  with a fallback by their kind and the Latin file preloaded
- `frootbox/google-fonts/font.delete` removes a font the design does
  not use, `frootbox/google-fonts/font.list` lists them
- The screen "Fonts" in the backend

Only the server talks to Google, and only when an admin searches or
imports.

MIT licensed. The fonts keep their own licences, mostly the SIL Open
Font License.

## Source and issues

This package is developed in the [Frootbox monorepo](https://github.com/Frootbox/frootbox)
and mirrored here read-only. Questions, bugs and ideas go there, see the
[documentation](https://github.com/Frootbox/frootbox/tree/main/documentation).
