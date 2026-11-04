# Headings

A screen reader user jumps from heading to heading, a search engine
reads the outline. Both need one `h1` per page and levels without gaps.
In a CMS where editors stack blocks freely, no template can know its
level: the same teaser is an `h2` on one page and an `h3` inside a
section on another.

So in Frootbox no block or layout writes `<h1>` to `<h6>`. It says
which of its headings is the main one, and the core works out the level
from where the block stands.

```twig
{{ heading('title', 0, {class: 'teaser__title'}) }}     {# the main heading of the block #}
{% for item in field('items') %}
  {{ item.heading('question', 1) }}                    {# one rank below #}
{% endfor %}
{{ heading_text(article.title, 1, {}, article.url) }}  {# a title from data, as a link #}
```

- **Rank 0** is the main heading of the block, 1 and deeper are below it.
- The **page title** of the layout is the `h1`. A block on the page
  starts at `h2`, a block inside a section with its own heading one
  deeper.
- An **empty heading** gives nothing and does not count, so the levels
  below it move up.
- On the address of an object (an article, a job), the object's title is
  the `h1`, not the layout's.

Style headings with classes, never with `h2 { … }`: the level is the
outline, the class is the look.

The rule holds for every default and every option an editor can choose:
the outline and the layout are always right, without anybody thinking
about it.
