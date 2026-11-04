---
title: Extensions
about: [screen:backend.extensions]
permission: system.extension-list
order: 125
---
**Extensions** lists what is installed besides the core: modules such
as news or forms, themes and the packages of this website. Each one
shows its version and what it brings, e.g. blocks, actions, settings and
own tables. **Active theme** marks the theme of the website and its
parents.

An installed extension is active. The developer adds one with Composer
in the folder of the website and then runs `php bin/frootbox migrate`.
Remove an extension only when none of its blocks is on a page.
