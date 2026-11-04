<!-- Written by bin/frootbox reference:build from the code. Do not edit. -->

# Twig functions

Functions for the templates of blocks, layouts and partials, with an
example each. A block prints its fields with `field()` and its headings
with `heading()`, never with a fixed `<h1>` to `<h6>`: the core works out
the level from the place of the block.

| Example | What it gives |
|---|---|
| `{{ field('title') }}` | the field, ready for output |
| `{{ field('image', 'caption') }}` | one part of a field, e.g. caption or copyright of an image |
| `{{ heading('title') }}` | the field as a heading at the level of its place |
| `{{ item.heading('question', 1) }}` | a heading one rank below the main one |
| `{{ value('button').url }}` | the stored value |
| `{{ area('columns') }}` | the blocks placed in an area |
| `{{ render_block('frootbox/forms/Form', {form: id}) }}` | another block inside this one, with its options |
| `{{ url('page:01J…') }}` | the URL of a target in the visitor's language |
| `{{ url(value('button')) }}` | the URL of a link field |
| `{{ object_field(job, 'gallery') }}` | a further field of an object, declared under "object: fields:" |
| `{% if object_value(job, 'noContactDetails') %}` | its stored value, e.g. a switch |
| `{% for fact in object_facts(entry) %}` | the fields of its space with a value, e.g. from the backend of a collection |
| `{{ language() }}` | the language of the visitor, e.g. "en" |
| `{{ content_language() }}` | the language of the content, e.g. "de" on a fallback |
| `{{ direction() }}` | the writing direction of the visitor's language, "ltr" or "rtl" |
| `{{ content_direction() }}` | the one of the content |
| `<p{{ content_attributes()\|attributes }}>` | lang and dir of the content where they differ from the page |
| `{{ site_field('address') }}` | a field of the website, the same on every page |
| `<p{{ site_attributes('address')\|attributes }}>` | lang and dir of a field of the website from the first language |
| `{{ site_value('brand') }}` | its stored value |
| `{% for item in alternates() %}` | the page in all languages, for a language switcher |
| `{{ t('Skip to content') }}` | a text of the theme in the language of the page |
| `<section{{ {id: jump_mark()}\|attributes }}>` | the id of the block's jump mark, null without one |
| `{% for mark in jump_marks() %}` | the jump marks of the page, each with id and label |
| `{% if editing() %}` | shown for editing, e.g. a hint where visitors see nothing |
| `{{ external('acme/video/youtube', html, {link: url, title: 'Video: …', ratio: '16/9'}) }}` | content of another provider, loaded only after consent |
| `{{ privacy_settings() }}` | the button to change that consent, e.g. in the footer |
| `{{ video_embed(url, {title: 'Video: …'}) }}` | a video at YouTube or Vimeo behind consent, nothing for other addresses |
| `{{ map_embed({coordinates: '50.9, 6.9', address: '…', provider: 'openstreetmap', zoom: 16, title: 'Map: …'}) }}` | a map of OpenStreetMap or Google Maps behind consent |
