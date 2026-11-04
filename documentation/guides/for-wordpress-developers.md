# Frootbox for WordPress developers

You know WordPress: themes, child themes, plugins, hooks, shortcodes,
custom fields, Gutenberg. Most of it has a counterpart in Frootbox,
often stricter. This page maps the terms and says where Frootbox works
differently, and why.

## The terms

| WordPress | Frootbox | Notes |
|---|---|---|
| Plugin | Extension (module) | A Composer package with a `frootbox.yaml`. Installed means active. |
| Theme | Theme | An extension with `theme:` in its manifest. |
| Child theme | Child theme | Same idea: a file with the same path replaces the parent's. Tokens change colours and fonts without CSS. |
| Gutenberg block | Block | A folder with a Twig view and a schema. Editors arrange finished blocks, there is no free layout editor. |
| Block pattern | Seed file, block examples | Seeds create whole pages, `examples:` fill the design page. |
| Shortcode | Block, or `render_block()` | A block can contain another one with its options. |
| Custom fields, ACF | Fields in the block schema | `fields:` with types like `headline`, `richtext`, `image`, `link`, `list`. The schema is the form. |
| Options page | Site fields, settings | Content on every page is a site field; configuration of a module is a settings class. |
| Custom post type | Table of a module, plugin block | A module brings its own tables; a plugin block gives its objects addresses below a page. |
| Taxonomy | Categories and tags | In the core, for pages and objects of modules. |
| `add_action()` | Event listener | `$registry->listen(ActionExecuted::class, …)` runs after every action, e.g. after `page.publish`. Listeners change data only through actions. |
| `add_filter()` | An event with an object to change, or an override | E.g. `BuildingHead` for tags in the head of every page. |
| `wp_ajax_*`, REST routes | Actions and queries | Every action is a REST endpoint by itself. |
| Capabilities, roles | Rights and roles | One right per action, roles with levels, optionally per branch of the site tree. |
| `wp-config.php` | `config/app.yaml` and `.env` | Configuration in Git, secrets in `.env`. |
| WP-CLI | `bin/frootbox` | Plus `call` to run any action or query. |
| Revisions | Drafts and versions | Every change goes into a draft and is published on purpose. |
| Cron | `schedule:run` | One cron entry every five minutes; due publishing is also checked on each request. |
| `wp_enqueue_style()` | `assets/` of a block | A block's CSS and JS load only on pages with the block. |
| Must-use plugin | Extension in `extensions/` | Packages of the website itself live in the project. |

## What works differently

**There is one way to change data.** WordPress lets plugins write to
the database anywhere: in a hook, a template, an AJAX handler. In
Frootbox every change is an action with a name, a description, an input
schema and a right. The backend, the REST API, the console, the AI and
the app all use the same actions. So every change is checked, logged and
can be undone, and a module's REST API exists the moment its actions do.
See [Actions and queries](../concepts/actions-and-queries.md).

**Editors don't build layouts.** Gutenberg lets editors put anything
anywhere. Frootbox blocks are finished designs with options the
developer allows. Editors work faster and can't break the design, the
outline or accessibility. See [Blocks and fields](../concepts/blocks-and-fields.md).

**Headings are not written into templates.** A block says "this is my
main heading" with `heading('title')`, and the core decides whether it
is an `h2` or an `h3` from where the block stands. See
[Headings](../concepts/headings.md).

**Drafts first.** Saving never changes the live website. Changes,
including those of the AI, land in a draft and go live when someone
publishes them, at once or at a time.

**No database writes for visitors.** Visitors get pages from a full-page
cache. A module that records something per visit (statistics) appends to
files and counts them later.

**No build chain on the server.** Write plain CSS and JS in `assets/`.
The core puts CSS into cascade layers by origin and delivers it per
block. Composer runs on your computer; the web space gets the finished
folder with `vendor/`.

**Composer packages, not zip files.** Extensions are installed with
Composer and namespaced by their package name: actions
`acme/shop/order.create`, blocks `acme/shop/ProductList`, tables
`acme_shop_…`. Two extensions never collide.

**Consent is built in.** Content of other servers (videos, maps,
scripts) loads only after the visitor agrees, through `external()`,
`video_embed()` and `map_embed()`. See [Consent](../concepts/consent.md).

## From a theme to a child theme

| You did | Do now |
|---|---|
| Copy `header.php` into the child theme | Copy `partials/header.twig` into `extensions/<your theme>/partials/` |
| Customizer colours | Tokens in `frootbox.yaml`, editable in the edit mode |
| `get_template_part()` | `{% include '@theme/footer.twig' %}` |
| `the_field('address')` in the footer | `{{ site_field('address') }}`, declared under `theme: fields:` |
| A page template | A layout: `layouts/<Name>/views/Default.twig` with its areas |
| Echoing an `<h1>` | `{{ heading('title') }}` |

Start with [A website from a design](../tutorials/website-from-a-design.md).

## From a plugin to a module

| You did | Do now |
|---|---|
| `register_post_type()` and meta boxes | A migration, an entity, a repository and actions |
| `register_rest_route()` | Nothing: actions and queries are the API |
| `add_menu_page()` | A `Screen` and a route in the backend |
| `update_option()` | A settings class with `#[AsSettings]` |
| `wp_schedule_event()` | `$registry->scheduled()` or a job on the queue |
| `$wpdb->query()` | A repository; no database-specific SQL |

Start with [Your first module](../tutorials/first-module.md).
