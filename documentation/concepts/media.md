# Media and files

## The library

Images, videos and documents live in the media library of the backend,
with folders, tags, alternative text, copyright and an optional label
for images made by AI. Fields of the types `image`, `video` and `file`
choose from it.

An image field gives a responsive `<picture>` in the sizes the layout
needs. An image labelled as made by AI is wrapped in
`<span class="ai-image">` with a badge, so select images with
`.teaser :is(picture, img)`, never with `> picture`.
`{{ image_credits() }}` lists the copyright of the images on a page.

## Where files are

| Folder | What |
|---|---|
| `storage/media/` | the originals, never served directly |
| `storage/private/` | protected files, e.g. uploads from forms, delivered only by PHP after a check of rights |
| `public/media/` | sizes made from the originals and copies of published files, can be made again |
| `public/assets/` | the `assets/` folders of the packages, published by `assets:publish` |

With the module `frootbox/storage-s3`, originals and private files go
into a private bucket and the public sizes into a public one, delivered
from there:

```bash
STORAGE_DSN="s3://key:secret@fsn1.your-objectstorage.com/site-data?region=fsn1"
PUBLIC_STORAGE_DSN="s3://key:secret@fsn1.your-objectstorage.com/site-media?region=fsn1&url=https://media.example.org"
```

SVG files are delivered with a policy that keeps anything in them from
running.
