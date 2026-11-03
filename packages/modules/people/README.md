# frootbox/people

People and locations for the Frootbox CMS: keep the team and the
locations in the backend and show them with the blocks **Team**
(`frootbox/people/People`), **Contact person** (`frootbox/people/Person`)
and **Location** (`frootbox/people/Location`).

## Data

People and locations have drafts and versions like pages. They live
only in `revisions` (types `frootbox/people/person` and
`frootbox/people/location`); the website shows the published versions.

- A person: title before the name, given and family name, email, phone,
  photo, locations, order in the team and, by language, role and a few
  sentences.
- A location: address, phone, email, coordinates for the map, an image
  and, by language, name, opening hours and a few sentences.

## Actions and queries

`frootbox/people/person.create`, `.update`, `.publish`, `.discard`,
`.delete`, the queries `.list`, `.show` and `.choices`, and the same
for `frootbox/people/location`. The role "editor" gets
`frootbox/people/*` on installation.

## On the website

The block **Location** shows the map with `map_embed()` of the core, so
it loads only after consent, and adds the address as structured data
(schema.org `Place`). Texts come in the language of the page, else in
the first one.

## Demo

    php bin/frootbox seed frootbox/people:demo/people.yaml

adds a café and a roastery, four people and a page "Team" below the
start page.

## License

MIT
