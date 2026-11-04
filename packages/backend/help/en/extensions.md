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
in the folder of the website. If it brings tables, the card
**Database** lists the pending migrations, and **Update now** runs them
after a backup, like `php bin/frootbox migrate` in the console. If no
backup can be made before, back up the database yourself and use
**Update without a backup**. The dashboard points to pending
migrations.
**More official modules** lists the modules of Frootbox that are not
installed here, each with its Composer command.
**On … pages** shows where the blocks and layouts of an extension are.
Look there before you remove it.

If an extension is gone while its blocks are still on pages, **Missing
blocks and layouts** names them with their pages. The pages stay
editable and keep the blocks as they were. Visitors see nothing of a
missing block; in the edit mode it shows as "Missing block" and can be
removed. A page whose layout is gone shows the first layout of the
theme. Once the extension is back, everything is there again.
