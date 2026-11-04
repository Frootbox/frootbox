# Agency test theme

A design of an agency, `design/index.html`, built as a child theme of the
base theme. The browser tests (`tests/e2e/agency.spec.ts`) compare both
pixel for pixel, wide and narrow. It is never shipped.

Its journal, a page with the news, shows the articles in markup of its
own (`overrides/frootbox/news/blocks/ArticleList/`) with two further
fields, a subtitle and a plan.
`tests/e2e/object-fields.spec.ts` edits them on the website.

Third-party files, only here:

- `assets/reset.css` is Bootstrap 5.3.3 under the MIT licence, see
  `assets/LICENSE.bootstrap`. As the reset of the child it lies in the
  lowest layer, so the blocks always win and its grid still works.
- `assets/fonts/lora-*.woff2` is Lora from `@fontsource/lora` under the
  SIL Open Font License 1.1, see `assets/fonts/OFL.txt`.
