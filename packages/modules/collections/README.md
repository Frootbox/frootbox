# frootbox/collections

Collections for the Frootbox CMS (decision 0246): entries of the same
kind such as references, projects or show homes, with drafts, versions
and planned publishing, an image, a position, categories, tags, further
fields and two blocks for any theme.

Each collection is a space of the plugin `frootbox/collections/entry`
(decision 0232). The first one is the default space; name it under
"Spaces" in the backend or with `space.update` (`id: "default"`,
`type: "frootbox/collections/entry"`), e.g. "References". Further ones
come with `space.create`.

- **Collection** (`frootbox/collections/EntryList`) is the view of the
  plugin: a page that shows a collection lists its entries as cards at
  `plugin()`, filtered by category (`?category=<slug>`, with the
  categories below it, or the page of the category) and tag
  (`?tag=<slug>`) without a script. Each published entry gets an
  address below that page, e.g. `/references/house-by-the-lake`; there
  the view shows the image and the text, and the form chosen in its
  options (`form`, from `frootbox/forms`) for requests.
- **Entries of a collection** (`frootbox/collections/EntryTeaser`) shows
  a few entries of all collections or of one, optionally only of a
  category or with a tag, with a link to the list.

The order: a smaller position (`order`, default 0) first, with the same
position the newest first (first published). Entries have no tables:
drafts and published versions live in `revisions`.

## Actions and queries

Everything goes through actions, also from the REST API and the AI:
`frootbox/collections/entry.create`, `.update`, `.publish`, `.unpublish`,
`.schedule`, `.discard`, `.delete` and the queries
`frootbox/collections/entry.list`, `.show`, `space.choices` and
`category.choices`. Categories are the ones of the core (decision 0233)
in the group `frootbox/collections/categories`; the actions take
`categories` as a list of their ids. Tags are the common stock of the
core (decision 0239): the actions take `tags` as ids, keys or labels,
and new words become tags unless `config/tags.yaml` closes the list for
`frootbox/collections/entry` or the collection. Roles can hold within a
collection (decision 0245). The role "editor" gets
`frootbox/collections/*` on installation.

Further fields (decision 0240): a view of the theme declares them under
`object: fields:` in its header, e.g. an override of `EntryList` with
the year and the client of a reference, and the actions take them as
`fields`; `object.fields` with the type `frootbox/collections/entry`
lists them. The form in the backend shows them under "More fields". In
the editing mode editors change them right on the page
(`object.update-field`), and the editor bar publishes the entry with
the page (decision 0241).

## In a template

```twig
<a href="{{ url('frootbox/collections/entry:' ~ id) }}">…</a>
{{ object_field(entry, 'client') }}  {# a further field, entry as the view gets it #}
```

## Backend

With `frootbox/backend` installed, the screen "Collections" appears in
the sidebar at `/cms/collections`, with a tab for each collection.

## License

MIT
