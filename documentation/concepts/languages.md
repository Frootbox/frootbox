# Languages

Languages are part of the core. Every field of a block can be
translated, every page has an address per language.

```yaml
# config/app.yaml
languages:
  de: { title: Deutsch }                       # the default, no prefix
  en: { title: English }                       # /en/…
  fr: { title: Français, fallback: false }     # no page without a translation
  nl: { title: Nederlands, domain: '%env(DOMAIN_NL)%' }   # a domain of its own
```

- The **first language** is the default and has no prefix.
- Others get their code as **prefix** (`/en/about-us`) or a **domain**.
- **Slugs are translated:** `/ueber-uns` and `/en/about-us` are the same
  page.
- Where a page has no translation, it shows the content of the default
  language (**fallback**), with `lang` and `dir` of that content, unless
  the language says `fallback: false`.
- Languages written from right to left (Arabic, Hebrew) get `dir="rtl"`;
  the base theme uses logical properties, so the layout mirrors itself.

In templates:

```twig
{{ language() }}            {# the language of the visitor #}
{{ content_language() }}    {# the language of the content, e.g. on a fallback #}
{% for item in alternates() %}…{% endfor %}   {# the page in every language #}
{{ t('Skip to content') }}  {# a text of the theme in the language of the page #}
```

Block controllers read texts in `$context->contentLanguage`.

The backend has its own language per user, independent of the website.
