---
title: Tags
about: [screen:backend.tags, action:tag.create, action:tag.merge]
permission: tag.update
order: 46
---
Tags are free words for news, events, jobs and more, e.g.
"Sustainability" or "Barista". All content shares one stock of tags,
so the same word links an article and an event. Visitors can filter a
list by a tag.

## Add tags

Every form of a module shows the tags in use and those set out for it.
Tick the ones that fit, or type new words, separated by commas. A tag
you type is found by its label in any language, so "Sustainability"
and "Nachhaltigkeit" end up as the same tag.

On some sites the tags of a module are a closed list: then you choose
only from the ones a developer set out in `config/tags.yaml`.

## Keep the stock tidy

Here you see every tag with its labels and how often it is used.

- **Edit** gives a tag a label in every language. A badge shows the
  languages it is still missing in.
- **Merge** turns two tags into one, e.g. "Bio" into "Organic". Typing
  the old word finds the new tag from then on.
- **Delete** removes a tag; the content stays.

An **internal** tag is never shown to visitors. It serves to choose
content, e.g. for a teaser, or as a switch in templates.
