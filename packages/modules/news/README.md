# frootbox/news

News for the Frootbox CMS: articles with drafts, versions and planned
publishing, categories, an RSS feed and two blocks for any theme.

- **News** (`frootbox/news/ArticleList`) lists the articles page by page,
  filtered by category (`?category=`) and year (`?year=`). Each published
  article gets an address below the first page with this block, e.g.
  `/news/new-varieties`; there the block shows the article.
- **Newest articles** (`frootbox/news/ArticleTeaser`) shows the latest
  few with a link to the list.

The feed of a list lives at `/_news/feed/<page id>/<language>.xml` and is
announced in the head of that page.

## Actions and queries

Everything goes through actions, also from the REST API and the AI:
`frootbox/news/article.create`, `.update`, `.publish`, `.unpublish`,
`.schedule`, `.discard`, `.delete`, the queries `frootbox/news/article.list`
and `.show`, and `frootbox/news/category.create`, `.update`, `.delete`
and `.list`. The role "editor" gets `frootbox/news/*` on installation.

## In a template

```twig
<a href="{{ url('frootbox/news/article:' ~ id) }}">…</a>
```

## Backend

With `frootbox/backend` installed, the screens "News" and "Categories"
appear in the sidebar.

## License

MIT
