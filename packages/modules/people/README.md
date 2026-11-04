# frootbox/people

People and locations for the Frootbox CMS: keep the team and the
locations in the backend and show them with the blocks **Team**
(`frootbox/people/People`), **Contact person** (`frootbox/people/Person`)
and **Location** (`frootbox/people/Location`). People are a plugin:
a page can show a space of them, with a profile for each person if the
admin switches profiles on.

## Data

People and locations have drafts and versions like pages. They live
only in `revisions` (types `frootbox/people/person` and
`frootbox/people/location`); the website shows the published versions.

- A person: title before the name, given and family name, email, phone,
  photo, locations, order in the team and, by language, role and a few
  sentences. As a plugin also the space (chosen when the person is
  created), one slug for the profile in every language (from the name
  unless set), categories of the group `frootbox/people/categories`,
  tags and the further fields of the theme (`fields`).
- A location: address, phone, email, coordinates for the map, an image
  and, by language, name, opening hours and a few sentences.

## Actions and queries

`frootbox/people/person.create`, `.update`, `.publish` (with `ids`,
several at once), `.unpublish`, `.discard`, `.delete`, the queries
`.list` (optionally of one `space`), `.show` (with the addresses of the
profile) and `.choices`, and the same for `frootbox/people/location`
(its `.publish` takes one `id`). `frootbox/people/space.choices` and
`frootbox/people/category.choices` fill the options of the block Team.
The role "editor" gets `frootbox/people/*` on installation.

## On the website

A page that shows a space lists its people at `plugin()` with the view
`frootbox/people/PersonList`, filtered by category and tag
(`?category=`, `?tag=`). With profiles on, each published person has an
address below that page, e.g. `/team/maria-rossi`, with photo, role,
text, ways to reach the person, locations and structured data
(schema.org `Person`). The blocks **Team** and **Contact person** link
to the profile wherever they are; **Team** can show one space, one
category with the ones below it or the people with a tag. Further
fields of a theme can be edited on the website (`object_field()`).

The block **Location** shows the map with `map_embed()` of the core, so
it loads only after consent, and adds the address as structured data
(schema.org `Place`). Texts come in the language of the page, else in
the first one.

## Demo

    php bin/frootbox seed frootbox/people:demo/people.yaml

adds a café and a roastery, four people and a page "Team" below the
start page that shows them with profiles.

## Source and issues

This package is developed in the [Frootbox monorepo](https://github.com/Frootbox/frootbox)
and mirrored here read-only. Questions, bugs and ideas go there, see the
[documentation](https://github.com/Frootbox/frootbox/tree/main/documentation).

## License

MIT
