# frootbox/news

News for the Frootbox CMS: articles with drafts, versions and planned
publishing, categories, tags, an RSS feed and two blocks for any theme.

- **News** (`frootbox/news/ArticleList`) is the view of the plugin: a page that shows a space of the news lists its
  articles at `plugin()`, page by page, filtered by category
  (`?category=`), tag (`?tag=`) and year (`?year=`). Each published article gets an
  address below that page, e.g. `/news/new-varieties`; there the view
  shows the article. An admin assigns the space with `plugin.assign`.
- **Newest articles** (`frootbox/news/ArticleTeaser`) shows the latest
  few of all spaces or of one, optionally only those with a tag (also an
  internal one, e.g. `featured`), with a link to the list.

The feed of a list lives at `/_news/feed/<page id>/<language>.xml` and is
announced in the head of that page.

## Actions and queries

Everything goes through actions, also from the REST API and the AI:
`frootbox/news/article.create`, `.update`, `.publish`, `.unpublish`,
`.schedule`, `.discard`, `.delete`, the queries `frootbox/news/article.list`
and `.show`. Categories are the ones of the core in the
group `frootbox/news/categories`: `category.create` with that group, `.update`,
`.move`, `.delete` and `category.list`; the actions take `categories` as
a list of their ids. Tags are the common stock of the core: the actions take `tags` as ids, keys or labels, and new words
become tags unless `config/tags.yaml` closes the list for
`frootbox/news/article` or the space. The role "editor" gets `frootbox/news/*` on
installation.

Further fields: a view of the theme declares them under
`object: fields:` in its header, e.g. an override of `ArticleList`, and
the actions take them as `fields`; `object.fields` with the type
`frootbox/news/article` lists them. The form in the backend shows them under
"More fields". In the editing mode editors change them right on the page
(`object.update-field`), and the editor bar publishes the article with the page.

## In a template

```twig
<a href="{{ url('frootbox/news/article:' ~ id) }}">…</a>
{{ object_field(article, 'subtitle') }}  {# a further field, article as the view gets it #}
```

## Backend

With `frootbox/backend` installed, the screens "News" and "Categories"
appear in the sidebar.

## Source and issues

This package is developed in the [Frootbox monorepo](https://github.com/Frootbox/frootbox)
and mirrored here read-only. Questions, bugs and ideas go there, see the
[documentation](https://github.com/Frootbox/frootbox/tree/main/documentation).

## License

MIT
