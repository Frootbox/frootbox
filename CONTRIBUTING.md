# Contributing to Frootbox

Thank you for looking at Frootbox. It is a developer preview (`0.x`):
the ideas are settled, but names and details still move between
versions. See [`CHANGELOG.md`](CHANGELOG.md) for what changed and how to
upgrade.

## Questions and ideas

Ask in [Discussions](https://github.com/Frootbox/frootbox/discussions):
how to build something, whether Frootbox fits a project, what is
planned. Ideas for features are welcome there, or as an issue with the
template "Idea".

## Bugs

Open an [issue](https://github.com/Frootbox/frootbox/issues/new/choose)
with the template "Bug". It helps most with the output of
`php bin/frootbox about`, the steps that lead to the bug, and what you
expected instead. A failing test or a small extension that shows the
bug is even better.

Security issues never go into a public issue. See
[`SECURITY.md`](SECURITY.md).

## Pull requests

Not yet, sorry. While Frootbox is in `0.x` much changes at once, and a
pull request would often not survive the next version. Please open an
issue or a discussion instead; a good report is a contribution, too.
This will change with a stable version.

Once pull requests are open, contributions come in under the MIT
license of the project, without a contributor license agreement.

## Working on the code

The repository holds every package, the tests and the tools. The
[README](README.md) explains `composer check`, the sandbox and the
browser tests. Every package under `packages/` is mirrored into a
read-only repository in
[frootbox-packages](https://github.com/frootbox-packages) for Composer;
changes always go to this repository.
