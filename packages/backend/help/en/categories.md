---
title: Categories
about: [screen:backend.categories, action:category.create, action:category-group.create]
permission: category.update
order: 45
---
Categories sort news, events, jobs and more, and visitors can filter the
lists by them. Each module brings its own group, e.g. **Categories of
the news**. An admin can add groups of their own, e.g. "Department" for
jobs and events.

## Tree

Categories can lie below others, e.g. "Latte Art" below "Courses". Drag
a category by its handle to another place or below another one. A list
filtered by a category also shows what lies in the categories below it.

Click a category to change its name, address or description in each
language. A badge shows the languages it is still missing in. Deleting
a category also deletes the ones below it; the news, events and jobs
stay.

## Choose

Every form of a module shows its groups with their categories. Tick the
categories that fit. A published entry shows its categories on the
website as soon as you publish it again.

## Presets

A developer can set out categories in `config/categories.yaml`, also
for the groups of the modules. They are created on their own, and a
badge marks them. If one is missing, e.g. after you deleted it, the
screen offers to apply the presets again.
