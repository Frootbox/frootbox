# frootbox/backend

The backend of the Frootbox CMS: the screens behind `backend.path`
(default `/cms`), the sign-in and the building blocks of its user
interface. It holds no business logic; every screen reads through queries
and changes data through actions, like the REST API.

## Setup

Installed with the CMS. Two settings in `config/app.yaml`:

```yaml
backend:
  path: /cms        # where the backend lives; its first segment is reserved as slug
  language: de      # language of the user interface; default: the first language of the website
```

## For extensions

```php
use Frootbox\Backend\Brand;
use Frootbox\Backend\Screen;

public function register(Registry $registry): void
{
    // A screen in the sidebar, under the address of the backend.
    $registry->mount('backend.path', '/cms')
        ->get('/acme/orders', OrdersHandler::class, 'acme.orders');
    $registry->add(Screen::class, new Screen('Orders', 'acme.orders', Screen::CONTENT, 'inbox', 'acme/shop/order.list'));

    // CSS for the backend and JavaScript modules for the import map.
    $registry->asset('assets/css/orders.css', 'backend');
    $registry->import('@acme/orders', 'assets/build/orders.js');

    // A brand of your own (white label).
    $registry->add(Brand::class, new Brand('Acme CMS', logo: __DIR__ . '/../assets/logo.svg'));
}
```

Views live in `views/` of the extension and are found as
`@acme/shop/orders.twig`. Texts are English and translated in
`translations/<language>.yaml`, with the English text as key.

[DESIGN.md](DESIGN.md) has every rule of the user interface: tokens,
grid, building blocks with their sizes and states, accessibility and
texts. The design page at `<backend.path>/design` shows them live.

## Development

CSS in `assets/css/` is plain CSS without a build. JavaScript in
`resources/js/` is built with Vite into `assets/build/`, which is
committed. From the root of the monorepo:

```bash
npm install
npm run watch      # rebuild on change, reload the page
npm run build      # before a commit; CI fails if assets/build is behind
npm run lint:css   # only tokens, no fixed colors or lengths
composer design-doc  # after changing tokens.yaml
```

Values for colors, spaces and sizes come only from
[`tokens.yaml`](tokens.yaml).

## License

LGPL-3.0-only. Lit (BSD-3-Clause) and htmx (0BSD) are bundled in
`assets/build/`.
