<!-- Written by bin/frootbox reference:build from the code. Do not edit. -->

# Actions and queries

Actions change data, queries read it. Every one has a right, which
a role grants by its name or a pattern such as `page.*`. Public ones need
no sign-in, those for the own account only one. Actions can be undone
with `action.undo` unless they say otherwise.

## frootbox/core

### `account.accept-invitation`

Sets the first password of an account with the link of an invitation

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `token` | string |  |
| `password` | string |  |

### `account.change-password`

Changes the own password and signs out everywhere else

Action · for the own account · cannot be undone

| Input | Type | Description |
|---|---|---|
| `currentPassword` | string |  |
| `newPassword` | string |  |

### `account.confirm-email-change`

Sets the new email of an account with the link from the mail

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `token` | string |  |

### `account.create-token`

Creates an API token for the own account

Action · for the own account · cannot be undone

| Input | Type | Description |
|---|---|---|
| `name` | string | What the token is for, e.g. "Deploy script" |
| `days` | integer or null, optional | Valid for this many days, without it until revoked |

### `account.email-change-show`

Returns the new email a confirmation link is for, null if it does not work any more

Query · public

| Input | Type | Description |
|---|---|---|
| `token` | string |  |

### `account.invitation-show`

Returns name and email of the person an invitation link is for, null if it does not work any more

Query · public

| Input | Type | Description |
|---|---|---|
| `token` | string |  |

### `account.languages`

Lists the languages of the backend, the chosen one and the one without a choice

Query · for the own account

### `account.oidc-complete`

Completes signing in through a provider of OpenID Connect and starts a session

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `provider` | string |  |
| `code` | string |  |
| `state` | string |  |
| `stored` | string |  |
| `device` | string or null, optional |  |

### `account.oidc-identities`

Lists the links of the own account to providers such as the hub

Query · for the own account

### `account.oidc-link`

Starts linking the own account to a provider such as the hub and returns the address for the browser

Action · for the own account · cannot be undone

| Input | Type | Description |
|---|---|---|
| `provider` | string |  |
| `next` | string or null, optional |  |

### `account.oidc-logout`

Ends sessions through a provider on its logout token and returns how many

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `provider` | string |  |
| `logoutToken` | string |  |

### `account.oidc-providers`

Lists the providers of OpenID Connect one can sign in with, such as the hub

Query · public

### `account.oidc-start`

Starts signing in through a provider of OpenID Connect such as the hub and returns the address for the browser

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `provider` | string | The key of the provider, e.g. "hub" |
| `next` | string or null, optional | Where to go after signing in, a path of the backend |
| `prompt` | string or null, optional | "none" for a silent sign-in, "login" to ask again |

### `account.oidc-unlink`

Removes the link of the own account to a provider such as the hub

Action · for the own account

| Input | Type | Description |
|---|---|---|
| `provider` | string |  |

### `account.password-reset-show`

Tells whether the website mails links for a forgotten password and whether a link still works

Query · public

| Input | Type | Description |
|---|---|---|
| `token` | string or null, optional | The token from the link, empty to only ask whether the website offers links |

### `account.request-email-change`

Changes the email of the own account after the current password: mails a link to the new address to confirm it, or changes it at once when the website sends no mails

Action · for the own account · cannot be undone

| Input | Type | Description |
|---|---|---|
| `email` | string (email) |  |
| `password` | string |  |

### `account.request-password-reset`

Mails a link for a new password to the email of an account; answers the same for unknown addresses

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `email` | string (email) |  |

### `account.reset-password`

Sets a new password with the link from the mail and signs out everywhere

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `token` | string |  |
| `password` | string |  |

### `account.revoke-token`

Ends one of the own sessions or API tokens

Action · for the own account · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | integer |  |

### `account.show`

Returns the signed-in user with their roles

Query · for the own account

### `account.sign-in`

Signs in with email and password and starts a session

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `email` | string (email) |  |
| `password` | string |  |
| `device` | string or null, optional |  |
| `remember` | boolean, optional | Stay signed in for days instead of hours |

### `account.sign-out`

Ends the current session

Action · for the own account · cannot be undone

### `account.tokens`

Lists the own sessions and API tokens

Query · for the own account

### `account.update`

Changes the name of the own account; the email changes with account.request-email-change

Action · for the own account

| Input | Type | Description |
|---|---|---|
| `name` | string |  |

### `account.update-language`

Sets the language of the backend for the own account, null for automatic

Action · for the own account

| Input | Type | Description |
|---|---|---|
| `language` | string or null, optional |  |

### `action.log`

Returns the log of actions, newest first: who ran which action when, through which channel and on which device, with input (secrets masked) and status. Filters by user, action (a trailing * for all of a prefix, e.g. page.*), channel, status and time; before pages through older entries

Query · right `action.log`

| Input | Type | Description |
|---|---|---|
| `user` | integer or null, optional | Only actions of this user |
| `action` | string or null, optional | Only this action, or all starting with what comes before a trailing * |
| `channel` | mixed: `web`, `api`, `app`, `mcp`, `ai`, `console`, `system`, `hub`, optional |  |
| `status` | mixed: `running`, `succeeded`, `failed`, `denied`, `invalid`, optional |  |
| `from` | string or null (date-time), optional | Only entries from this time on |
| `to` | string or null (date-time), optional | Only entries before this time |
| `nested` | boolean, optional | Also the nested actions an action ran |
| `limit` | integer, optional |  |
| `before` | integer or null, optional | Only entries older than this one, the next of the previous page |

### `action.undo`

Undoes an earlier action: restores the data it changed and runs its compensations. Fails if that data has changed since.

Action · right `action.undo`

| Input | Type | Description |
|---|---|---|
| `id` | integer | ID of the action in the action log |

### `ai.alt-text`

Suggests an alternative text for an image with the AI, which sees a smaller copy of it. Changes nothing; media.update saves the text

Action · right `ai.use` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | string | Id of the medium |
| `language` | string | Language of the text, e.g. "de" |
| `page` | string or null, optional | The page the image is on, for its title as context |
| `instruction` | string or null, optional | What to keep in mind, in the words of the person |

### `ai.field-write`

Suggests a new text for a headline, text or rich text field of a page with the AI: rephrase, shorten, expand, correct, translate from another language of the page or follow an own instruction, also to draft an empty field. Changes nothing; page.update-field saves the suggestion

Action · right `ai.use` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation, e.g. "de" |
| `path` | string | Path of the field, e.g. "title" or "slides/0/title" |
| `task` | mixed: `rephrase`, `shorten`, `expand`, `correct`, `translate`, `instruct` |  |
| `block` | string or null, optional | Id of the block; left out for a field of the layout |
| `instruction` | string or null, optional | What should change, in the words of the person; needed for "instruct", e.g. notes to draft an empty field from |
| `from` | string or null, optional | For "translate": the language to translate from, e.g. "en" |

### `ai.page-snippet`

Suggests a title and a description for search engines from the draft of a page with the AI. Changes nothing; page.update saves them as seoTitle and description

Action · right `ai.use` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation, e.g. "de" |
| `instruction` | string or null, optional | What to keep in mind, in the words of the person, e.g. a search term |

### `ai.status`

Returns whether the AI is there for the signed-in person and, if not, why: no provider, provider not set up, no permission ai.use or the monthly limit reached; also where the prices of the model come from

Query · for the own account

### `ai.test`

Sends a very small request to the AI provider to check its key and model, and returns the answer, the tokens, the cost in US dollars and the time it took

Action · right `settings.update` · cannot be undone

### `ai.usage`

Returns what the AI cost in a month in US dollars, with the monthly limit and what is left, by day, feature, person and model

Query · right `ai.usage`

| Input | Type | Description |
|---|---|---|
| `month` | string or null, optional | The month as YYYY-MM, empty for the current one |

### `block.groups`

Lists the groups of the block picker in their order, the core first

Query · right `page.tree`

### `block.list`

Lists the blocks with title, description, variants with their options, fields and areas

Query · right `page.tree`

### `category-group.create`

Adds a group of categories for one or more kinds of content, e.g. "Abteilung" for news and jobs

Action · right `category-group.create`

| Input | Type | Description |
|---|---|---|
| `title` | string |  |
| `types` | object | The types it applies to, e.g. ["frootbox/news/article", "frootbox/jobs/job"] |

### `category-group.delete`

Deletes a group of categories created in the backend; it must have no categories

Action · right `category-group.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `category-group.list`

The groups of categories with the kinds of content they apply to and how many categories each has

Query · for the own account

| Input | Type | Description |
|---|---|---|
| `type` | string or null, optional | Only the groups for this type, e.g. "frootbox/news/article" |

### `category-group.types`

The kinds of content a group of categories can apply to, each with its name

Query · right `category-group.create`

### `category-group.update`

Renames a group of categories created in the backend or changes its types

Action · right `category-group.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `title` | string or null, optional |  |
| `types` | null or object, optional | The types it applies to, replacing the ones before |

### `category.apply-presets`

Creates the categories the configuration or an extension sets out that do not exist yet; returns how many

Action · right `category.apply-presets`

| Input | Type | Description |
|---|---|---|
| `group` | string or null, optional | Only this group; left out for all |

### `category.create`

Adds a category to a group, at the top or below another one

Action · right `category.create`

| Input | Type | Description |
|---|---|---|
| `group` | string | The group, e.g. "frootbox/news/categories" |
| `translations` | object | Title, slug and description by language: {"de": {"title": "Kurse"}}; the slug is made from the title if left out |
| `parentId` | string or null, optional | The category above, left out for the top |
| `position` | integer or null, optional | Place among the siblings, 0 for the first; left out for the last |

### `category.delete`

Deletes a category with all below it; the objects in it stay

Action · right `category.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `category.list`

The categories of a group in the order of the tree, each with its depth

Query · public

| Input | Type | Description |
|---|---|---|
| `group` | string | The group, e.g. "frootbox/news/categories" |

### `category.move`

Puts a category below another one of its group or at the top

Action · right `category.move`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `parentId` | string or null, optional | The category above, null for the top |
| `position` | integer or null, optional | Place among the new siblings, 0 for the first; null for the last |

### `category.update`

Changes the title, slug and description of a category

Action · right `category.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `translations` | object | Title, slug and description by language; languages left out stay, null or empty fields remove one |

### `comment.count`

Returns how many threads of comments are open, on the website or on a page

Query · right `comment.list`

| Input | Type | Description |
|---|---|---|
| `pageId` | string or null, optional | Only the threads on this page |

### `comment.create`

Comments on a page, a block, a field or a landmark such as the footer, or on an element of the design page, optionally at a point of it, and opens a thread; guests with a preview link give their name

Action · also with a preview link, right `comment.create`

| Input | Type | Description |
|---|---|---|
| `body` | string | The text, plain text without markup |
| `pageId` | string or null, optional | The page the comment is about; left out for the design page |
| `authorName` | string or null, optional | The name of a guest with a preview link; users write under their own name |
| `blockId` | string or null, optional | The block the comment is about; left out for the page |
| `field` | string or null, optional | The field inside the block, e.g. "slides/0/title", or with site of the website |
| `site` | boolean, optional | Whether the field is one of the website, e.g. the address in the footer |
| `language` | string or null, optional | The language of the page as shown, e.g. "de" |
| `path` | string or null, optional | The address where it was written, e.g. "/kontakt" |
| `excerpt` | string or null, optional | The text at the place, to find it again |
| `viewport` | integer or null, optional | The width of the window in pixels |
| `design` | string or null, optional | The element of the design page /_design instead of a page, e.g. "tokens", "frootbox/theme-base/Hero/Split/1" or "page" for all of it |
| `landmark` | string or null, optional | The landmark of the page where no block or field is, e.g. "banner#1", "navigation#2:Footer" or "contentinfo#1" |
| `pointX` | integer or null, optional | Where in the place, in thousandths of its width from its start edge in the direction of reading |
| `pointY` | integer or null, optional | Where in the place, in thousandths of its height from the top |

### `comment.delete`

Deletes a reply, or a whole thread with its replies

Action · right `comment.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string | The reply, or the first comment of the thread |

### `comment.list`

Returns the threads of comments, newest first, with place, status and replies; guests with a preview link get those of their link

Query · also with a preview link, right `comment.list`

| Input | Type | Description |
|---|---|---|
| `pageId` | string or null, optional | Only the threads on this page |
| `status` | mixed: `open`, `done`, optional | Only open or only done threads |
| `design` | boolean, optional | Only the threads on the design page /_design |

### `comment.reopen`

Opens a thread of comments that was done again

Action · right `comment.reopen`

| Input | Type | Description |
|---|---|---|
| `id` | string | The thread or one of its comments |

### `comment.reply`

Replies in the thread of a comment; guests with a preview link reply in the threads of their link

Action · also with a preview link, right `comment.reply`

| Input | Type | Description |
|---|---|---|
| `commentId` | string | The thread or one of its comments |
| `body` | string | The text, plain text without markup |
| `authorName` | string or null, optional | The name of a guest with a preview link; users write under their own name |

### `comment.resolve`

Marks a thread of comments as done

Action · right `comment.resolve`

| Input | Type | Description |
|---|---|---|
| `id` | string | The thread or one of its comments |

### `consent.proof.list`

Lists the kept choices of a consent ID a visitor reads in the privacy settings, the newest first

Query · right `consent.proof.list`

| Input | Type | Description |
|---|---|---|
| `consentId` | string | The consent ID, e.g. "0f8c…" |

### `consent.services`

Lists the services of other providers that load on the website after consent, with purpose and reach, and the consent tool that takes over

Query · public

### `design.discard`

Throws away the draft of the design

Action · right `design.discard`

### `design.publish`

Publishes the draft of the design; visitors see it right away

Action · right `design.publish`

### `design.restore`

Makes a new draft of the design from an earlier version

Action · right `design.restore`

| Input | Type | Description |
|---|---|---|
| `version` | integer |  |

### `design.show`

Returns the tokens of the active theme that editors may change, with the values of draft, published design and theme

Query · right `design.show`

### `design.update`

Changes tokens of the active theme in the draft of the design; design.publish puts it online

Action · right `design.update`

| Input | Type | Description |
|---|---|---|
| `tokens` | object | Values by token name as design.show lists them, e.g. {"color-primary": "#8a4b2a"}; null goes back to the value of the theme |

### `design.versions`

Lists the published versions of the design, the newest first

Query · right `design.versions`

### `help.list`

Lists the pages of the help the user may read, optionally only those about a screen, block, action or field type

Query · for the own account

| Input | Type | Description |
|---|---|---|
| `about` | string or null, optional | Only pages about this, e.g. "screen:backend.pages" or "action:page.publish" |

### `help.show`

Shows a page of the help as HTML, links to other pages follow the given address

Query · for the own account

| Input | Type | Description |
|---|---|---|
| `id` | string | e.g. "frootbox/backend/pages" |
| `links` | string, optional | The address of a help page with {id}, for links between them |

### `icon.list`

Lists the symbols an icon field can show, from the theme, extensions and the media library, with name, label and SVG; filtered by set, a search in labels and names or one name

Query · right `icon.list`

| Input | Type | Description |
|---|---|---|
| `search` | string or null, optional | Part of the label or name |
| `set` | string or null, optional | Only this set, e.g. "theme", "media" or "acme/fontawesome/solid"; none for all |
| `name` | string or null, optional | Only the symbol of this name, e.g. to show the one a field holds |
| `page` | integer, optional |  |
| `perPage` | integer, optional |  |

### `layout.list`

Lists the layouts a page can have, with title, description and variants

Query · right `page.tree`

### `mail.status`

Returns how mails leave the server: transport, where it is set, SMTP server and sender, never a password

Query · right `mail.status`

### `mail.test`

Sends a short test mail right away, not through the queue, to an address or the own account, and returns how mails leave the server

Action · right `mail.test` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `to` | string or null (email), optional | The recipient, empty for the address of the own account |

### `media.create`

Adds an image (JPEG, PNG, WebP, GIF, SVG), a video or a document from an upload to the media library; it becomes public with the first published page that uses it. Is the same file already there, it gives that medium with "existing": true and keeps its folder, texts and tags

Action · right `media.create`

| Input | Type | Description |
|---|---|---|
| `upload` | string | The token from POST /api/v1/uploads, or from an "upload" step of a seed file |
| `folderId` | string or null, optional | The folder, none for the top |
| `texts` | object, optional | Alternative text and title by language, e.g. {"de": {"alt": "Röster am Hafen", "title": ""}} |
| `tags` | array, optional |  |
| `copyright` | string or null, optional | Photographer or image agency, e.g. "Anna Muster / Bildagentur"; left out, it comes from the IPTC or EXIF data of the file, if there |
| `ai` | mixed: `none`, `generated`, `edited`, optional | Whether an AI made ("generated") or changed ("edited") it, shown as a badge on the image; left out, it comes from IPTC DigitalSourceType in the file, if there |

### `media.credits`

Returns the image credits: every published medium with a copyright that visitors see, with the pages that show it, e.g. for the imprint

Query · public

| Input | Type | Description |
|---|---|---|
| `language` | string or null, optional | The language of the content, e.g. "de"; left out, the default language |

### `media.delete`

Deletes a medium that no published page or field uses (409 otherwise, see media.usages); drafts that use it show nothing there any more

Action · right `media.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `media.discard`

Removes the draft of a medium; it stays as visitors see it

Action · right `media.discard`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `media.folder-create`

Creates a folder in the media library

Action · right `media.folder-create`

| Input | Type | Description |
|---|---|---|
| `name` | string |  |
| `parentId` | string or null, optional | The folder it goes into, none for the top |

### `media.folder-delete`

Deletes an empty folder of the media library

Action · right `media.folder-delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `media.folder-update`

Renames a folder of the media library or moves it

Action · right `media.folder-update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `name` | string or null, optional |  |
| `parentId` | string or null, optional | Another folder it goes into, "" for the top |

### `media.folders`

Returns all folders of the media library by name, with the number of media in each

Query · right `media.list`

### `media.list`

Returns media of the library, newest first, filtered by folder, tag, a search in file names and texts, only those used nowhere, only those with a draft, only those a page uses, only images, videos or documents, only those with an AI label

Query · right `media.list`

| Input | Type | Description |
|---|---|---|
| `folderId` | string or null, optional | Only this folder, "" for the top; none for all |
| `tag` | string or null, optional |  |
| `search` | string or null, optional | Part of the file name, alternative text or title |
| `unused` | boolean, optional | Only media that no page and no field of the website uses, neither in a draft nor published |
| `changed` | boolean, optional | Only media with a draft that is not published yet |
| `pageId` | string or null, optional | Only media this page uses: its draft, or the published state if it has none |
| `kind` | string or null, optional | "image", "video" or "document" for only images, videos or documents; none for all |
| `ai` | boolean, optional | Only media an AI made or changed |
| `page` | integer, optional |  |
| `perPage` | integer, optional |  |

### `media.publish`

Publishes the drafts of one or more media: new texts and focus point show on every page that uses them

Action · right `media.publish`

| Input | Type | Description |
|---|---|---|
| `ids` | array | Ids of media with a draft; media.usages tells where each one is used |

### `media.replace`

Gives a medium a new file for every place that uses it; the focus point stays. A public medium gets it in its draft until media.publish. To change the image at one place only, upload it as a new medium with media.create instead

Action · right `media.replace`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `upload` | string | The token of the new file from the upload address |

### `media.show`

Returns a medium with texts, tags, focus point and a preview address

Query · right `media.list`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `media.source-add`

Adds a further file to a video, the same film in another format or codec, e.g. WebM with VP9 or MP4 with HEVC next to MP4 with H.264. Browsers take the first file they can play; the order follows the codec, the most efficient first and H.264 last. It counts at once, without draft

Action · right `media.source-add`

| Input | Type | Description |
|---|---|---|
| `id` | string | The video |
| `upload` | string | The token of the new file from the upload address |

### `media.source-delete`

Deletes a further file of a video; the file of the medium itself stays

Action · right `media.source-delete`

| Input | Type | Description |
|---|---|---|
| `id` | string | The video |
| `sourceId` | string | The id of the file, from sources in media.show |

### `media.update`

Changes folder, focus point, texts, copyright, AI label or tags of a medium; what is left out stays. Folder and tags count at once; focus point, texts, copyright and AI label of a public medium go into its draft until media.publish

Action · right `media.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `folderId` | string or null, optional | Another folder, "" for the top |
| `focusX` | number or null, optional | The focus point from the left, 0 to 1; the image is cut around it |
| `focusY` | number or null, optional | The focus point from the top, 0 to 1 |
| `texts` | null or object, optional | Alternative text and title by language; languages given are replaced |
| `tags` | array or null, optional | All tags of the medium |
| `copyright` | string or null, optional | Photographer or image agency, shown with the image where the theme shows it; "" for none |
| `ai` | mixed: `none`, `generated`, `edited`, optional | Whether an AI made ("generated") or changed ("edited") it, "none" for neither; shown as a badge on the image |

### `media.usages`

Returns where a medium is used: pages and the fields of the website, by language, in the draft or published

Query · right `media.list`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `navigation.copy`

Copies the items of a navigation from one language into another in its draft, replacing the items there

Action · right `navigation.copy`

| Input | Type | Description |
|---|---|---|
| `name` | string |  |
| `from` | string | Language to copy from, e.g. "de" |
| `to` | string | Language to copy to, e.g. "en" |

### `navigation.discard`

Throws away the draft of a navigation

Action · right `navigation.discard`

| Input | Type | Description |
|---|---|---|
| `name` | string |  |

### `navigation.list`

Lists the navigations of the theme with their draft and published items

Query · right `navigation.list`

### `navigation.publish`

Publishes the drafts of one or more navigations together

Action · right `navigation.publish`

| Input | Type | Description |
|---|---|---|
| `names` | array | Names of the navigations, e.g. ["main", "footer"] |

### `navigation.show`

Returns a navigation with its draft and its published items by language

Query · right `navigation.show`

| Input | Type | Description |
|---|---|---|
| `name` | string |  |

### `navigation.update`

Replaces the items of a navigation in one or more languages in its draft

Action · right `navigation.update`

| Input | Type | Description |
|---|---|---|
| `name` | string | Name of the navigation as declared by the theme, e.g. "main" |
| `items` | object | Items by language; a language set to null is removed, languages left out stay: {"de": [{"type": "target", "target": "page:01J…"}, {"type": "phone", "phone": "+49 40 123456"}]}. Types: target, url, anchor, phone, email, heading, pages |

### `not-found.clear`

Empties the log of paths that found nothing and returns how many were removed

Action · right `not-found.clear` · cannot be undone

### `not-found.list`

Returns paths that found nothing, the most frequent first, with count and first and last request

Query · right `not-found.list`

| Input | Type | Description |
|---|---|---|
| `limit` | integer, optional |  |

### `object.fields`

The further fields of a type of objects, e.g. "frootbox/jobs/job", with "space" also those of a space, e.g. a collection: name, field type, label (and labels by language), the JSON schema of a value and whether it holds one per language. Actions of the module take them as "fields".

Query · for the own account

| Input | Type | Description |
|---|---|---|
| `type` | string | The type of the objects, e.g. "frootbox/news/article" |
| `space` | string or null, optional | With the fields of this space, e.g. those of a collection from the backend |

### `object.update-field`

Changes one further field of an object, e.g. the subtitle of a news article, in its draft through the action "<type>.update" of the module; fails with 409 if the field no longer holds "previous"

Action · for the own account

| Input | Type | Description |
|---|---|---|
| `target` | string | The object, e.g. "frootbox/news/article:<id>" |
| `language` | string | Language of the value, e.g. "de"; fields with one value for all languages ignore it |
| `name` | string | Name of the field as object.fields lists it, e.g. "subtitle" |
| `value` | mixed, optional | The new value as the type of the field stores it; null removes it |
| `previous` | mixed, optional | The value as it was read, in this language or its fallback; if the field holds something else now, nothing is saved |

### `page.add-block`

Adds a block to an area of the layout or of a block of a page, in its draft; answers with the id of the new block

Action · right `page.add-block`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation to change, e.g. "de" |
| `name` | string | Full name of the block, e.g. "acme/website/Teaser" |
| `area` | string | Name of the area, e.g. "main" |
| `parent` | string or null, optional | Id of the block that holds the area; left out for an area of the layout |
| `after` | string or null, optional | Id of the block in the area after which the new one goes; left out for the start |
| `variant` | string or null, optional | Variant of the block, e.g. "Wide"; left out for Default |
| `options` | object, optional | Chosen view options of the variant |
| `fields` | object, optional | Values of the fields to begin with |

### `page.add-list-entry`

Adds an entry to a list field of the layout or of a block of a page, in its draft

Action · right `page.add-list-entry`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation to change, e.g. "de" |
| `path` | string | Path of the list field, e.g. "slides" |
| `block` | string or null, optional | Id of the block; left out for a field of the layout |
| `index` | integer or null, optional | Position of the new entry; left out for the end |
| `fields` | object, optional | Values of the fields of the entry to begin with |

### `page.copy-block`

Copies a block of a page with everything inside it right after it, in its draft; answers with the id of the copy

Action · right `page.copy-block`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation to change, e.g. "de" |
| `block` | string | Id of the block to copy |

### `page.create`

Creates a page as a draft; page.publish puts it online

Action · right `page.create`

| Input | Type | Description |
|---|---|---|
| `layout` | string | Full name of the layout, e.g. "acme/website/Page" |
| `translations` | object | Title, slug and content by language: {"de": {"title": "Über uns", "slug": "ueber-uns", "content": {"fields": {}, "areas": {"main": [{"block": "acme/website/Text", "fields": {}}]}}}}. The slug is made from the title if left out. |
| `parentId` | string or null, optional | The parent page; left out only for the start page |
| `position` | integer or null, optional | Place among the pages next to it, 0 for the first; left out for the last |
| `variant` | string or null, optional | Variant of the layout, left out for its default |

### `page.delete`

Deletes a page without subpages, published state and draft

Action · right `page.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `page.discard`

Throws away the draft of a page; a page that was never published is gone then

Action · right `page.discard`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `page.history`

Returns who changed a page when, through which channel and on which device, newest first, with each change by language, block and field and its old and new value. Filters by block, path and language; before pages through older entries

Query · right `page.show`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `block` | string or null, optional | Only changes in or of this block, by its id |
| `path` | string or null, optional | Only changes at or below this path, e.g. "fields/title" |
| `language` | string or null, optional | Only changes of this language and of the whole page |
| `limit` | integer, optional |  |
| `before` | integer or null, optional | Only entries older than this one, the next of the previous page |

### `page.lock`

Locks a published page for visitors right away (503) without taking it offline; the draft stays as it is

Action · right `page.lock`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `branch` | boolean, optional | Also lock all pages below it |

### `page.move`

Moves a page to another parent or place in its draft

Action · right `page.move`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `parentId` | string | The new parent page |
| `position` | integer or null, optional | Place among the pages next to it, 0 for the first; left out for the last |

### `page.move-block`

Moves a block of a page to another place, also into another area, in its draft

Action · right `page.move-block`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation to change, e.g. "de" |
| `block` | string | Id of the block to move |
| `area` | string | Name of the target area, e.g. "main" |
| `parent` | string or null, optional | Id of the block that holds the target area; left out for an area of the layout |
| `after` | string or null, optional | Id of the block after which it goes; left out for the start of the area |

### `page.move-list-entry`

Moves an entry of a list field of a page to another position, in its draft

Action · right `page.move-list-entry`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation to change, e.g. "de" |
| `path` | string | Path of the entry, e.g. "slides/2" |
| `to` | integer | The new position of the entry, counted from 0 |
| `block` | string or null, optional | Id of the block; left out for a field of the layout |

### `page.outline`

Returns the headings of a page in order with the level each gets, from the draft or the published page

Query · right `page.show`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string or null, optional |  |
| `draft` | boolean, optional |  |

### `page.publish`

Publishes the drafts of one or more pages together

Action · right `page.publish`

| Input | Type | Description |
|---|---|---|
| `ids` | array | Ids of the pages; a parent that is only a draft must be in the list, too |

### `page.remove-block`

Removes a block of a page with everything inside it, in its draft

Action · right `page.remove-block`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation to change, e.g. "de" |
| `block` | string | Id of the block to remove |

### `page.remove-list-entry`

Removes an entry of a list field of a page, in its draft

Action · right `page.remove-list-entry`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation to change, e.g. "de" |
| `path` | string | Path of the entry, e.g. "slides/2" |
| `block` | string or null, optional | Id of the block; left out for a field of the layout |

### `page.restore`

Makes a new draft from an earlier version of a page, also of a deleted one

Action · right `page.restore`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `version` | integer |  |

### `page.schedule`

Plans when the draft of a page is published and when the page goes offline

Action · right `page.schedule`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `publishAt` | string or null (date-time), optional | When the draft is published, e.g. "2026-12-01T08:00:00+01:00"; left out or null for no time |
| `unpublishAt` | string or null (date-time), optional | When the page and its subpages go offline; left out or null for no time |

### `page.show`

Returns a page with its draft, its published state and where visitors find it

Query · right `page.show`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `page.slug`

Makes the address of a page from its title by the rules of a language, e.g. "Київ" in Ukrainian becomes "kyiv"; empty if the title has nothing to make one from

Query · right `page.tree`

| Input | Type | Description |
|---|---|---|
| `title` | string |  |
| `language` | string, optional |  |

### `page.tree`

Returns all pages as a tree with titles, slugs, status and what plugin each shows, drafts included; with a role only within branches those and the way to them

Query · right `page.tree`

### `page.unlock`

Lifts the lock of a page set with page.lock; a lock of a page above stays

Action · right `page.unlock`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `page.unpublish`

Takes a page and its subpages offline; they stay as drafts and can be published again

Action · right `page.unpublish`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `page.update`

Changes layout, titles, slugs, content or the exclusions from searches of a page in its draft

Action · right `page.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `translations` | null or object, optional | Changes by language; left out parts stay as they are, a language set to null is removed: {"de": {"title": "Neu"}, "en": null} |
| `layout` | string or null, optional | Full name of the layout, left out to keep it |
| `variant` | string or null, optional | Variant of the layout, left out to keep it, "Default" for the default |
| `excludeFromSearchEngines` | mixed: `none`, `page`, `branch`, optional | noindex for search engines and not in the sitemap: "page", "branch" for the page and all below it, "none"; left out to keep it |
| `excludeFromSiteSearch` | mixed: `none`, `page`, `branch`, optional | Left out by the site search: "page", "branch" or "none"; left out to keep it |

### `page.update-block`

Changes the variant or the view options of a block of a page, in its draft

Action · right `page.update-block`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation to change, e.g. "de" |
| `block` | string | Id of the block |
| `variant` | string or null, optional | The new variant, e.g. "Wide" or "Default"; left out to keep it |
| `options` | null or object, optional | All chosen view options; left out to keep them |

### `page.update-field`

Changes one field of the layout or of a block of a page in its draft; fails with 409 if the field no longer holds "previous"

Action · right `page.update-field`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `language` | string | Language of the translation to change, e.g. "de" |
| `path` | string | Path of the field, e.g. "title" or "slides/0/title" for a field of the first entry of a list |
| `value` | mixed, optional | The new value as the type of the field stores it; null empties the field |
| `previous` | mixed, optional | The value as it was read; if the field holds something else now, nothing is saved |
| `block` | string or null, optional | Id of the block, e.g. "k3x9q2mf"; left out for a field of the layout |

### `page.versions`

Lists the published versions of a page, the newest first

Query · right `page.versions`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `permission.list`

Lists every permission a role can grant, with a description

Query · right `role.list`

### `plugin.assign`

Lets a page show a space of a plugin, e.g. the news or one space of the jobs, or nothing; in the draft of the page

Action · right `plugin.assign`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `type` | string or null, optional | The type of the plugin, e.g. "frootbox/jobs/job"; null to show none |
| `space` | string, optional | The space, "default" for the default one |
| `details` | boolean or null, optional | Pages of their own for the objects, where the plugin lets the admin choose; left out for yes |
| `categories` | boolean or null, optional | Pages of their own for the categories, e.g. /news/presse, where the plugin offers them; left out for no |
| `newSpace` | string or null, optional | The name of a new space to create and show instead of "space", e.g. "Ausbildung" |

### `plugin.list`

The plugins a page can show, each with its spaces, the page that shows each and how many objects each holds

Query · right `plugin.assign`

### `preview.create`

Creates a link that shows the whole website in its current draft to someone without an account, read only, and answers with its address

Action · right `preview.create`

| Input | Type | Description |
|---|---|---|
| `note` | string or null, optional | Who the link is for, e.g. "for Ms Miller" |
| `expiresAt` | string or null (date-time), optional | When the link stops working, e.g. "2026-12-01T00:00:00+01:00"; left out for 14 days from now, at most 90 days |
| `pageId` | string or null, optional | The page the link opens; left out for the start page |
| `design` | boolean, optional | Whether the link opens the design page /_design with every element of the website, e.g. for an agency; then without pageId |

### `preview.list`

Returns the preview links, newest first, with note, status, address and when they were last opened

Query · right `preview.list`

### `preview.open`

Checks the token of a preview link when it is opened and counts the visit

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `token` | string |  |

### `preview.revoke`

Revokes a preview link at once; whoever has it sees a notice instead of the website

Action · right `preview.revoke`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `preview.update`

Changes the note or extends a preview link, also an expired one; a revoked link stays revoked

Action · right `preview.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `note` | string or null, optional | A new note; left out to keep it, empty to remove it |
| `expiresAt` | string or null (date-time), optional | A new end, at most 90 days from now; left out to keep it |

### `redirect.create`

Redirects a path, e.g. an old URL, to a page or another URL

Action · right `redirect.create`

| Input | Type | Description |
|---|---|---|
| `path` | string | The path of the request without query, e.g. "/old-page.html" |
| `target` | string or null, optional | The page to go to, e.g. "page:01J…"; it follows the page when it moves |
| `location` | string or null, optional | A URL or path to go to instead of a page, e.g. "https://example.com" |
| `permanent` | boolean, optional | 301 if true, otherwise 302 |

### `redirect.delete`

Deletes a redirect

Action · right `redirect.delete`

| Input | Type | Description |
|---|---|---|
| `id` | integer |  |

### `redirect.list`

Returns the manual redirects by path

Query · right `redirect.list`

### `redirect.update`

Changes the path or destination of a redirect

Action · right `redirect.update`

| Input | Type | Description |
|---|---|---|
| `id` | integer |  |
| `path` | string | The path of the request without query, e.g. "/old-page.html" |
| `target` | string or null, optional | The page to go to, e.g. "page:01J…" |
| `location` | string or null, optional | A URL or path to go to instead of a page |
| `permanent` | boolean, optional | 301 if true, otherwise 302 |

### `role.create`

Creates a role that bundles permissions

Action · right `role.create`

| Input | Type | Description |
|---|---|---|
| `name` | string | Short name, e.g. "editor" |
| `title` | string |  |
| `permissions` | array, optional | Rules such as "*", "page.*", "media.upload" or "-page.delete" |
| `level` | integer, optional | Rank: users manage users up to their own level and roles below it |

### `role.delete`

Deletes a role and takes it away from all users

Action · right `role.delete`

| Input | Type | Description |
|---|---|---|
| `name` | string |  |

### `role.list`

Lists all roles with their permissions

Query · right `role.list`

### `role.update`

Changes the title, permissions and level of a role

Action · right `role.update`

| Input | Type | Description |
|---|---|---|
| `name` | string |  |
| `title` | string |  |
| `permissions` | array |  |
| `level` | integer |  |

### `search.find`

Finds pages, media, users and everything else the user may see by words, drafts included, best hits first

Query · for the own account

| Input | Type | Description |
|---|---|---|
| `q` | string |  |
| `sources` | array or null, optional | Only these sources, e.g. ["page", "medium"]; none for all |
| `limit` | integer, optional |  |

### `settings.list`

Lists the settings of all extensions; secrets only say whether they are set

Query · right `settings.list`

### `settings.set-secret`

Sets or removes a secret setting of an extension such as an API key, stored encrypted

Action · right `settings.set-secret` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `package` | string | The Composer package of the extension, e.g. "acme/shop", with a section "acme/shop.mail" |
| `name` | string |  |
| `value` | string or null | The secret, null or empty to remove it |

### `settings.show`

Returns the settings of one extension; secrets only say whether they are set

Query · right `settings.show`

| Input | Type | Description |
|---|---|---|
| `package` | string | The Composer package of the extension, e.g. "acme/shop", with a section "acme/shop.mail" |

### `settings.update`

Changes settings of an extension that are not secrets; a value equal to the default resets it

Action · right `settings.update`

| Input | Type | Description |
|---|---|---|
| `package` | string | The Composer package of the extension, e.g. "acme/shop", with a section "acme/shop.mail" |
| `values` | object | New values by name, see settings.show |

### `site.discard`

Discards the draft of the fields of the website; the published values stay

Action · right `site.discard`

### `site.enter`

Checks the password of the protected website and lets the visitor in

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `password` | string |  |

### `site.protect`

Protects the whole website with a password, or sets a new one; visitors then need it, signed-in users and preview links do not

Action · right `protection.manage` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `password` | string | The password visitors enter, at least 8 characters |

### `site.protection`

Returns whether the website is protected by a password, whether .env forces it and since when

Query · for the own account

### `site.publish`

Publishes the draft of the fields of the website; visitors see them right away

Action · right `site.publish`

### `site.show`

Returns the fields of the website the theme describes, e.g. name and address, with their values per language

Query · right `site.show`

### `site.unprotect`

Switches the password of the website off, so everyone sees it again

Action · right `protection.manage` · cannot be undone

### `site.update`

Changes fields of the website, e.g. name and address, in the draft of one language; site.publish puts them online

Action · right `site.update`

| Input | Type | Description |
|---|---|---|
| `language` | string | Language of the values, e.g. "de" |
| `fields` | object | Values by field name as site.show lists them, e.g. {"address": "Harbour Street 12"}; null removes a value, so the one of the first language shows |

### `site.update-field`

Changes one field of the website, e.g. the address in the footer, in the draft of one language; fails with 409 if the field no longer holds "previous"

Action · right `site.update-field`

| Input | Type | Description |
|---|---|---|
| `language` | string | Language of the value, e.g. "de" |
| `path` | string | Path of the field as site.show lists it, e.g. "address" or "links/0/text" for a field of the first entry of a list |
| `value` | mixed, optional | The new value as the type of the field stores it; null removes it, so the value of the first language shows |
| `previous` | mixed, optional | The value as it was read; if the field holds something else now, nothing is saved |

### `space.all`

The spaces of all plugins with the scope for giving a role only there, e.g. "space:frootbox/jobs/job:default"; see user.assign-role

Query · for the own account

### `space.create`

Adds a space to a plugin, e.g. the jobs "Ausbildung" next to all other jobs, for its own page

Action · right `space.create`

| Input | Type | Description |
|---|---|---|
| `type` | string | The type of the plugin, e.g. "frootbox/jobs/job" |
| `title` | string | The name editors see, e.g. "Ausbildung" |

### `space.delete`

Deletes an empty space of a plugin that no page shows

Action · right `space.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `space.list`

The spaces of a plugin with the page that shows each, the default one first

Query · for the own account

| Input | Type | Description |
|---|---|---|
| `type` | string | The type of the plugin, e.g. "frootbox/jobs/job" |
| `permission` | string or null, optional | Only the spaces where the user holds this permission, e.g. "frootbox/jobs/job.list"; left out for all |

### `space.update`

Renames a space of a plugin, also the default one with its type

Action · right `space.update`

| Input | Type | Description |
|---|---|---|
| `id` | string | The id of the space, "default" for the default one |
| `title` | string |  |
| `type` | string or null, optional | The type of the plugin, needed for the default space, e.g. "frootbox/collections/entry" |

### `status.show`

Returns the technical status of the website: versions, cron, queue, backup, disk space, drafts, last change and how mails leave the server, without personal data or contents

Query · right `status.show`

### `system.backup-create`

Makes a backup of the database by hand, which stays until someone deletes it

Action · right `system.backup-create` · cannot be undone

### `system.backup-delete`

Deletes a backup of the database for good

Action · right `system.backup-delete` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `name` | string |  |

### `system.backup-list`

Lists the backups of the database, newest first, and whether they can be restored here

Query · right `system.backup-list`

### `system.cache-clear`

Empties var/cache: pages for guests, compiled templates and everything else there is rebuilt on the next request

Action · right `system.cache-clear` · cannot be undone

### `system.component-usages`

Lists the blocks and layouts used on pages, in drafts or published, with the pages and whether their extension is installed

Query · right `system.component-usages`

| Input | Type | Description |
|---|---|---|
| `package` | string or null, optional | Only the blocks and layouts of this extension, e.g. "frootbox/news" |
| `missing` | boolean, optional | Only those whose extension is not installed |

### `system.end-sessions`

Ends the sessions of all users and visitors and returns how many; API tokens stay

Action · right `system.end-sessions` · cannot be undone

### `system.extension-list`

Lists the installed extensions with version, theme, and the blocks, layouts, actions, queries, field types, jobs, search sources and commands they bring, and the official modules that are not installed

Query · right `system.extension-list`

### `system.hub-complete`

Connects the website to the hub with a one-time code from it

Action · right `system.hub-complete` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `code` | string | The one-time code from the hub |
| `request` | string or null, optional | The request the code confirms; without it the code alone connects |
| `status` | boolean, optional | Without request: let the hub read the status of the website |

### `system.hub-connect`

Opens a request to connect the website to the hub, to confirm there

Action · right `system.hub-connect` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `status` | boolean, optional | Let the hub read the status of the website |
| `return` | string or null, optional | Where the hub sends the browser back with the code, an address of this website, e.g. the screen of the backend |

### `system.hub-disconnect`

Disconnects the website from the hub and deletes its access at once

Action · right `system.hub-disconnect` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `notify` | boolean, optional | Tell the hub; false when the hub itself disconnected |
| `forgetKey` | boolean, optional | Also forget the key pair of the website, e.g. in a copy of it |

### `system.hub-keys`

Replaces the public keys of the hub the website trusts

Action · right `system.hub-keys` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `keys` | array | Public keys "whpk_…" of the hub, at least one |

### `system.hub-show`

Shows the connection of the website to the hub

Query · right `system.hub-show`

### `system.hub-switch`

Turns on or off what the hub may do: read the status, let people sign in

Action · right `system.hub-switch` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `status` | boolean or null, optional | Let the hub read the status of the website; unchanged if left out |
| `login` | boolean or null, optional | Let people sign in through the hub; unchanged if left out |
| `maxRole` | string or null, optional | The highest role the hub may give: editor, admin (default) or superuser |

### `system.job-delete`

Removes a job from the queue without running it

Action · right `system.job-delete` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `system.job-list`

Lists the jobs of the queue, waiting and failed ones with their last error, and whether cron runs

Query · right `system.job-list`

### `system.job-retry`

Puts a job back in the queue to run now, with all its attempts

Action · right `system.job-retry` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `system.media-usages`

Builds the index of where media are used anew from pages and the fields of the website and returns how many entries changed

Action · right `system.media-usages`

### `system.migrate`

Runs all pending migrations of the core and the extensions, after a backup of the database

Action · right `system.migrate` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `withoutBackup` | boolean, optional | Run them even if no backup can be made before |

### `system.migration-list`

Lists the migrations of the core and the extensions that have not run yet, with their package, and whether a backup can be made before

Query · right `system.migration-list`

### `system.php-info`

Shows how PHP is set up: versions, SAPI, ini files, OPcache, the most important directives and every loaded extension with its directives, without environment variables and with secrets masked. Search filters extensions and directives by name

Query · right `system.php-info`

| Input | Type | Description |
|---|---|---|
| `search` | string or null, optional | Only extensions and directives whose name contains this |

### `system.prune-previews`

Deletes preview links 30 days after they expired or were revoked and returns how many

Action · right `system.prune-previews`

### `system.queue-status`

Returns how many jobs are due or failed and whether cron runs

Query · right `system.queue-status`

### `system.sync-urls`

Brings the stored URLs of all pages up to date and returns how many changed

Action · right `system.sync-urls`

### `tag.choices`

What a form offers for the tags of an object: the chosen ones, the presets and the most used ones; closed when only presets count

Query · for the own account

| Input | Type | Description |
|---|---|---|
| `type` | string | The type of the object, e.g. "frootbox/jobs/job" |
| `space` | string or null, optional | The space of the object, left out for the default one |
| `chosen` | object, optional | Ids of the tags it has |

### `tag.create`

Adds a tag to the common stock with a label per language

Action · right `tag.create`

| Input | Type | Description |
|---|---|---|
| `labels` | object | Labels by language: {"de": "Nachhaltigkeit", "en": "Sustainability"} |
| `key` | string or null, optional | A fixed key of a-z, 0-9 and hyphens, e.g. "featured"; made from the first label if left out |
| `internal` | boolean, optional | Only for selecting and switching, never shown to visitors |

### `tag.delete`

Deletes a tag; the objects with it stay

Action · right `tag.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `tag.list`

The tags of the common stock by label, with how many published objects have each

Query · for the own account

| Input | Type | Description |
|---|---|---|
| `query` | string, optional | Only tags whose key or a label contains this |
| `type` | string or null, optional | Count only objects of this type, e.g. "frootbox/jobs/job" |

### `tag.merge`

Puts everything with one tag on another one, e.g. two spellings of a word

Action · right `tag.merge`

| Input | Type | Description |
|---|---|---|
| `id` | string | The tag that goes |
| `into` | string | The tag that stays |

### `tag.options`

The tags as choices for a block, "Any" first; the value is the key of the tag

Query · for the own account

### `tag.update`

Changes the labels of a tag or whether it is internal; the key stays

Action · right `tag.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `labels` | null or object, optional | Labels by language; languages left out stay, an empty one goes |
| `internal` | boolean or null, optional | Only for selecting and switching, never shown to visitors |

### `user.assign-role`

Gives a user a role, everywhere or only within a scope

Action · right `user.assign-role`

| Input | Type | Description |
|---|---|---|
| `userId` | integer |  |
| `role` | string | Name of the role, e.g. "editor" |
| `scope` | string or null, optional | Only within this scope, e.g. "page:01J…" for a page and everything below it or "space:frootbox/jobs/job:default" for a space of a plugin, see space.all |

### `user.create`

Creates a user who signs in with email and password, or a service account that only uses API tokens

Action · right `user.create`

| Input | Type | Description |
|---|---|---|
| `email` | string or null (email) | Required for a person, none for a service account |
| `name` | string |  |
| `password` | string or null, optional | Without a password the user cannot sign in until one is set |
| `roles` | array, optional | Role names, e.g. ["editor"] |
| `active` | boolean, optional |  |
| `kind` | mixed: `person`, `service`, optional | "service" for a service account: no email, no password, tokens only from user.create-token |
| `invite` | boolean, optional | Mails the person a link to choose a password, instead of one given here |

### `user.create-token`

Creates an API token for a service account, shown only once

Action · right `user.update` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | integer | The service account |
| `name` | string | What the token is for, e.g. "Status for monitoring" |
| `days` | integer or null, optional | Valid for this many days, without it until revoked |

### `user.delete`

Deletes a user

Action · right `user.delete`

| Input | Type | Description |
|---|---|---|
| `id` | integer |  |

### `user.grant-access`

Gives a person of a provider such as the hub an account with one standard role, or links the account with the same email

Action · right `user.grant-access`

| Input | Type | Description |
|---|---|---|
| `provider` | string |  |
| `subject` | string |  |
| `email` | string (email) |  |
| `name` | string |  |
| `role` | string |  |

### `user.identities`

Lists the links of a user to providers such as the hub

Query · right `user.show`

| Input | Type | Description |
|---|---|---|
| `userId` | integer |  |

### `user.invite`

Mails a person without a password an invitation with a link to set one; works again until they have

Action · right `user.invite` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | integer |  |

### `user.list`

Lists all users by name

Query · right `user.list`

### `user.managed-list`

Lists the users whose role and lock come from a provider such as the hub

Query · right `user.list`

### `user.remove-role`

Takes a role away from a user

Action · right `user.remove-role`

| Input | Type | Description |
|---|---|---|
| `userId` | integer |  |
| `role` | string |  |
| `scope` | string or null, optional |  |

### `user.revoke-access`

Locks the account a provider such as the hub manages, or removes the link of a linked one, and ends its sessions

Action · right `user.revoke-access`

| Input | Type | Description |
|---|---|---|
| `provider` | string |  |
| `subject` | string |  |

### `user.set-password`

Sets a new password for a user and signs them out on all devices

Action · right `user.set-password` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | integer |  |
| `password` | string |  |

### `user.set-roles`

Sets the roles a user has everywhere, roles within a scope stay

Action · right `user.set-roles`

| Input | Type | Description |
|---|---|---|
| `userId` | integer |  |
| `roles` | array | Role names, e.g. ["editor"]; an empty list takes all away |

### `user.show`

Returns a user with their roles

Query · right `user.show`

| Input | Type | Description |
|---|---|---|
| `id` | integer |  |

### `user.update`

Changes the email, name or status of a user; a service account keeps having no email

Action · right `user.update`

| Input | Type | Description |
|---|---|---|
| `id` | integer |  |
| `email` | string or null (email) | Required for a person, none for a service account |
| `name` | string |  |
| `active` | boolean |  |

## frootbox/collections

### `frootbox/collections/category.choices`

The categories of the entries as choices for a block, "Any" first; empty without categories

Query · right `frootbox/collections/entry.list`

### `frootbox/collections/entry.create`

Creates an entry of a collection as a draft; frootbox/collections/entry.publish puts it online

Action · right `frootbox/collections/entry.create`

| Input | Type | Description |
|---|---|---|
| `translations` | object | Title, slug, teaser and text by language: {"de": {"title": "Haus am See", "teaser": "…", "text": {"type": "doc", "content": []}}}. The slug is made from the title if left out. |
| `image` | null or object, optional | An image from the media library: {"media": "<id>", "alt": "…"} |
| `space` | string, optional | The collection, a space of the plugin: "default" for the first one; see space.list with type "frootbox/collections/entry" |
| `order` | integer, optional | Smaller ones come first; with the same position the newest first |
| `categories` | array, optional | Ids of categories, see category-group.list and category.list |
| `tags` | array, optional | Ids, keys or labels of tags; a new word becomes a tag unless only presets count, see tag.choices |
| `fields` | object, optional | Further fields of the theme and of the collection, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one; see object.fields with the space |

### `frootbox/collections/entry.delete`

Deletes an entry with its draft; its versions stay

Action · right `frootbox/collections/entry.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/collections/entry.discard`

Throws away the draft of an entry; one that was never published is gone then

Action · right `frootbox/collections/entry.discard`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/collections/entry.list`

Lists the entries with drafts and published ones, by position and title

Query · right `frootbox/collections/entry.list`

| Input | Type | Description |
|---|---|---|
| `language` | string or null, optional | Language of the titles; left out for the first language of the website |
| `search` | string or null, optional | Only entries whose title holds this text |
| `page` | integer, optional |  |
| `perPage` | integer, optional |  |
| `space` | string or null, optional | Only the entries of this space; left out for all |

### `frootbox/collections/entry.publish`

Publishes the drafts of one or more entries

Action · right `frootbox/collections/entry.publish`

| Input | Type | Description |
|---|---|---|
| `ids` | array |  |

### `frootbox/collections/entry.schedule`

Plans when the draft of an entry is published and when it goes offline

Action · right `frootbox/collections/entry.schedule`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `publishAt` | string or null (date-time), optional | When the draft is published; left out or null for no time |
| `unpublishAt` | string or null (date-time), optional | When the entry goes offline, e.g. at the end of applications; left out or null for no time |

### `frootbox/collections/entry.show`

Returns an entry with its draft, its published version and where visitors find it

Query · right `frootbox/collections/entry.show`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/collections/entry.unpublish`

Takes an entry offline; it stays as a draft and can be published again

Action · right `frootbox/collections/entry.unpublish`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/collections/entry.update`

Changes the draft of an entry of a collection; what is left out stays as it is

Action · right `frootbox/collections/entry.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `translations` | null or object, optional | Changes by language, e.g. {"de": {"title": "Haus am See"}, "en": null}: fields left out stay, null removes a language |
| `image` | null or object, optional | An image from the media library: {"media": "<id>", "alt": "…"}; {} removes it, left out keeps it |
| `order` | integer or null, optional | Smaller ones come first; with the same position the newest first |
| `categories` | array or null, optional | Ids of categories, replacing the ones before |
| `tags` | array or null, optional | Ids, keys or labels of tags, replacing the ones before; a new word becomes a tag unless only presets count |
| `fields` | null or object, optional | Further fields of the theme and of the collection, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one, the others stay; see object.fields with the space; left out keeps them |
| `space` | string or null, optional | The collection to move it to; with publishing its address moves below the page of that collection and the old one redirects |

### `frootbox/collections/field.create`

Adds a field to a collection, e.g. "Altitude" as a number in m; its entries take a value under "fields" and the default view shows it in the fact sheet

Action · right `frootbox/collections/field.create`

| Input | Type | Description |
|---|---|---|
| `kind` | mixed: `text`, `longtext`, `number`, `date`, `boolean`, `link`, `choice`, `image`, `file` |  |
| `labels` | object | The label by language, the default language required: {"de": "Höhe", "en": "Altitude"} |
| `space` | string, optional | The collection: "default" for the first one; see space.list with type "frootbox/collections/entry" |
| `options` | null or object, optional | For a choice: the options by language, one text each, the default language required: {"de": ["Hell", "Dunkel"], "en": ["Light", "Dark"]} |
| `unit` | string or null, optional | For a number: the unit, e.g. "m" or "m²" |
| `decimals` | integer or null, optional | For a number: the decimal places, 0 for whole numbers |
| `name` | string or null, optional | The name of the value in the entries, e.g. "altitude"; left out it comes from the label and stays |

### `frootbox/collections/field.delete`

Removes a field from a collection; the values in the entries stay and come back with a new field of the same name

Action · right `frootbox/collections/field.delete`

| Input | Type | Description |
|---|---|---|
| `space` | string |  |
| `name` | string |  |

### `frootbox/collections/field.list`

The fields an admin added to a collection, in their order, with labels, settings and how many entries have a value; object.fields with the space gives the JSON schema of the values

Query · right `frootbox/collections/entry.list`

| Input | Type | Description |
|---|---|---|
| `space` | string, optional | The collection, e.g. "default" |

### `frootbox/collections/field.move`

Moves a field of a collection to another place in the form and the fact sheet

Action · right `frootbox/collections/field.move`

| Input | Type | Description |
|---|---|---|
| `space` | string |  |
| `name` | string |  |
| `position` | integer | The new place, from 0 |

### `frootbox/collections/field.update`

Changes the label, the options of a choice or unit and decimals of a number of a field of a collection; name and kind stay

Action · right `frootbox/collections/field.update`

| Input | Type | Description |
|---|---|---|
| `space` | string | The collection, e.g. "default" |
| `name` | string | The name of the field, see frootbox/collections/field.list |
| `labels` | null or object, optional | Labels by language, e.g. {"en": "Altitude"}; left out stay, empty removes one |
| `options` | null or object, optional | For a choice: the options by language. The lines of the default language make the options: the same text keeps its value in the entries, with as many lines as before a changed line is renamed; the other languages give the texts by position |
| `unit` | string or null, optional |  |
| `decimals` | integer or null, optional |  |

### `frootbox/collections/space.choices`

The collections as choices for a block, "All" first; empty with only one space

Query · right `frootbox/collections/entry.list`

## frootbox/events

### `frootbox/events/event.create`

Creates an event as a draft; frootbox/events/event.publish puts it online

Action · right `frootbox/events/event.create`

| Input | Type | Description |
|---|---|---|
| `translations` | object | Title, slug, teaser, venue and text by language: {"de": {"title": "Röstkurs", "venue": "Rösterei", "teaser": "…", "text": {"type": "doc", "content": []}}}. The slug is made from the title if left out. |
| `start` | string (date-time) | When it begins, e.g. "2026-12-05T18:00:00+01:00"; for an event all day long the day counts |
| `end` | string or null (date-time), optional | When it ends, left out if unknown; for an event all day long its last day |
| `allDay` | boolean, optional | All day long, without times |
| `address` | string, optional | The address in one line, e.g. "Hafenstraße 12, 20457 Hamburg" |
| `coordinates` | string, optional | Latitude and longitude for the map, e.g. "53.5444, 9.9663" |
| `image` | null or object, optional | An image from the media library: {"media": "<id>", "alt": "…"} |
| `categories` | array, optional | Ids of categories |
| `space` | string, optional | The space of the events, "default" for the default one; see space.list |
| `tags` | array, optional | Ids, keys or labels of tags; a new word becomes a tag unless only presets count, see tag.choices |
| `fields` | object, optional | Further fields the views of the theme add, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one; see object.fields |

### `frootbox/events/event.delete`

Deletes an event with its draft; its versions stay

Action · right `frootbox/events/event.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/events/event.discard`

Throws away the draft of an event; one that was never published is gone then

Action · right `frootbox/events/event.discard`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/events/event.list`

Lists the events with drafts and published ones, the latest start first

Query · right `frootbox/events/event.list`

| Input | Type | Description |
|---|---|---|
| `language` | string or null, optional | Language of the titles; left out for the first language of the website |
| `search` | string or null, optional | Only events whose title holds this text |
| `page` | integer, optional |  |
| `perPage` | integer, optional |  |
| `space` | string or null, optional | Only the events of this space; left out for all |

### `frootbox/events/event.publish`

Publishes the drafts of one or more events

Action · right `frootbox/events/event.publish`

| Input | Type | Description |
|---|---|---|
| `ids` | array |  |

### `frootbox/events/event.schedule`

Plans when the draft of an event is published and when it goes offline

Action · right `frootbox/events/event.schedule`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `publishAt` | string or null (date-time), optional | When the draft is published; left out or null for no time |
| `unpublishAt` | string or null (date-time), optional | When the event goes offline; left out or null for no time |

### `frootbox/events/event.show`

Returns an event with its draft, its published version and where visitors find it

Query · right `frootbox/events/event.show`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/events/event.unpublish`

Takes an event offline; it stays as a draft and can be published again

Action · right `frootbox/events/event.unpublish`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/events/event.update`

Changes the draft of an event; what is left out stays as it is

Action · right `frootbox/events/event.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `translations` | null or object, optional | Changes by language, e.g. {"de": {"title": "Röstkurs"}, "en": null}: fields left out stay, null removes a language |
| `start` | string or null (date-time), optional | When it begins. Start, end and allDay are set together: with a start, a missing end means none; without a start all three stay |
| `end` | string or null (date-time), optional |  |
| `allDay` | boolean or null, optional |  |
| `address` | string or null, optional |  |
| `coordinates` | string or null, optional | Latitude and longitude for the map, e.g. "53.5444, 9.9663"; "" removes them |
| `image` | null or object, optional | An image from the media library: {"media": "<id>", "alt": "…"}; {} removes it, left out keeps it |
| `categories` | array or null, optional | Ids of categories, replacing the ones before |
| `tags` | array or null, optional | Ids, keys or labels of tags, replacing the ones before; a new word becomes a tag unless only presets count |
| `fields` | null or object, optional | Further fields the views of the theme add, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one, the others stay; see object.fields; left out keeps them |
| `space` | string or null, optional | The space to move it to; with publishing its address moves below the page of that space and the old one redirects |

### `frootbox/events/space.choices`

The spaces of the events as choices for a block, "All" first; empty with only one space

Query · right `frootbox/events/event.list`

## frootbox/forms

### `frootbox/forms/captcha.list`

Lists the captchas a form can choose, with the standard of the website

Query · right `frootbox/forms/form.show`

### `frootbox/forms/entry.delete`

Deletes entries of forms; returns how many were deleted

Action · right `frootbox/forms/entry.delete`

| Input | Type | Description |
|---|---|---|
| `ids` | array |  |

### `frootbox/forms/entry.list`

Lists what visitors sent with a form, newest first, from the inbox or the spam folder

Query · right `frootbox/forms/entry.list`

| Input | Type | Description |
|---|---|---|
| `form` | string |  |
| `page` | integer, optional |  |
| `perPage` | integer, optional |  |
| `spam` | boolean, optional | The spam folder instead of the inbox |

### `frootbox/forms/entry.prune`

Deletes the entries of forms older than the setting "Keep entries"; returns how many

Action · right `frootbox/forms/entry.delete`

### `frootbox/forms/entry.release`

Moves entries of forms from the spam folder to the inbox and mails them to the recipients; returns how many

Action · right `frootbox/forms/entry.release` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `ids` | array |  |

### `frootbox/forms/entry.show`

Returns one entry of a form with all its values

Query · right `frootbox/forms/entry.list`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/forms/form.choices`

The published forms as choices for the block "Form"

Query · right `frootbox/forms/form.list`

### `frootbox/forms/form.create`

Creates a form as a draft; add fields with frootbox/forms/form.field-add, then frootbox/forms/form.publish puts it online

Action · right `frootbox/forms/form.create`

| Input | Type | Description |
|---|---|---|
| `translations` | object | Texts by language: {"de": {"title": "Kontakt", "button": "Absenden", "success": "Danke, wir melden uns."}}. Button and success may be left out for general texts. |
| `recipients` | array, optional | Email addresses that get every entry, at most 10; none to only keep the entries |

### `frootbox/forms/form.delete`

Deletes a form with its draft and its entries; blocks showing it show nothing then

Action · right `frootbox/forms/form.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/forms/form.discard`

Throws away the draft of a form; a form never published is gone then

Action · right `frootbox/forms/form.discard`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/forms/form.field-add`

Adds a field to the draft of a form

Action · right `frootbox/forms/form.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `type` | mixed: `text`, `email`, `phone`, `number`, `date`, `textarea`, `select`, `radio`, `checkboxes`, `checkbox`, `consent`, `files` |  |
| `translations` | object | Label, hint and for select, radio and checkboxes the options by language: {"de": {"label": "Ihr Anliegen", "options": ["Frage", "Lob"]}} |
| `required` | boolean, optional | Whether the field must be filled in; consent is always required |
| `key` | string or null, optional | The name of the value in entries, e.g. "email"; left out it comes from the label |
| `position` | integer or null, optional | Where it goes, from 0; left out at the end |
| `link` | string or null, optional | Only for consent: where the label links to, a page such as "page:01J…" or an address; the text in [square brackets] of the label becomes the link |

### `frootbox/forms/form.field-move`

Moves a field of a form to another position

Action · right `frootbox/forms/form.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `key` | string |  |
| `position` | integer | The new position, from 0 |

### `frootbox/forms/form.field-remove`

Removes a field from the draft of a form; entries sent before keep its value

Action · right `frootbox/forms/form.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `key` | string |  |

### `frootbox/forms/form.field-update`

Changes a field in the draft of a form; what is left out stays as it is

Action · right `frootbox/forms/form.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `key` | string |  |
| `type` | mixed: `text`, `email`, `phone`, `number`, `date`, `textarea`, `select`, `radio`, `checkboxes`, `checkbox`, `consent`, `files`, optional |  |
| `translations` | null or object, optional | Changes by language, e.g. {"de": {"label": "Telefon"}}: texts left out stay, null removes a language |
| `required` | boolean or null, optional |  |
| `newKey` | string or null, optional | A new name of the value; entries sent before keep the old one |
| `link` | string or null, optional | Only for consent: where the label links to, a page such as "page:01J…" or an address; empty removes it |

### `frootbox/forms/form.list`

Lists the forms by title, with drafts and published ones

Query · right `frootbox/forms/form.list`

| Input | Type | Description |
|---|---|---|
| `language` | string or null, optional | Language of the titles; left out for the first language of the website |

### `frootbox/forms/form.publish`

Puts the draft of a form online, wherever a block shows it

Action · right `frootbox/forms/form.publish`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/forms/form.show`

Returns a form with its draft, its published version and the number of its entries

Query · right `frootbox/forms/form.show`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/forms/form.submit`

Sends a published form as a visitor: keeps the entry and mails it to the recipients

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `values` | object | The values by key of the field: texts, a list of texts for checkboxes, true for a checked box |
| `language` | string or null, optional | The language the visitor saw the form in; left out for the first of the website |
| `token` | string or null, optional | The token the form was shown with, from its field "_token" |
| `website` | string or null, optional | The hidden field people leave empty |
| `page` | string or null, optional | The page the form was sent from |
| `about` | string or null, optional | What the form is about when it was sent from the address of an object, e.g. "frootbox/jobs/job:01J…" for an application |
| `captcha` | null or object, optional | What the captcha of the form gave, its fields "captcha[…]" by name |

### `frootbox/forms/form.update`

Changes the texts, recipients or captcha in the draft of a form; what is left out stays as it is

Action · right `frootbox/forms/form.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `translations` | null or object, optional | Changes by language, e.g. {"de": {"title": "Kontakt"}, "en": null}: texts left out stay, null removes a language |
| `recipients` | array or null, optional | Email addresses that get every entry, replacing the ones before |
| `captcha` | string or null, optional | The captcha by name, "none" for none or "default" for the standard of the website |

## frootbox/google-fonts

### `frootbox/google-fonts/catalog.search`

Searches the catalog of Google Fonts by family, the most used first; the server asks Google at most once a day

Query · right `frootbox/google-fonts/catalog.search`

| Input | Type | Description |
|---|---|---|
| `q` | string, optional | Part of the name of the family, e.g. "sans" |
| `category` | string, optional | Only fonts of this kind |
| `limit` | integer, optional |  |

### `frootbox/google-fonts/font.delete`

Removes an imported font and its files; not while the design or its draft uses it

Action · right `frootbox/google-fonts/font.delete` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `key` | string | The key, e.g. "google-inter" |

### `frootbox/google-fonts/font.import`

Copies a family of Google Fonts to the website, with the files of the scripts its languages need; visitors then load it from the own domain. Importing again replaces the files.

Action · right `frootbox/google-fonts/font.import` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `family` | string | The family as the catalog names it, e.g. "Inter" |
| `italic` | boolean, optional | Also the italic styles, if the family has them |

### `frootbox/google-fonts/font.list`

The fonts imported from Google Fonts, by family; their key is the value of a font token in the design

Query · right `frootbox/google-fonts/font.list`

## frootbox/jobs

### `frootbox/jobs/job.create`

Creates a job as a draft; frootbox/jobs/job.publish puts it online

Action · right `frootbox/jobs/job.create`

| Input | Type | Description |
|---|---|---|
| `translations` | object | Title, slug, teaser and text by language: {"de": {"title": "Barista (m/w/d)", "teaser": "…", "text": {"type": "doc", "content": []}}}. The slug is made from the title if left out; the text holds tasks, profile and what the job offers. |
| `types` | array, optional | Kinds of the job: full-time, part-time, mini-job, apprenticeship, dual-study, internship, freelance |
| `start` | string, optional | The first day, e.g. "2027-02-01"; left out or "" for as soon as possible |
| `workplace` | mixed: `on-site`, `hybrid`, `remote`, optional | Where the work is done: on-site, hybrid or remote |
| `salary` | null or object, optional | The salary in whole units, e.g. {"min": 2800, "max": 3200, "per": "month", "currency": "EUR"}; one amount is enough |
| `location` | string, optional | The id of a location from frootbox/people/location.list, or "" |
| `contact` | string, optional | The id of a person to contact from frootbox/people/person.list, or "" |
| `image` | null or object, optional | An image from the media library: {"media": "<id>", "alt": "…"} |
| `space` | string, optional | The space of the jobs, "default" for the default one; see space.list |
| `categories` | array, optional | Ids of categories, see category-group.list and category.list |
| `tags` | array, optional | Ids, keys or labels of tags; a new word becomes a tag unless only presets count, see tag.choices |
| `fields` | object, optional | Further fields the views of the theme add, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one; see object.fields |

### `frootbox/jobs/job.delete`

Deletes a job with its draft; its versions stay

Action · right `frootbox/jobs/job.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/jobs/job.discard`

Throws away the draft of a job; one that was never published is gone then

Action · right `frootbox/jobs/job.discard`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/jobs/job.list`

Lists the jobs with drafts and published ones, by title

Query · right `frootbox/jobs/job.list`

| Input | Type | Description |
|---|---|---|
| `language` | string or null, optional | Language of the titles; left out for the first language of the website |
| `search` | string or null, optional | Only jobs whose title holds this text |
| `page` | integer, optional |  |
| `perPage` | integer, optional |  |
| `space` | string or null, optional | Only the jobs of this space; left out for all |

### `frootbox/jobs/job.publish`

Publishes the drafts of one or more jobs

Action · right `frootbox/jobs/job.publish`

| Input | Type | Description |
|---|---|---|
| `ids` | array |  |

### `frootbox/jobs/job.schedule`

Plans when the draft of a job is published and when it goes offline

Action · right `frootbox/jobs/job.schedule`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `publishAt` | string or null (date-time), optional | When the draft is published; left out or null for no time |
| `unpublishAt` | string or null (date-time), optional | When the job goes offline, e.g. at the end of applications; left out or null for no time |

### `frootbox/jobs/job.show`

Returns a job with its draft, its published version and where visitors find it

Query · right `frootbox/jobs/job.show`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/jobs/job.unpublish`

Takes a job offline; it stays as a draft and can be published again

Action · right `frootbox/jobs/job.unpublish`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/jobs/job.update`

Changes the draft of a job; what is left out stays as it is

Action · right `frootbox/jobs/job.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `translations` | null or object, optional | Changes by language, e.g. {"de": {"title": "Barista (m/w/d)"}, "en": null}: fields left out stay, null removes a language |
| `types` | array or null, optional | Kinds of the job, replacing the ones before |
| `start` | string or null, optional | The first day, e.g. "2027-02-01"; "" for as soon as possible |
| `workplace` | mixed: `on-site`, `hybrid`, `remote`, optional |  |
| `salary` | null or object, optional | The salary, replacing the one before: {"min": 2800, "max": 3200, "per": "month"}; {} removes it |
| `location` | string or null, optional | The id of a location; "" removes it |
| `contact` | string or null, optional | The id of a person to contact; "" removes it |
| `image` | null or object, optional | An image from the media library: {"media": "<id>", "alt": "…"}; {} removes it, left out keeps it |
| `categories` | array or null, optional | Ids of categories, replacing the ones before |
| `tags` | array or null, optional | Ids, keys or labels of tags, replacing the ones before; a new word becomes a tag unless only presets count |
| `fields` | null or object, optional | Further fields the views of the theme add, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one, the others stay; see object.fields; left out keeps them |
| `space` | string or null, optional | The space to move it to; with publishing its address moves below the page of that space and the old one redirects |

### `frootbox/jobs/space.choices`

The spaces of the jobs as choices for a block, "All" first; empty with only one space

Query · right `frootbox/jobs/job.list`

## frootbox/news

### `frootbox/news/article.create`

Creates a news article as a draft; frootbox/news/article.publish puts it online

Action · right `frootbox/news/article.create`

| Input | Type | Description |
|---|---|---|
| `translations` | object | Title, slug, teaser and text by language: {"de": {"title": "Neue Sorten", "teaser": "…", "text": {"type": "doc", "content": []}}}. The slug is made from the title if left out. |
| `date` | string or null (date-time), optional | The date shown with the article and its place in lists, e.g. "2026-11-02T09:00:00+01:00"; left out for now |
| `image` | null or object, optional | An image from the media library: {"media": "<id>", "alt": "…"} |
| `categories` | array, optional | Ids of categories |
| `space` | string, optional | The space of the news, "default" for the default one; see space.list |
| `tags` | array, optional | Ids, keys or labels of tags; a new word becomes a tag unless only presets count, see tag.choices |
| `fields` | object, optional | Further fields the views of the theme add, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one; see object.fields |

### `frootbox/news/article.delete`

Deletes a news article with its draft; its versions stay

Action · right `frootbox/news/article.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/news/article.discard`

Throws away the draft of a news article; one that was never published is gone then

Action · right `frootbox/news/article.discard`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/news/article.list`

Lists the news articles with drafts and published ones, newest first

Query · right `frootbox/news/article.list`

| Input | Type | Description |
|---|---|---|
| `language` | string or null, optional | Language of the titles; left out for the first language of the website |
| `search` | string or null, optional | Only articles whose title holds this text |
| `page` | integer, optional |  |
| `perPage` | integer, optional |  |
| `space` | string or null, optional | Only the articles of this space; left out for all |

### `frootbox/news/article.publish`

Publishes the drafts of one or more news articles

Action · right `frootbox/news/article.publish`

| Input | Type | Description |
|---|---|---|
| `ids` | array |  |

### `frootbox/news/article.schedule`

Plans when the draft of a news article is published and when it goes offline

Action · right `frootbox/news/article.schedule`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `publishAt` | string or null (date-time), optional | When the draft is published; left out or null for no time |
| `unpublishAt` | string or null (date-time), optional | When the article goes offline; left out or null for no time |

### `frootbox/news/article.show`

Returns a news article with its draft, its published version and where visitors find it

Query · right `frootbox/news/article.show`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/news/article.unpublish`

Takes a news article offline; it stays as a draft and can be published again

Action · right `frootbox/news/article.unpublish`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/news/article.update`

Changes the draft of a news article; what is left out stays as it is

Action · right `frootbox/news/article.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `translations` | null or object, optional | Changes by language, e.g. {"de": {"title": "Neue Sorten"}, "en": null}: fields left out stay, null removes a language |
| `date` | string or null (date-time), optional |  |
| `image` | null or object, optional | An image from the media library: {"media": "<id>", "alt": "…"}; {} removes it, left out keeps it |
| `categories` | array or null, optional | Ids of categories, replacing the ones before |
| `tags` | array or null, optional | Ids, keys or labels of tags, replacing the ones before; a new word becomes a tag unless only presets count |
| `fields` | null or object, optional | Further fields the views of the theme add, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one, the others stay; see object.fields; left out keeps them |
| `space` | string or null, optional | The space to move it to; with publishing its address moves below the page of that space and the old one redirects |

### `frootbox/news/space.choices`

The spaces of the news as choices for a block, "All" first; empty with only one space

Query · right `frootbox/news/article.list`

## frootbox/people

### `frootbox/people/category.choices`

The categories of the people as choices for a block, "Any" first; empty without categories

Query · right `frootbox/people/person.list`

### `frootbox/people/location.choices`

The published locations as choices for the blocks

Query · right `frootbox/people/location.list`

### `frootbox/people/location.create`

Creates a location as a draft; frootbox/people/location.publish puts it online

Action · right `frootbox/people/location.create`

| Input | Type | Description |
|---|---|---|
| `translations` | object | Texts by language: {"de": {"name": "Café am Hafen", "hours": "Mo–Fr 8–18 Uhr", "text": "…"}} |
| `street` | string or null, optional | Street and number, e.g. "Hafenstraße 12" |
| `postalCode` | string or null, optional | Postcode, e.g. "20457" |
| `city` | string or null, optional | Town, e.g. "Hamburg" |
| `country` | string or null, optional | Country, left out in the own country |
| `phone` | string or null, optional | Phone number, e.g. "+49 40 123456" |
| `email` | string or null, optional | Email address |
| `coordinates` | string or null, optional | Latitude and longitude for the map, e.g. "53.5444, 9.9663" |
| `image` | null or object, optional | An image from the media library: {"media": "<id>", "alt": "…"}; {} removes it |

### `frootbox/people/location.delete`

Deletes a location; blocks showing it show nothing then, people keep their other locations

Action · right `frootbox/people/location.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/people/location.discard`

Throws away the draft of a location; one never published is gone then

Action · right `frootbox/people/location.discard`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/people/location.list`

Lists the locations by name, with drafts and published ones

Query · right `frootbox/people/location.list`

| Input | Type | Description |
|---|---|---|
| `language` | string or null, optional | Language of the names; left out for the first language of the website |

### `frootbox/people/location.publish`

Puts the draft of a location online, wherever a block shows it

Action · right `frootbox/people/location.publish`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/people/location.show`

Returns a location with its draft and its published version

Query · right `frootbox/people/location.show`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/people/location.update`

Changes the draft of a location; what is left out stays as it is

Action · right `frootbox/people/location.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `translations` | null or object, optional | Changes by language, e.g. {"de": {"hours": "…"}, "en": null}: texts left out stay, null removes a language |
| `street` | string or null, optional | Street and number, e.g. "Hafenstraße 12" |
| `postalCode` | string or null, optional | Postcode, e.g. "20457" |
| `city` | string or null, optional | Town, e.g. "Hamburg" |
| `country` | string or null, optional | Country, left out in the own country |
| `phone` | string or null, optional | Phone number, e.g. "+49 40 123456" |
| `email` | string or null, optional | Email address |
| `coordinates` | string or null, optional | Latitude and longitude for the map, e.g. "53.5444, 9.9663" |
| `image` | null or object, optional | An image from the media library: {"media": "<id>", "alt": "…"}; {} removes it |

### `frootbox/people/person.choices`

The published people as choices for the block "Contact person"

Query · right `frootbox/people/person.list`

### `frootbox/people/person.create`

Creates a person as a draft; frootbox/people/person.publish puts the person online

Action · right `frootbox/people/person.create`

| Input | Type | Description |
|---|---|---|
| `givenName` | string or null, optional | Given name, e.g. "Maria" |
| `familyName` | string or null, optional | Family name, e.g. "Rossi" |
| `prefix` | string or null, optional | Before the name, e.g. "Dr." |
| `email` | string or null, optional | Email address |
| `phone` | string or null, optional | Phone number, e.g. "+49 40 123456" |
| `image` | null or object, optional | A photo from the media library: {"media": "<id>", "alt": "…"}; {} removes it |
| `locations` | array or null, optional | Ids of the locations the person works at, replacing the ones before |
| `order` | integer or null, optional | Smaller comes first in the team, then by family name; 0 by default |
| `translations` | object, optional | Texts by language: {"de": {"role": "Röstmeisterin", "text": "…"}} |
| `space` | string, optional | The space of the people, "default" for the default one; see space.list |
| `slug` | string or null, optional | The last part of the address of the profile, e.g. "maria-rossi"; left out it comes from the name and follows it, "" takes it from the name again |
| `categories` | array, optional | Ids of categories, see category-group.list and category.list |
| `tags` | array, optional | Ids, keys or labels of tags; a new word becomes a tag unless only presets count, see tag.choices |
| `fields` | object, optional | Further fields the views of the theme add, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one; see object.fields |

### `frootbox/people/person.delete`

Deletes a person; blocks showing the person show nothing then

Action · right `frootbox/people/person.delete`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/people/person.discard`

Throws away the draft of a person; one never published is gone then

Action · right `frootbox/people/person.discard`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/people/person.list`

Lists the people in the order of the team, with drafts and published ones

Query · right `frootbox/people/person.list`

| Input | Type | Description |
|---|---|---|
| `language` | string or null, optional | Language of the roles; left out for the first language of the website |
| `space` | string or null, optional | Only the people of this space, see space.list; left out all |

### `frootbox/people/person.publish`

Puts the drafts of people online, wherever a block shows them, with their profiles below the page of their space

Action · right `frootbox/people/person.publish`

| Input | Type | Description |
|---|---|---|
| `ids` | array | Ids of the people, published together |

### `frootbox/people/person.show`

Returns a person with its draft, its published version and the addresses of the profile by language

Query · right `frootbox/people/person.show`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/people/person.unpublish`

Takes a person offline; the person stays as a draft

Action · right `frootbox/people/person.unpublish`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/people/person.update`

Changes the draft of a person; what is left out stays as it is

Action · right `frootbox/people/person.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `givenName` | string or null, optional | Given name, e.g. "Maria" |
| `familyName` | string or null, optional | Family name, e.g. "Rossi" |
| `prefix` | string or null, optional | Before the name, e.g. "Dr." |
| `email` | string or null, optional | Email address |
| `phone` | string or null, optional | Phone number, e.g. "+49 40 123456" |
| `image` | null or object, optional | A photo from the media library: {"media": "<id>", "alt": "…"}; {} removes it |
| `locations` | array or null, optional | Ids of the locations the person works at, replacing the ones before |
| `order` | integer or null, optional | Smaller comes first in the team, then by family name; 0 by default |
| `translations` | null or object, optional | Changes by language, e.g. {"de": {"role": "…"}, "en": null}: texts left out stay, null removes a language |
| `slug` | string or null, optional | The last part of the address of the profile, e.g. "maria-rossi"; left out it comes from the name and follows it, "" takes it from the name again |
| `categories` | array or null, optional | Ids of categories, replacing the ones before, see category-group.list and category.list |
| `tags` | array or null, optional | Ids, keys or labels of tags, replacing the ones before; a new word becomes a tag unless only presets count, see tag.choices |
| `fields` | null or object, optional | Further fields the views of the theme add, by name; a text one per language, e.g. {"subtitle": {"de": "…"}}, null removes one, the others stay; left out keeps them; see object.fields |
| `space` | string or null, optional | The space to move the person to; with publishing the profile moves below the page of that space and the old address redirects |

### `frootbox/people/space.choices`

The spaces of the people as choices for a block, "All" first; empty with only one space

Query · right `frootbox/people/person.list`

## frootbox/search

### `frootbox/search/website.find`

Finds published pages, articles, events and more on the website by words, as visitors see them, best hits first

Query · public

| Input | Type | Description |
|---|---|---|
| `q` | string |  |
| `language` | string or null, optional | A language of the website, e.g. "de"; by default the one of the visitor |
| `limit` | integer, optional |  |
| `offset` | integer, optional |  |

## frootbox/seo

### `frootbox/seo/page.check`

Checks title and description of the pages for search engines: missing, too short, too long or the same as on another page

Query · right `frootbox/seo/page.check`

| Input | Type | Description |
|---|---|---|
| `id` | string or null, optional | Only this page; left out for all pages |
| `language` | string or null, optional | Only this language; left out for all languages |

## frootbox/shop

### `frootbox/shop/cart.add`

Puts pieces of a product into the cart of the visitor; returns the pieces of it now in the cart

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `product` | string | The id of the product |
| `quantity` | integer, optional |  |

### `frootbox/shop/cart.show`

The cart of the visitor; for a signed-in customer with prices, shipping and totals from the shop

Query · public

| Input | Type | Description |
|---|---|---|
| `shippingMethod` | string or null, optional |  |
| `deliveryAddressId` | string or null, optional |  |

### `frootbox/shop/cart.update`

Sets the pieces of products in the cart of the visitor, 0 removes one; returns the pieces in the cart

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `quantities` | object | Pieces by id of the product, e.g. {"01J…": 12} |

### `frootbox/shop/catalog.status`

Where the sync of the catalog stands: the one going on, the last one, products without image and jobs of the queue

Query · right `frootbox/shop/catalog.status`

### `frootbox/shop/catalog.sync`

Brings products, categories and images of the shop up to date with the provider, one step at a time: until done is true, the next call goes on; with full the whole catalog again

Action · right `frootbox/shop/catalog.sync` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `full` | boolean, optional | The whole catalog instead of the changes since the last sync; starts anew |
| `seconds` | integer, optional | How long the step may take, about; at least one product is done |

### `frootbox/shop/customer.change-password`

Changes the password of the signed-in customer of the shop

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `currentPassword` | string |  |
| `password` | string |  |

### `frootbox/shop/customer.request-reset`

Sends a customer of the shop a link to set a new password; says nothing about whether the address is known

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `email` | string |  |
| `returnUrl` | string | The address of the page with the form for the new password |

### `frootbox/shop/customer.reset-password`

Sets a new password for a customer of the shop with the token of the link from the mail

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `email` | string |  |
| `token` | string |  |
| `password` | string |  |

### `frootbox/shop/customer.show`

The signed-in customer of the shop with addresses

Query · public

### `frootbox/shop/customer.sign-in`

Signs a customer of the shop in for the visitor of the website

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `email` | string |  |
| `password` | string |  |

### `frootbox/shop/customer.sign-out`

Signs the customer of the shop out; the cart stays

Action · public · cannot be undone

### `frootbox/shop/invoice.list`

The invoices of the signed-in customer of the shop, newest first

Query · public

| Input | Type | Description |
|---|---|---|
| `cursor` | string or null, optional |  |

### `frootbox/shop/invoice.pdf`

The PDF of an invoice of the signed-in customer of the shop, base64

Query · public

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/shop/order.list`

The orders of the signed-in customer of the shop, newest first

Query · public

| Input | Type | Description |
|---|---|---|
| `cursor` | string or null, optional |  |

### `frootbox/shop/order.place`

Orders the cart of the signed-in customer at the shop; the same key again gives the same order

Action · public · cannot be undone

| Input | Type | Description |
|---|---|---|
| `shippingMethod` | string |  |
| `paymentMethod` | string |  |
| `expectedGross` | integer | The total gross in cents the customer saw; if it changed meanwhile, nothing is ordered |
| `key` | string | A key of the checkout, so sending twice orders once |
| `deliveryAddressId` | string or null, optional |  |
| `reference` | string or null, optional |  |
| `comment` | string or null, optional |  |
| `consents` | array, optional | Keys of the legal texts the customer agreed to |

### `frootbox/shop/order.show`

An order of the signed-in customer of the shop with its lines

Query · public

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

## frootbox/statistics

### `frootbox/statistics/report.show`

Shows the visits and page views of the website for the last days up to today: per day, the most viewed pages, where visitors came from and their devices, with the days before for comparison

Query · right `frootbox/statistics/report.show`

| Input | Type | Description |
|---|---|---|
| `days` | integer, optional | How many days up to today, e.g. 7, 30 or 365 |

## frootbox/webhooks

### `frootbox/webhooks/delivery.list`

Lists the latest deliveries of a webhook, newest first, from the last 30 days

Query · right `frootbox/webhooks/webhook.list`

| Input | Type | Description |
|---|---|---|
| `webhook` | string |  |
| `limit` | integer, optional |  |

### `frootbox/webhooks/delivery.retry`

Sends a failed or skipped delivery again, with all its attempts

Action · right `frootbox/webhooks/delivery.retry` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/webhooks/webhook.actions`

Lists the actions a webhook can listen to, grouped by package

Query · right `frootbox/webhooks/webhook.list`

### `frootbox/webhooks/webhook.create`

Sets up a webhook: an address told about the chosen actions; returns its secret once

Action · right `frootbox/webhooks/webhook.create` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `title` | string | What it is for, e.g. "Shop sync" |
| `url` | string | The address, e.g. "https://example.com/hooks/frootbox" |
| `actions` | array | Action names and patterns, e.g. ["page.publish", "frootbox/news/*"] |

### `frootbox/webhooks/webhook.delete`

Removes a webhook and its deliveries

Action · right `frootbox/webhooks/webhook.delete` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/webhooks/webhook.list`

Lists the webhooks with their last delivery, without secrets

Query · right `frootbox/webhooks/webhook.list`

### `frootbox/webhooks/webhook.pause`

Pauses a webhook: nothing is sent until it is resumed

Action · right `frootbox/webhooks/webhook.pause`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `failing` | boolean, optional | Paused because it failed for days, set by the system |

### `frootbox/webhooks/webhook.paused-count`

Counts the paused webhooks

Query · right `frootbox/webhooks/webhook.list`

### `frootbox/webhooks/webhook.resume`

Resumes a paused webhook for the actions from now on

Action · right `frootbox/webhooks/webhook.resume`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/webhooks/webhook.rotate-secret`

Gives a webhook a new secret and returns it once; the old one stops working

Action · right `frootbox/webhooks/webhook.rotate-secret` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/webhooks/webhook.show`

Shows a webhook without its secret

Query · right `frootbox/webhooks/webhook.list`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/webhooks/webhook.test`

Sends a test event "frootbox/webhooks/webhook.test" to a webhook, also while it is paused

Action · right `frootbox/webhooks/webhook.test` · cannot be undone

| Input | Type | Description |
|---|---|---|
| `id` | string |  |

### `frootbox/webhooks/webhook.update`

Changes title, address and actions of a webhook

Action · right `frootbox/webhooks/webhook.update`

| Input | Type | Description |
|---|---|---|
| `id` | string |  |
| `title` | string |  |
| `url` | string |  |
| `actions` | array | Action names and patterns, e.g. ["page.publish", "frootbox/news/*"] |
