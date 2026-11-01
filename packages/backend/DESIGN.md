# Design system of the backend

The rules for every screen of the Frootbox backend, for people and for
agents. The design page at `<backend.path>/design` (default `/cms/design`)
shows every building block live, light and dark side by side. Screenshot
tests compare it with approved images, so a change to a building block is
always a conscious one.

If something you need is missing here, add a building block (CSS, macro,
sample on the design page, a section in this file) instead of writing
one-off markup in a screen.

## Principles

- **Calm and airy.** Much white space, few accents. One primary button per
  screen at rest; a save button turns primary while its form is changed
  (see [Saving](#saving)). The accent color marks what is selected or the
  main way forward.
  The gradient of the logo stays in the logo.
- **Large targets.** Everything you can click is at least
  `--fb-size-control` (44 px) high. Only toolbars and rows of lists may
  use small buttons (`--fb-size-control-sm`, 36 px).
- **Dark mode always.** Every color has a light and a dark value. The
  backend follows the system, the user can choose System, Light or Dark.
- **System font.** `--fb-font-family`, no web font.
- **Accessible by default.** WCAG AA contrast in both modes, a visible
  focus ring, a label above every field, errors at the field and as a
  summary, real `<button>` and `<a>` elements, the page usable with the
  keyboard alone.
- **Only tokens.** Colors, spaces, sizes, radii, shadows and durations come
  from `tokens.yaml`. Stylelint rejects anything else (see
  [Allowed and forbidden](#allowed-and-forbidden)).
- **No business logic.** A screen shows what queries return and changes
  data only through actions (decision 0114). A PHPStan rule rejects
  repositories, the `Writer` and the database connection in
  `Frootbox\Backend`.

## Tokens

All values live in [`tokens.yaml`](tokens.yaml). They become CSS
variables in the head of every page:

- colors: `--fb-<name>`, e.g. `--fb-accent`, `--fb-text-muted`
- everything else: `--fb-<category>-<name>`, e.g. `--fb-space-4`,
  `--fb-radius-md`, `--fb-size-control`

Light is the default. Dark applies with `prefers-color-scheme: dark` or
`data-theme="dark"` on `<html>`. `data-theme` also works on any element,
which is how the design page shows both modes at once.

The group **brand** can be replaced by an extension
([Brand](#brand-white-label)), the group **system** cannot. Change a
token only in `tokens.yaml`, then run `composer design-doc` to update the
tables below. A test fails while they are behind.

<!-- tokens:start -->
<!-- Made by `composer design-doc` from tokens.yaml. Do not edit by hand. -->

#### Brand: color

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--fb-accent` | `#8637ff` | `#a57cff` | Primary buttons, selected items, tab and tree markers |
| `--fb-accent-hover` | `#6f1ff0` | `#b996ff` | Primary buttons on hover |
| `--fb-accent-soft` | `#f1e9ff` | `#261d4a` | Background of the current menu item, of hints and of tonal buttons |
| `--fb-accent-soft-hover` | `#e6d8ff` | `#33275f` | Tonal buttons on hover |
| `--fb-accent-text` | `#5b17c6` | `#cfb9ff` | Links and text in the accent color |
| `--fb-on-accent` | `#ffffff` | `#0a1621` | Text on accent |
| `--fb-focus` | `#8637ff` | `#b996ff` | Focus ring |

#### System: color

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--fb-bg` | `#f4f6f9` | `#0a1621` | Page background |
| `--fb-surface` | `#ffffff` | `#102131` | Cards, dialogs, sidebar |
| `--fb-surface-2` | `#eef1f6` | `#172c40` | Hover, segmented controls, disabled fields |
| `--fb-input-bg` | `#ffffff` | `#0d1c2a` | Background of fields |
| `--fb-border` | `#dce2ea` | `#233a50` | Dividers and card borders |
| `--fb-border-strong` | `#b4bfcc` | `#3a5671` | Borders of fields and outline buttons |
| `--fb-text` | `#002337` | `#e6edf4` | Text |
| `--fb-text-muted` | `#4f6273` | `#a1b2c3` | Secondary text, hints, section labels |
| `--fb-success-bg` | `#e2f5ea` | `#11372a` | Status "published" |
| `--fb-success-text` | `#0f5f33` | `#86e0b0` | Text on success-bg |
| `--fb-warning-bg` | `#fff2cc` | `#3a2c0c` | Status "draft" |
| `--fb-warning-text` | `#734600` | `#f3cc72` | Text on warning-bg |
| `--fb-info-bg` | `#e0f3fa` | `#0e3343` | Status "scheduled", info messages |
| `--fb-info-text` | `#065770` | `#86d6ee` | Text on info-bg |
| `--fb-danger` | `#c42a3a` | `#ff6b7a` | Borders of invalid fields, dangerous buttons |
| `--fb-danger-bg` | `#fde8ea` | `#3d1820` | Error messages, dangerous buttons on hover |
| `--fb-danger-text` | `#a11d2c` | `#ff9ca7` | Error text |
| `--fb-on-danger` | `#ffffff` | `#0a1621` | Text on danger |
| `--fb-inverse-bg` | `#002337` | `#e6edf4` | Toasts |
| `--fb-inverse-text` | `#ffffff` | `#0a1621` | Text on inverse-bg |
| `--fb-backdrop` | `#00142373` | `#00000099` | Behind dialogs |

#### System: font

| Token | Value | Use |
| --- | --- | --- |
| `--fb-font-family` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | All text |
| `--fb-font-mono` | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | Code, paths, tokens |

#### System: text

| Token | Value | Use |
| --- | --- | --- |
| `--fb-text-2xs` | `12px` | Section labels in capitals |
| `--fb-text-xs` | `13px` | Status, secondary lines in lists |
| `--fb-text-sm` | `14px` | Hints, errors, small buttons |
| `--fb-text-md` | `15px` | Buttons, menu, labels, body of cards |
| `--fb-text-base` | `16px` | Page text and fields (no zoom on phones) |
| `--fb-text-lg` | `18px` | Headings of cards |
| `--fb-text-xl` | `20px` | Headings of sections |
| `--fb-text-2xl` | `24px` | Headings of dialogs and the sign-in |
| `--fb-text-3xl` | `30px` | Heading of a screen |

#### System: leading

| Token | Value | Use |
| --- | --- | --- |
| `--fb-leading-tight` | `1.2` | Headings, buttons |
| `--fb-leading-snug` | `1.3` | Two-line items |
| `--fb-leading-normal` | `1.5` | Text |

#### System: weight

| Token | Value | Use |
| --- | --- | --- |
| `--fb-weight-regular` | `400` | Text |
| `--fb-weight-medium` | `500` | Menu, toasts |
| `--fb-weight-semibold` | `600` | Buttons, labels, status |
| `--fb-weight-bold` | `700` | Headings |

#### System: tracking

| Token | Value | Use |
| --- | --- | --- |
| `--fb-tracking-caps` | `0.06em` | Section labels in capitals |

#### System: space

| Token | Value | Use |
| --- | --- | --- |
| `--fb-space-0` | `2px` | Gaps inside small parts |
| `--fb-space-1` | `4px` |  |
| `--fb-space-2` | `8px` |  |
| `--fb-space-3` | `12px` |  |
| `--fb-space-4` | `16px` |  |
| `--fb-space-5` | `20px` |  |
| `--fb-space-6` | `24px` |  |
| `--fb-space-8` | `32px` |  |
| `--fb-space-10` | `40px` |  |
| `--fb-space-12` | `48px` |  |
| `--fb-space-14` | `56px` |  |
| `--fb-space-16` | `64px` |  |

#### System: radius

| Token | Value | Use |
| --- | --- | --- |
| `--fb-radius-sm` | `6px` | Inner parts, segments |
| `--fb-radius-md` | `10px` | Buttons, fields, menu items, messages |
| `--fb-radius-lg` | `14px` | Cards and dialogs |
| `--fb-radius-full` | `999px` | Status, avatars |

#### System: size

| Token | Value | Use |
| --- | --- | --- |
| `--fb-size-control` | `44px` | Least height of everything you can click |
| `--fb-size-control-sm` | `36px` | Small buttons in lists and toolbars |
| `--fb-size-tab` | `48px` | Height of tabs |
| `--fb-size-row` | `56px` | Least height of tree rows |
| `--fb-size-icon` | `20px` | Icons in the menu and in buttons |
| `--fb-size-icon-sm` | `18px` | Small icons |
| `--fb-size-avatar` | `36px` | Initials of the user |
| `--fb-size-dot` | `8px` | Dot of a status |
| `--fb-size-check` | `18px` | Checkboxes and radio buttons |
| `--fb-size-sidebar` | `264px` | Width of the sidebar |
| `--fb-size-content` | `1120px` | Widest content |
| `--fb-size-form` | `640px` | Widest form |
| `--fb-size-narrow` | `420px` | Sign-in, small dialogs |
| `--fb-size-dialog` | `560px` | Dialogs |
| `--fb-size-border` | `1px` | All borders |
| `--fb-size-focus` | `2px` | Width of the focus ring |
| `--fb-size-focus-offset` | `2px` | Gap between element and focus ring |
| `--fb-size-indicator` | `3px` | Marker of the selected tab or tree row |

#### System: shadow

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--fb-shadow-sm` | `0 1px 2px #0023370d, 0 2px 6px #0023370f` | `0 1px 2px #0000004d` | Cards, selected segment |
| `--fb-shadow-lg` | `0 8px 24px #00142340` | `0 8px 24px #00000080` | Toasts, dialogs |

#### System: motion

| Token | Value | Use |
| --- | --- | --- |
| `--fb-motion-fast` | `120ms` | Hover and focus |
| `--fb-motion-normal` | `200ms` | Dialogs and toasts |

#### System: layer

| Token | Value | Use |
| --- | --- | --- |
| `--fb-layer-toast` | `20` | Toasts above the page |
| `--fb-layer-dialog` | `30` | Dialogs above everything |
| `--fb-layer-edit` | `2147483000` | Bar of the editing mode above every theme |

#### Contrast (WCAG AA, at least 4.5:1)

| Text | Background | Light | Dark |
| --- | --- | --- | --- |
| `text` | `bg` | 14.97 | 15.47 |
| `text` | `surface` | 16.21 | 13.85 |
| `text-muted` | `bg` | 5.83 | 8.41 |
| `text-muted` | `surface` | 6.31 | 7.53 |
| `text-muted` | `surface-2` | 5.57 | 6.58 |
| `accent-text` | `surface` | 8.81 | 9.37 |
| `accent-text` | `accent-soft` | 7.49 | 8.87 |
| `accent-text` | `accent-soft-hover` | 6.56 | 7.54 |
| `on-accent` | `accent` | 5.24 | 6.03 |
| `on-accent` | `accent-hover` | 6.71 | 7.71 |
| `success-text` | `success-bg` | 6.83 | 8.29 |
| `warning-text` | `warning-bg` | 7.23 | 8.86 |
| `info-text` | `info-bg` | 7.05 | 8.18 |
| `danger-text` | `danger-bg` | 6.57 | 7.83 |
| `danger-text` | `surface` | 7.70 | 8.23 |
| `on-danger` | `danger` | 5.62 | 6.64 |
| `inverse-text` | `inverse-bg` | 16.21 | 15.47 |

<!-- tokens:end -->

## Grid and layout

- **4 px grid.** Spaces are `--fb-space-*` (0 = 2 px for gaps inside small
  parts, then 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64 px). Do not compute
  new spaces; if one is missing, add a token.
- **Frame.** `.fb-app` holds the sidebar (`--fb-size-sidebar`, 264 px) and
  `.fb-main`. Below 760 px the sidebar stands above the content. Content
  is at most `--fb-size-content` (1120 px) wide, forms at most
  `--fb-size-form` (640 px), the sign-in and small dialogs
  `--fb-size-narrow` (420 px).
- **Padding of the content:** 24/16/48 px (top/sides/bottom) on narrow
  screens, 32/40/64 px from 760 px on.
- **Stacks and clusters.** `.fb-stack` puts its children below each other
  with 20 px (`--sm` 8 px, `--lg` 32 px), `.fb-cluster` in a wrapping row
  with 12 px. Use them instead of margins.
- **Headings.** `.fb-heading-1` (30 px, the title of a screen, once),
  `.fb-heading-2` (24 px, dialogs and sign-in), `.fb-heading-3` (20 px,
  sections), `.fb-heading-4` (18 px, cards). The class sets the look, the
  element (`h1`–`h4`) the outline; keep the outline without gaps.
- **Secondary text:** `.fb-muted` (15 px, `--fb-text-muted`).
- **Screen header:** `.fb-page-header` with `.fb-page-header__text`
  (title and a sentence) and the actions of the screen on the right.

## Building blocks

Every building block is a CSS file in `assets/css/components/` and, where
it has options, a macro in [`views/ui.twig`](views/ui.twig):

```twig
{% import '@backend/ui.twig' as ui %}
{{ ui.button({label: t('Save'), type: 'submit'}) }}
```

Macros take one map of options. Unknown keys are ignored, `attrs` adds
attributes (`true` writes only the name, `false` and `null` nothing).

### Button

`ui.button({label, variant, type, href, icon, icon_only, small, block, disabled, saves, attrs})`

| Variant | Use | Look |
| --- | --- | --- |
| `primary` | The main action, once per screen at rest; also a save button while its form is changed | `--fb-accent` background, `--fb-on-accent` text; hover `--fb-accent-hover` |
| `tonal` | Important second actions that lead forward (e.g. "Edit on the website"), a save button at rest; a few per screen, never in dialogs | `--fb-accent-soft` background, `--fb-accent-text` text; hover `--fb-accent-soft-hover` |
| `outline` | Every other action: cancel, paging, opening a dialog | `--fb-surface`, border `--fb-border-strong`; hover `--fb-surface-2` |
| `ghost` | Quiet actions in toolbars and lists | transparent; hover `--fb-surface-2` |
| `danger` | Deleting, inside a confirmation flow | border `--fb-border-strong`, text `--fb-danger-text`; hover `--fb-danger-bg` |
| `danger-solid` | The confirm button of a dangerous dialog | `--fb-danger` background, `--fb-on-danger` text |

- Size: height `--fb-size-control` (44 px), padding 0 16 px, radius
  `--fb-radius-md` (10 px), text 15 px semibold, gap to the icon 8 px,
  border 1 px (transparent unless noted).
- `small`: 36 px high, padding 0 12 px, text 14 px.
- `block`: full width. `icon_only`: square (44 or 36 px), the label is
  visually hidden but read out and shown as `title`.
- `href` makes it a link (`<a>`): use it for navigation, a `<button>` for
  everything that changes something. `type: 'submit'` sends its form.
- Disabled: 50 % opacity, `cursor: not-allowed`. On links
  `aria-disabled="true"`. Prefer explaining why an action is not possible
  over disabling it silently.
- Focus: 2 px ring in `--fb-focus`, 2 px away from the button (like
  every focusable element).

### Field

`ui.field({label, name, id, type, value, hint, error, prefix, required, optional, disabled, placeholder, autocomplete, autofocus, multiline, attrs})`

- Label above the field (15 px semibold), the field (44 px high, padding
  0 12 px, border 1 px `--fb-border-strong`, radius 10 px, text 16 px so
  phones do not zoom), hint below (14 px, `--fb-text-muted`), error below
  (14 px semibold, `--fb-danger-text`, with the alert icon). Gap 8 px.
- The id defaults to `field-<name>`. Hint and error are linked with
  `aria-describedby`, an error sets `aria-invalid="true"` and a red border
  with a 1 px ring in `--fb-danger`.
- `optional: true` adds "(optional)" to the label. Mark the few optional
  fields, not the many required ones; `required` still sets the attribute.
- `prefix` puts a fixed text in front, e.g. the address of a page
  (`.fb-affix`); the focus ring then surrounds both.
- `multiline: true` is a `<textarea>`, at least 132 px high, resizes
  vertically.
- Disabled: `--fb-surface-2` background, muted text.
- Passwords never get their value back into the page.

### Select

`ui.select({label, name, id, options: [{value, label}], value, hint, error, disabled, attrs})`

A native `<select>` that looks like a field, with the chevron icon at the
right (padding right 40 px). Same label, hint and error as a field.

### Checkbox and radio button

`ui.check({label, name, id, type, value, checked, hint, disabled, attrs})`

Native control (18 px, `accent-color: --fb-accent`), label on the right,
an optional hint below it. At least 44 px high, the whole row is clickable.
`type: 'radio'` for a radio button; group radios in a `<fieldset>` with a
`<legend>`.

### Choice

`ui.choice({title, text, name, id, value, checked, attrs})`

A radio button as a card for a few important options with a description,
e.g. "Publish now" or "Publish later". Padding 16 px, border 1 px
`--fb-border-strong`, radius 10 px. Checked: border and 1 px ring in
`--fb-accent`, background `--fb-accent-soft`. The focus ring surrounds the
card.

### Status

`ui.status(status)` for pages, `ui.badge(status, label)` for anything else.

| Status | Label | Colors |
| --- | --- | --- |
| `published` | Published | `--fb-success-bg` / `--fb-success-text` |
| `draft` | Draft | `--fb-warning-bg` / `--fb-warning-text` |
| `changed` | Changed (published, with a newer draft) | `--fb-warning-bg` / `--fb-warning-text` |
| `scheduled` | Scheduled | `--fb-info-bg` / `--fb-info-text` |
| `danger` | e.g. Error, Offline | `--fb-danger-bg` / `--fb-danger-text` |
| `neutral` | anything else, no dot | `--fb-surface-2` / `--fb-text-muted` |

Pill (radius full), padding 2 px 12 px, text 13 px semibold, a dot of
8 px in the text color, 8 px gap. Color is never the only signal: the
label always says the status.

### Alert

`ui.alert({tone, title, text, live})`

A message in the page: `info`, `success`, `warning`, `danger`, each with
its icon and colors (`--fb-<tone>-bg` / `--fb-<tone>-text`, `info` for
unknown tones). Padding 12 px 16 px, radius 10 px, text 15 px, the title
semibold. `danger` has `role="alert"` and is read out at once, the others
`role="status"`; `live` overrides it.

Use an alert for something the user should know on this screen, the
error summary of a form included. Use a toast for a confirmation.

### Toast

`ui.toast(text, static = false)`

A short confirmation at the bottom right (24 px from the edges), e.g.
"Saved". `--fb-inverse-bg` / `--fb-inverse-text`, padding 12 px 16 px,
radius 10 px, text 15 px medium, shadow `--fb-shadow-lg`, above the page
(`--fb-layer-toast`). `role="status"`. It never holds the only way to do
something (no "Undo" that is not also elsewhere). `static` shows it in the
flow, e.g. on the design page. From JavaScript `showToast(text)` of
`@frootbox/ui` shows one; `<fb-form>` uses it after saving.

### Card

```html
<section class="fb-card" aria-labelledby="…">
    <div class="fb-card__header"><h2 class="fb-heading-4" id="…">…</h2>…</div>
    <div class="fb-card__body">…</div>
    <div class="fb-card__footer">…</div>
</section>
```

Groups what belongs together. Border 1 px `--fb-border`, radius
`--fb-radius-lg` (14 px), `--fb-surface`, shadow `--fb-shadow-sm`. Header
padding 20 px (title left, actions right, wrapping), body 0 20 px 20 px,
footer 16 px 20 px with a top border. `.fb-card--padded` for a card
without parts (24 px). `.fb-card--accent` (`--fb-accent-soft`, no border
or shadow) points to the main way forward, at most once per screen.

### List

```html
<ul class="fb-list">
    <li class="fb-list__item">
        <div class="fb-list__main"><span class="fb-list__title">…</span><span class="fb-list__meta">…</span></div>
        {{ ui.status('draft') }}
        {{ ui.button({label: t('Edit'), variant: 'ghost', small: true}) }}
    </li>
</ul>
```

Entries in a card: at least `--fb-size-row` (56 px) high, padding 12 px
20 px, a 1 px divider above each. Title semibold, a line below it 14 px
muted, status and actions at the end; on narrow screens they wrap below.
A title that leads to the entry is a link with `.fb-list__title
.fb-list__link` (text color, underlined on hover).

### Tabs

`ui.tabs(label, [{label, href, current}])`

Links in a row, e.g. the languages of a page: 48 px high, 24 px apart,
text 15 px semibold muted; the current one in `--fb-text` with a 3 px
line in `--fb-accent` (`aria-current="page"`). The row scrolls sideways on
narrow screens. `label` names the `<nav>` for screen readers.

### Dialog

```html
<dialog class="fb-dialog" aria-labelledby="…">
    <div class="fb-dialog__body"><h2 class="fb-dialog__title" id="…">…</h2><p>…</p></div>
    <div class="fb-dialog__actions">…</div>
</dialog>
```

The native `<dialog>` with `showModal()`: focus stays inside, Escape
closes. Width `--fb-size-dialog` (560 px, at most the screen minus 32 px),
radius 14 px, shadow `--fb-shadow-lg`, backdrop `--fb-backdrop`. Body
padding 24 px, title 20 px bold, actions right-aligned with a top border,
the safe choice first ("Cancel", then "Delete page"), and the safe
choice gets `autofocus`. Buttons open and close it without a script
through invoker commands: `commandfor="<id>" command="show-modal"` and
`command="close"`. A confirmation that runs an action puts an
`<fb-form>` inside (see Form).

### Form

```twig
<fb-form action="user.create" next="{{ path('backend.users') }}/{user.id}" done="{{ t('The user is created.') }}">
    <form class="fb-stack" novalidate>
        {{ ui.field({label: t('Name'), name: 'name', required: true}) }}
        <div class="fb-form__actions">{{ ui.button({label: t('Create the user'), type: 'submit'}) }}</div>
    </form>
</fb-form>
```

Every form that changes something runs one action through
`<fb-form>` (decision 0115). It sends the fields as JSON to
`POST <backend.path>/actions/<action>` with the CSRF token and shows the
answer:

- Errors appear at their field (as `ui.field` would show them) and as a
  danger alert at the top of the form, `.fb-form__summary`, with the
  title "Check the marked fields." and a list of links to the fields in
  the order of the form. The summary gets the focus. Errors without a
  field of their own are listed there too.
- Afterwards it goes to `next` (`{path}` takes a value of the result,
  e.g. `{user.id}`) and shows `done` as a toast there. Without `next` the
  page stays: `reset` empties the form, `show="<id>"` reveals a hidden
  element and fills its `[data-fb-value="token"]` from the result (for
  something shown only once, like a new API token).
- While it waits, the submit buttons are disabled and `busy` is set.
- The input follows the fields: a checkbox is `true`/`false`, with a
  name ending in `[]` a list of the checked values; `type="number"` and
  `data-type="number"` are numbers (empty is `null`);
  `data-type="lines"` is a list of the lines that are not empty (in a
  monospace font); `data-type="boolean"` makes a hidden field `true` for
  `1`; `data-empty="null"` sends `null` for an empty text. Disabled
  fields are left out.
- `refresh="page-tree page-detail"` loads the current address again
  after success and replaces only the elements with these ids; focus
  goes to the element with the same id or to `[data-fb-focus]` in it
  (decision 0116). `base="/items/de/2"` takes errors below that JSON
  pointer to the fields of the form, e.g. `/items/de/2/label` to `label`.
  An error without a field names the last part of its pointer.
- `data-type="datetime"` on a `datetime-local` field sends the time with
  the offset of the browser; `data-value="<ISO time>"` fills it in the
  time zone of the browser.
- Events: `fb-form-input` (`detail.input` can be replaced before
  sending), `fb-form-success` (cancelable) and `fb-form-error`.
- Hide controls the user may not use: `{% if can('user.create') %}`.
  The action checks again.

`.fb-form__actions` holds the buttons at the end, the primary one first,
12 px apart. `.fb-fieldset` with `.fb-fieldset__legend` groups
checkboxes under a label (no border, 12 px gap); a group shows its error
once below. A field for a new password gets a ghost button with
`data-fb-generate="<field id>"`, which fills in a random password and
shows it.

### Saving

Nothing in the backend saves by itself (decision 0130). A button that is
the action itself (e.g. "Lock for visitors") says that it acts at once.
A form that edits something has three states:

| State | Look |
| --- | --- |
| At rest | The save button is `tonal` and can be clicked |
| Changed | The button is `primary`, next to it `.fb-form__status` says "Not saved" (`--fb-accent-text`, a `--fb-size-dot` dot in `--fb-accent`) |
| Saved | Back to rest, with the toast of `done` |

```twig
<div class="fb-form__actions">
    {{ ui.button({label: t('Save'), type: 'submit', saves: true}) }}
    <p class="fb-form__note">{{ t('Changes go into the draft. Visitors see them after publishing.') }}</p>
</div>
```

- `saves: true` marks the save button (`data-fb-saves`) and makes it
  `tonal` (decision 0131). Other buttons in a form, e.g. "Create the
  token", do not get the status.
- `<fb-form>` remembers the input as it would be sent when it loads and
  after success. While the input differs it has `dirty`, its save
  buttons turn `primary`, and it adds the status (`role="status"`) after
  the first of them. Setting a value back
  makes it calm again.
- A form that creates something and a dialog keep their primary button.
- `.fb-form__actions` with such a button is set apart: 8 px more space
  and a `--fb-border` line above, 16 px padding.
- A hint about saving goes into that row as `.fb-form__note` (14 px,
  `--fb-text-muted`), not between the fields.
- With a changed form, leaving the page or replacing its part through
  htmx (e.g. a click in the page tree) asks first. Forms in closed
  dialogs do not count. `refresh` keeps the values of other changed
  forms in the parts it loads again.
- A script that sets a field fires `input` on it, so the form notices.
- More than one changed form shows more than one primary button: each
  of them has to be saved.

Helpers for forms, started by `backend.js`:

- `data-fb-fill='{"id": 3, "path": "/old"}'` on a button that opens a
  dialog fills the fields of that name in it and clears old errors.
- `data-fb-enables="<field id>"` on a radio button enables that field
  while it is checked and hides the fields of the other buttons.
- `data-fb-slug="<title field id>"` on an address field fills it from
  the title until the user changes it; `data-fb-prefix="<field id>"` on
  a select with `data-prefix` per option changes the prefix of that
  address field.

### Secret

`<code class="fb-secret">…</code>` shows something to copy once, such as
a new API token: monospace 14 px, padding 12 px 16 px, border 1 px,
radius 10 px, on `--fb-bg`; a click selects all of it. Put a warning
alert above it that says it is shown only once.

### Disclosure

```html
<details class="fb-card fb-disclosure">
    <summary class="fb-disclosure__summary">…</summary>
    <ul class="fb-disclosure__body">…list entries…</ul>
</details>
```

Something to look up that stays closed until needed, e.g. all
permissions below the rules of a role. The summary is 44 px high,
semibold, with the native marker; the body scrolls after eight rows.

### Empty state

`ui.empty({icon, title, text, action})`

What a screen shows while it has nothing: what is missing and the way to
the first entry. Centered, padding 56 px 24 px, dashed 2 px border
`--fb-border-strong`, radius 14 px. The icon sits in a 56 px circle in
`--fb-accent-soft`; title 18 px bold; text muted, at most 420 px wide;
`action` takes the options of `ui.button()`.

### Error page

`@backend/error/message.twig`, rendered by `BackendErrorPage` for every
error below the backend path (decision 0132). Signed in, it sits in the
frame with the menu and marks the area; a guest gets a card like the
sign-in. From top to bottom: the icon in a 56 px circle (`--fb-size-row`) in
`--fb-accent-soft`, "Error 404" small and muted, the title as
`.fb-heading-1`, a plain text and the way on (primary: back to the area
or "Try again", outline: the dashboard). In development the technical
details follow in a closed disclosure (open for 5xx), never live. Texts
by status: missing (404, 410), forbidden (403), failed (5xx), other.

### Split

```html
<div class="fb-split">
    <section class="fb-card fb-split__side">…tree…</section>
    <section class="fb-card fb-split__main">…details…</section>
</div>
```

A narrow side, e.g. a tree, next to the main part, e.g. its details
(decision 0116). 24 px apart; the side starts at `--fb-size-narrow` and
the main part takes the rest. When less than about 860 px is left, they
wrap, side on top. `.fb-split__side--sticky` (decision 0135) keeps a long
side in view from a window of 1240 px: it stays at the top and its last
child scrolls by itself.

### Section

`<section class="fb-section">` divides a card into parts one below the
other: a 1 px line on top, padding 20 px, 16 px between its children.
`.fb-section__header` holds a title and a short hint or action.
`.fb-section--flush` has no padding, for lists and trees that reach the
edges; its header and a `.fb-muted` text keep the padding.

### Missing

```html
<div class="fb-missing">
    <p class="fb-missing__title">No version in English yet</p>
    <p class="fb-muted">…what visitors see meanwhile…</p>
    {{ ui.button({label: 'Add the version in English', variant: 'tonal', icon: 'plus'}) }}
</div>
```

Something that is not there yet, with the way to add it, e.g. a
translation: dashed 1 px border `--fb-border-strong`, radius 10 px,
padding 20 px. Smaller than the empty state, it sits inside a card.

### Tree

```html
<fb-tree id="page-tree" action="page.move" refresh="page-tree page-detail"
         moved="{title} is below {parent} now, at place {position} of {count}.">
    <ul class="fb-tree" aria-labelledby="…">
        <li class="fb-tree__item" data-id="…" data-title="Start" data-fixed>
            <div class="fb-tree__row" data-depth="0">
                <span class="fb-tree__handle" aria-hidden="true">{{ icon('grip', 'fb-icon fb-icon--small') }}</span>
                <a class="fb-tree__link" href="…"><span class="fb-tree__title">…</span><span class="fb-tree__meta">…</span></a>
                {{ ui.status('published') }}
            </div>
            <ul class="fb-tree__group">…</ul>
        </li>
    </ul>
</fb-tree>
```

Pages or menu items as a tree that can be rearranged (decision 0116).
Each row is at least 56 px high and indents 24 px per level
(`data-depth`, at most 6). The link covers the row; the current one has
`aria-current="page"`, `--fb-accent-soft` and a 3 px line on the left. A
`<button class="fb-tree__link">` works the same, e.g. to edit an item in
a dialog.

- Keys: arrow up and down, Home and End go through the rows. With Alt,
  up and down move the row among its siblings, right makes it the last
  child of the row above, left moves it one level up.
- Mouse: drag a row before, after or into another one. A line or a
  dashed outline shows where it lands.
- `action` runs with `{id, parentId, position}`, then `refresh` loads
  the parts again and `moved` is read out as a toast. Without `action`,
  `movable` fires `fb-tree-move` instead and the listener sets
  `detail.result` to a promise of `{ok, problem}`.
- `data-fixed` keeps a row in place (the start page), `data-leaf` takes
  no children, `roots` allows the top level, `depth="2"` limits the
  levels.
- A row that is only shown, e.g. a page above the own branch (decision
  0118), has `data-fixed data-leaf data-outside` and a
  `<span class="fb-tree__link">` instead of a link: muted text, regular
  weight, no status, skipped by the arrow keys.

Put a hint like "Drag to move, or Alt and the arrow keys." in the
header and link it with `aria-describedby` from the movable links.

**Compact tree** (`<ul class="fb-tree fb-tree--compact">`, decision
0135), for long trees like the sitemap: one line per row, at least 36 px
(`--fb-size-control-sm`), titles in 14 px cut with "…" (put the full
title, the path and the status into `title`), 16 px per level with thin
guide lines, `data-depth` up to 9. The handle shows only on hover or
focus, in the step to the left.

```html
<li class="fb-tree__item" data-id="…" data-title="Kliniken" data-collapsed>
    <div class="fb-tree__row" data-depth="2">
        <span class="fb-tree__handle" aria-hidden="true">…</span>
        <button class="fb-tree__toggle" type="button" aria-expanded="false" aria-controls="…" aria-label="Subpages of „Kliniken“" tabindex="-1">…chevron-down…</button>
        <span class="fb-tree__dot" data-status="changed" aria-hidden="true"></span>
        <a class="fb-tree__link" href="…" title="…"><span class="fb-tree__title">Kliniken</span><span class="fb-visually-hidden">, Changed</span></a>
        <span class="fb-tree__flag" data-status="changed" aria-hidden="true">Changed</span>
    </div>
    <ul class="fb-tree__group" id="…">…</ul>
</li>
```

- The status is a dot (`.fb-tree__dot`: published green, changed
  yellow, draft a yellow ring, scheduled blue). Only a status other
  than "published" adds a short `.fb-tree__flag` without background at
  the end; "Locked" with the lock icon. The link names the status for
  screen readers.
- `.fb-tree__toggle` opens and closes a branch (`data-collapsed` on the
  item); a row without children has an empty `<span>` of the same width
  so titles stay in line. Arrow right opens or goes in, arrow left
  closes or goes to the parent; closed rows are skipped.
- `remember="name"` keeps opened and closed branches in this browser;
  the way to the current link stays open. A tree that scrolls by itself
  scrolls to the current link and keeps its place when loaded again.
- Which branches start open is up to the screen; the sitemap opens
  whole levels while they fit into 50 rows (decision 0136).

**Search in a tree** (decision 0136):

```html
<fb-tree-filter class="fb-tree-filter" for="page-tree" found="{count} pages found" one="One page found" empty="No page found">
    <label class="fb-visually-hidden" for="page-tree-filter">Find a page</label>
    <span class="fb-tree-filter__icon" aria-hidden="true">…search…</span>
    <input class="fb-input fb-tree-filter__input" id="page-tree-filter" type="search" placeholder="Find by title or address" aria-controls="page-tree" aria-describedby="page-tree-filter-status" aria-keyshortcuts="/">
    <p class="fb-tree-filter__status" id="page-tree-filter-status" role="status"></p>
</fb-tree-filter>
```

Between the header of the card and the tree, 36 px high. It keeps only
the items whose `data-terms` (else `data-title`) hold every word,
ignoring case and accents, and the way to them: hits show their
`.fb-tree__path` and the word in a `<mark class="fb-tree__mark">`
(`--fb-warning-bg`), rows on the way are muted. Moving is off meanwhile.
"/" anywhere puts the focus in the field, arrow down goes to the first
hit, Enter opens it, Escape empties the field and brings the tree back.

### Navigation

`<fb-navigation name="main" language="de" items="[…]" refresh="…">`
holds the items of a navigation in one language and saves them all with
`navigation.update` (decision 0116). Inside are an `<fb-tree movable
roots depth="…">` with the items (moves are saved at once) and a
`<dialog>` with an `<fb-form>` that edits one item: `_path` is its place
(`"2.0"`, empty for a new one), `data-types="url anchor"` shows a field
only for these kinds, `data-navigation-remove` on a button removes the
item.

### Media

```html
<fb-upload url="/cms/uploads" folder="01J…" refresh="media-grid" label="Drop images here to upload them"
           progress="Uploading {done} of {total} …" done="The images are uploaded.">
    <section class="fb-card" id="media-grid">
        … <button class="fb-button fb-button--primary" type="button" data-fb-upload>Upload</button> …
        <p class="fb-visually-hidden" role="status" data-fb-upload-status></p>
        <ul class="fb-media-grid">
            <li><a class="fb-media-grid__item" href="…"><img src="…" alt="" width="…" height="…"><span class="fb-media-grid__name">hafen.jpg</span></a></li>
        </ul>
    </section>
</fb-upload>

<fb-focus class="fb-focus" x="0.5" y="0.5" label="Focus point" position="{x} % from the left, {y} % from the top">
    <img src="…" alt=""><input type="hidden" name="focusX"><input type="hidden" name="focusY">
</fb-focus>
```

The media library (decision 0126). `.fb-media-grid` shows square tiles
with the file name below; the image is decoration (`alt=""`), the name
is the text of the link. The chosen tile has `aria-current="true"` or,
as a button, `aria-pressed="true"`.

- `<fb-upload>` uploads the files of the file dialog (a click on
  `[data-fb-upload]` inside it) or of a drop onto it, one after another:
  first to `url`, then `media.create` with the token and `folder`. While
  files are dragged over it, a dashed outline shows `label`. The status
  line says `progress`, errors come as an alert above, one line per
  file; then `refresh` loads the parts again and `done` is the toast.
  `disabled` takes nothing. `uploadMedium(url, file, folder)` does the
  same for one file in a script.
- `<fb-focus>` sets the focus point of an image: a click puts the round
  marker there, the marker is a button and moves with the arrow keys in
  steps of 5 %. Its label tells the position. The hidden fields inside
  get the values from 0 to 1 for `<fb-form>`.

In the editing mode the bar has its own dialog for images (`media.js`):
the library with search and upload, the alternative text for the place
and "Remove the image".

### Swatch

```html
<span class="fb-swatch" style="--fb-swatch: #8a4b2a" aria-hidden="true"></span>
```

A colour of the website, e.g. on the screen "Design" (decision 0127).
The colour comes from the data through `--fb-swatch`, never from a rule
of the backend; the text next to it names the colour, so the swatch is
hidden from screen readers.

In the editing mode the bar has the panel "Design" (`design.js`): the
tokens of the theme by type (colour picker with hex field, font select,
slider with unit, choice), each change shows on the page at once and is
saved into the draft a moment later. A colour read against another one
warns below 4.5 : 1. The menu entry "Design" opens the website with
`#fb-design`, which opens the panel.

### Time

`{{ ui.time(page.publishAt) }}` writes a `<time datetime="…">` that the
browser shows in its own time zone (`localTimes()`), the server zone
without JavaScript.

### Avatar

`ui.avatar(initials)`

The initials of a user in a 36 px circle (`--fb-accent-soft`,
`--fb-accent-text`, 14 px bold), hidden from screen readers because the
name stands next to it.

### Brand

`ui.brand(fb, href)`

The logo of the active brand, one image for light and one for dark, or
its name if it has no logo.

### Menu

The sidebar (`.fb-nav`) is drawn by the frame from the screens extensions
register. Group labels 12 px capitals, 0.06 em tracking, muted. Items
44 px high, padding 0 12 px, radius 10 px, 15 px medium muted with a
20 px icon and 12 px gap; hover `--fb-surface-2`; current
(`aria-current="page"`) `--fb-accent-soft` / `--fb-accent-text`
semibold.

### Appearance switch

`<fb-theme-switch>` (web component from `@frootbox/ui`) on
`.fb-segmented`: three buttons (System, Light, Dark) with
`aria-pressed`, 36 px high, the pressed one on `--fb-surface` with
`--fb-shadow-sm`. The browser keeps the choice in `localStorage`
(`fb-theme`) until phase 2, an inline script applies it before the first
paint. It fires `fb-theme-change` with `detail.theme`.

### Editor bar

`<fb-editor-bar>`, the editor bar (German "Redaktionsleiste", decision
0137), is the bar of the editing mode on pages of the website, not on
backend screens (decision 0119). Docs and trainings call it by that name;
"toolbar" is only the bar of rich text. It lives in its own shadow DOM
with `all: initial` on the host and the tokens of the backend on
`:host`, so neither the theme nor the backend CSS reaches it. The script
`edit.js` brings Lit along (no import map on theme pages) and reads its
data from the JSON block `#fb-edit-config` in the head.

- Floats at the bottom in the middle, `--fb-surface`, `--fb-radius-lg`,
  `--fb-shadow-lg`, above everything (`--fb-layer-edit`). It never moves
  the layout of the page; the page only
  gets room at its end (`padding-block-end` on `body`, the measured
  height of the bar plus 2rem), so the footer can be reached.
- Content (decision 0139): only commands for the page in view, in order
  of use. Switch "Edit" (`role="switch"`), "Undo", "Publish" (primary),
  "More", collapse, and the status docked at the end. No logo: whoever
  sees the bar is signed in. Editing off leaves the switch, "More" and
  collapse.
- The bar keeps its width while one works (decision 0140). "Undo" and
  "Publish" stay in place with nothing to do, muted with
  `aria-disabled="true"` and a tooltip that says why; they stay
  reachable by keyboard.
- The status sits flush at the end, separated by `--fb-border`, with the
  end radii of the bar. It answers one question, whether visitors see
  what one sees (decision 0141): published (dot, `--fb-success-bg`),
  pending changes (dot, `--fb-warning-bg`), draft (ring,
  `--fb-warning-bg`); an error (warning, `--fb-danger-bg`) goes first.
  It only changes text, mark and colour. All texts lie in one grid cell
  and only the current one is visible, and every mark has the room of
  `--fb-size-icon-sm`, so the block is as wide as its longest text in
  every language. Locked for visitors is a lock in the block.
- Saving is no state: while it saves the mark pulses (five times
  `--fb-motion-normal`, none with reduced motion), then a check stands in
  its place for 2 s. Screen readers read "Status: …"; "Saving …",
  "Saved" and other messages go as sentences to a visually hidden
  `role="status"`.
- The status is a button (`aria-expanded`, tooltip "What does that
  mean?", "Show what went wrong" on an error). It opens a short
  explanation above it in `--fb-surface` with `--fb-shadow-lg`: what
  visitors see, for pending changes and drafts whether all is saved, the
  lock; on an error the message in `--fb-danger-text` with "Reload" if
  needed. Escape and a click outside close it.
- Below 30rem the bar stays one line: the status shows only its mark,
  "Edit" and "Undo" only their icon (text for screen readers and in the
  tooltip), the padding shrinks to `--fb-space-1`, and only "Publish"
  may shorten its text with an ellipsis.
- "More" is a menu button (`aria-haspopup="menu"`) with an ellipsis. Its
  menu opens above it in `--fb-surface` with `--fb-radius-lg` and
  `--fb-shadow-lg`, in sections with a small heading in `--fb-text-muted`:
  "This page" ("Show all places" as `menuitemcheckbox`, "Open in the
  backend", "Discard the draft" in danger last) and "Website" ("Design"
  with `design.update`). An entry shows only with its right; without
  entries there is no menu. Arrow keys, Home and End move, Escape closes
  and returns to "More", Tab and a click outside close. "Discard the
  draft" asks in the bar with the focus on "Cancel"; closing the design
  panel returns to "More".
- Collapsed it is a round button of `--fb-size-control` with the pencil;
  the browser keeps that in `localStorage` (`fb-editor-bar-collapsed`).
- Light or dark follows the choice of the appearance switch (`fb-theme`),
  else the system.
- Marked places get an outline of `--fb-size-focus` in `--fb-accent` with
  a label on hover and focus: solid for fields, dashed for blocks and
  empty areas. The bar draws them over the page with
  `getBoundingClientRect()`; the page itself only gets a rule without a
  layer for `fb-field`, `fb-area` and `[data-fb-field]`.
- When publishing fails, every field it names gets an outline in
  `--fb-danger` with its label in `--fb-danger` and `--fb-on-danger`
  (decision 0143), also with "Show all places" off. The label names the
  field; only the field in focus or under the mouse adds the reason. The
  status shows the error and opens by itself: the message, how many
  fields still need something, a list of the fields the page does not
  show (block · field: reason) and the button "Go to the first one",
  which scrolls the first one to the middle and focuses it. A field loses
  its outline once a value for it is saved; with none left the
  explanation closes.
- List entries (decision 0145): the bar finds each entry from its fields
  and marks it `data-fb-entry`. The entry under the pointer or with the
  focus gets a dashed outline without a label and, inside its top end
  corner, the same toolbar as a block (`.block-tools.entry-tools`):
  "Move forward", "Move back" (arrows left and right when entries stand
  side by side, else up and down), "Add an entry after it" and "Remove
  the entry" in danger, without asking. At `min` and `max` the buttons
  are disabled with the reason as tooltip. After a change the page loads
  again with the focus in the entry. Alt+F10 in an entry reaches its
  toolbar, again Alt+F10 that of the block, Escape goes back to the
  field.

Editing fields (decision 0122) keeps the look of the theme: the text is
typed where it stands, nothing is replaced by a form.

- An empty field shows its placeholder, else its label at half opacity;
  a field emptied by hand is cleared, so it shows it again (decision
  0144). Templates print optional fields without a condition.
- `headline` and `text` become `contenteditable="plaintext-only"`. Enter
  ends a headline, Esc takes back what is not saved yet. Saving runs a
  second after the last input and when the field is left; the status
  line says "Saving …", "Saved" or why not, with "Load again" on a
  conflict.
- After a change the bar shows "Undo" with the undo icon. It reverts the
  last change of this tab (kept in `sessionStorage`, `fb-edit-undo:<id>`)
  and loads the page again.
- **Toolbar** of rich text: floats above the selection (below it near the
  top edge), `--fb-surface`, `--fb-radius-md`, `--fb-shadow-sm`, buttons
  of `--fb-size-control-sm` with icon and `aria-label`, active ones with
  `aria-pressed` in `--fb-accent-soft`. `role="toolbar"`, Alt+F10 reaches
  it from the text, arrow keys move between buttons, Esc goes back. Its
  buttons keep the selection (no focus on mouse down).
- **Link dialog**: a modal `<dialog>` of `--fb-size-dialog` over
  `--fb-backdrop`. Text (only for link fields), "Address or page" with a
  search in the page tree, results as buttons with title and path, a
  chosen page as a soft accent row with a button to remove it, "Open in
  a new window", then "Remove the link" (danger), "Cancel" and "Apply"
  (primary). Addresses like `example.com` get `https://`.
- Themes output link fields with `{{ field() }}` so they can be edited;
  own markup with `value()` is shown but not editable on the page, only
  in the settings of the block.
- Empty fields show their label at half opacity, so they can be reached.
- Fields of the website (`data-fb-site`, decision 0128), e.g. in the
  footer, look and behave like fields of the page and are saved with
  `site.update-field`. Their draft counts like one of the page: the
  status says "Pending changes", "Publish" and "Discard the draft" act on both.

Arranging blocks (decision 0123), from `resources/js/edit/arranging.js`:

- **Block tools**: a `role="toolbar"` named "Block <title>" above the top
  end of the block under the pointer or focus (inside it near the top
  edge), styled like the rich text toolbar with small buttons of
  `--fb-size-control-sm`: block around it, move up, move down, copy,
  settings, insert a block below, delete (danger). Buttons that cannot
  act are disabled. Delete asks in place of the buttons ("Delete
  "<title>"?", danger solid, "Cancel"). Blocks and empty areas are
  focusable in the mode; Alt+F10 reaches the tools, arrow keys move
  between them, Esc goes back to the block.
- **Block dialog**: the modal `<dialog>` like the link dialog, "Insert a
  block", the area as a hint, one bordered button per block with title
  and description (muted), a search field above seven blocks. Only blocks
  the area allows; a full area says so. Clicking an empty area opens it.
- **Settings panel**: a side panel at the inline end over the full
  height, `--fb-size-narrow` wide, `--fb-surface`, `--fb-radius-lg`,
  `--fb-shadow-lg`, not modal. Header with "Settings: <title>" and close,
  then groups with a small caps legend: variant as radio buttons with
  description, options (choice as select, boolean as checkbox, number and
  text as fields), content fields `headline`, `text` and `link`, and each
  list with its entries (open to edit their fields, move up, move down,
  remove) and "Add an entry". A change saves when the field is left.
- Every structural change loads the page again; the focus returns to the
  block and an open panel opens again.

### Icons

`{{ icon('pencil') }}` writes an SVG from `assets/icons/` inline, 20 px
(`--fb-size-icon`), drawn with `currentColor`; `icon('pencil', 'fb-icon
fb-icon--small')` for 18 px. Icons are `aria-hidden`; a button with only
an icon has a label (`icon_only`). New icons come from
[Lucide](https://lucide.dev) (ISC license, kept as `assets/icons/LICENSE-lucide`),
one file per icon as needed, drawn by hand only if Lucide has none: 24×24
viewBox, stroke 1.8, round caps and joins, no fill, `stroke="currentColor"`.

Available: alert, arrow-down, arrow-up, check, chevron-down, clock, close,
copy, dashboard, external, grip, image, inbox, info, lock, menu,
navigation, pages, palette, parent, pencil, plus, redirect, restore,
search, settings, shield, sign-out, square, trash, users, warning.

The bar of the editing mode runs on the website without Twig and keeps
the paths of its icons in `resources/js/edit/icons.js`. An icon used in
both places has the same paths in both.

### Helpers

- `.fb-visually-hidden`: hidden on screen, read out.
- `.fb-skip`: the "Skip to the content" link, visible on focus.
- Motion: `--fb-motion-fast` (120 ms) for hover and focus,
  `--fb-motion-normal` (200 ms) for dialogs and toasts. With
  `prefers-reduced-motion` all transitions are off.

## Keyboard and accessibility

- Every function works with the keyboard; the order follows the page.
- Focus is always visible: 2 px `--fb-focus`, 2 px offset. Never remove an
  outline without a replacement.
- Every field has a visible label. Placeholders are examples, never
  labels.
- After a failed submit the page shows an alert with the errors at the
  top and each error at its field; focus goes to the summary.
- Text contrast is at least 4.5:1 in both modes (the table above, checked
  by a test). A brand with too little contrast gets a warning on the
  design page.
- Status is never color alone: there is always a text.
- Use the right element: `<a>` to go somewhere, `<button>` to do
  something, `<dialog>` for dialogs, `<table>` only for tabular data.
- Images need an `alt`; decorative ones `alt=""`.

## Texts

- Address the user as "you" (German "Du"), friendly and direct.
- Labels are short: "Title", "Address", not "Please enter the title".
- Buttons say what happens: "Publish page", "Delete page", not "OK".
- Errors say what to do: "Enter an email address." instead of "Invalid
  input."
- English text is the key of the translations in `translations/<lang>.yaml`
  (`"Sign in": Anmelden`). Placeholders `{name}`; plural with `one` and
  `other` and `{count}`, in Twig `t(['{count} page', '{count} pages'],
  {count: n})`. A missing translation shows the English text.
- No brand names in texts: the name comes from the active brand
  (`fb.brand`).

## Allowed and forbidden

Stylelint (`npm run lint:css`) and PHPStan enforce most of this.

| Allowed | Forbidden |
| --- | --- |
| `var(--fb-…)` for every value | Hex colors, named colors, `rgb()`, `hsl()`, `color-mix()` … |
| `calc()` with tokens, e.g. `calc(var(--fb-size-control) * 3)` | `px`, `rem`, `em` outside of media queries |
| `px` in media queries (variables do not work there) | Defining custom properties in CSS (`--x: …`); add a token |
| Classes `fb-block__element--modifier` | Other class names, ids for styling |
| Plain CSS; the layer comes from the folder | `@layer`, `@import` |
| Unitless numbers for opacity, line height and z-index from tokens | Inline `style` in screens (the design page shows tokens this way, as an exception) |
| A new building block for a new need | One-off markup in a screen that copies a building block |
| Queries and actions through `Runner` | Repositories, `Writer`, `Connection` in `Frootbox\Backend` |

## CSS layers

The backend loads its CSS in the layers `reset, tokens, base, components,
screens, extensions`. The folder decides the layer: `assets/css/reset.css`,
the generated tokens, `assets/css/base.css`, `assets/css/components/`,
`assets/css/screens/`. CSS of extensions, registered with
`$registry->asset('assets/css/forms.css', 'backend')`, is in
`extensions` and can therefore override building blocks; do that only
for your own screens.

## JavaScript

Interactive parts are web components with Lit in the light DOM, so the
CSS of the building blocks applies. Sources in `resources/js/`, Vite
builds them to `assets/build/` (`npm run build`, `npm run watch`); the
built files are in Git. `lit`, `htmx.org` and `@frootbox/ui` come from
the import map; extensions use the same names:

```js
import { LitElement, html } from 'lit';
```

and register their own modules with `$registry->import('@acme/thing',
'assets/build/thing.js')`.

The editing mode on the website has its own entry `edit.js`, which
bundles Lit, because theme pages have no import map. It is a build of its
own (`vite.edit.config.js`), so the backend keeps loading Lit from
`lit.js` alone. Tiptap for rich text is a chunk of it
(`chunks/edit-richtext-<hash>.js`), loaded on the first focus of such a
field.

`@frootbox/ui` exports `ThemeSwitch` (`<fb-theme-switch>`), `Form`
(`<fb-form>`) with `formInput(form)`, `Tree` (`<fb-tree>`), `Navigation`
(`<fb-navigation>`), `showToast(text)`, `runAction(name, input)` and
`refresh(ids)` for own components, and the helpers `generatePasswords()`,
`bindSlugs()`, `bindFills()` and `localTimes()`, which `backend.js`
starts on every page.

## Brand (white label)

An extension replaces the brand by registering one; the last one
registered wins, so a project extension beats a module:

```php
use Frootbox\Backend\Brand;

$registry->add(Brand::class, new Brand(
    name: 'Acme CMS',
    logo: __DIR__ . '/../assets/brand/logo.svg',
    logoDark: __DIR__ . '/../assets/brand/logo-dark.svg',
    favicon: __DIR__ . '/../assets/brand/favicon.svg',
    colors: [
        'accent' => ['light' => '#0b6bcb', 'dark' => '#5aa7f0'],
        'accent-text' => '#0a58a8',
    ],
));
```

- Files must lie in an `assets/` folder of the extension, which is
  published to `public/assets/<vendor>/<package>/`.
- `colors` may set only tokens of the group `brand` (see the tables); a
  string counts for both modes. Unknown names or values that are not hex
  colors are an error.
- The design page shows the active brand and warns if a pair of colors
  falls below 4.5:1.
- Overriding views of the backend file by file is possible but breaks on
  updates; prefer the brand and your own screens.

## Screens of extensions

```php
use Frootbox\Backend\Screen;

$registry->mount('backend.path', '/cms')
    ->get('/acme/orders', OrdersHandler::class, 'acme.orders');

$registry->add(Screen::class, new Screen(
    label: 'Orders',
    route: 'acme.orders',
    group: Screen::CONTENT,
    icon: 'inbox',
    permission: 'acme/shop/order.list',
));
```

The handler renders a view of the extension with `BackendView::render()`;
views are found as `@acme/shop/orders.twig` in `views/` of the package and
extend `@backend/layout.twig` (block `title` and block `content`). Labels
of screens are English and translated like all texts.
