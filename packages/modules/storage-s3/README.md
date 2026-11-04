# frootbox/storage-s3

S3-compatible storage for the [Frootbox CMS](https://github.com/Frootbox/frootbox):
keep media and files from forms in a bucket instead of the web space, and
let browsers load public media from there. Works with any service that
speaks S3 and Signature Version 4, e.g. Hetzner Object Storage, IONOS,
Cloudflare R2, Wasabi, Backblaze B2, AWS or a self-hosted gateway.

## Set up

Create two buckets: one private for data, one public for what browsers
load. Never use one bucket for both: originals, drafts and files from
forms must not be public. Then set in the `.env`:

```
STORAGE_DSN="s3://<key>:<secret>@fsn1.your-objectstorage.com/site-data?region=fsn1"
PUBLIC_STORAGE_DSN="s3://<key>:<secret>@fsn1.your-objectstorage.com/site-media?region=fsn1&url=https://media.example.org"
```

Key and secret are URL-encoded (`/` is `%2F`, `+` is `%2B`). Options:

| Option | Meaning |
|---|---|
| `region` | The region of the service, default `us-east-1` (R2: `auto`) |
| `url` | Public store only: the address for browsers, best your own subdomain or a CDN; default the address of the bucket |
| `path_style=1` | The bucket in the path instead of the host, e.g. for MinIO or a gateway |
| `prefix` | Before every key, for several websites in one bucket |
| `acl` | Public store only, e.g. `public-read` for a service without public buckets |
| `scheme=http` | Only for a test server on your own machine |

Each variable works alone: only `STORAGE_DSN` moves the originals and
keeps the generated sizes in `public/media/`.

Move the files there and check both stores:

```
bin/frootbox storage:push --dry-run
bin/frootbox storage:push
bin/frootbox storage:check
```

`storage:push` copies `storage/media/` and `storage/private/forms/`,
only what is missing. Sizes of images are generated again in the public
bucket. Once the website works, `storage/media/`, `storage/private/forms/`
and `public/media/` (but not `public/media/fonts/`) can go.

## How it works

- Addresses stay `/media/<id>/<version>/…`. The first request generates
  a size, stores it in the public bucket with
  `Cache-Control: public, max-age=31536000, immutable` and marks it
  below `var/storage/marks/`. Pages then get the address in the bucket;
  an old address in a cached page answers with 302 to the bucket.
- Videos and documents are copied into the public bucket on their first
  request, within the service if both buckets share it; the bucket
  answers Range itself.
- Drafts, media that are not public yet and files from forms come only
  through PHP, after the check of permissions.
- Images, SVG and videos need a file on disk now and then. Copies lie in
  `var/storage/` and go after a day without use.
- Uploads in parts, fonts, backups and `var/` stay on the web space.

## Good to know

- **Backup:** files in a bucket are not part of a backup of the web
  space. Turn on versioning at the service, or copy them back now and
  then with `bin/frootbox storage:pull`.
- **Privacy:** visitors load public media from the server of the
  service, which sees their IP address. The service processes data for
  you like your host: you need a data processing agreement, best with a
  service in the EU.
- **Normal web space:** only outgoing HTTPS is needed, with or without
  cURL.

MIT licensed.
