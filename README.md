# buch-lib

`buch-lib` is a public **library of buchs** — practical knowledge for
humans, teams and AI agents. A buch is a small, versioned package of Markdown
pages that you read in VS Code or Obsidian, and that agents load page by page or
section by section.

This repository contains **content only**. The `buch` CLI is a separate project;
nothing here runs by itself.

## What is here

| Buch | Purpose |
|---|---|
| `buch-authoring` | The practical guide to the buch on-disk format: structure, frontmatter, `%%key%%` dynamic values, actions, distribution and good practices. |

More buchs are planned — see [`PROPOSALS.md`](PROPOSALS.md).

## Using it with the `buch` CLI

Add this repository as a git library:

```sh
buch lib add git github.com/LukasLow/buch-lib --as buch-lib --full
buch list
```

Read the meta buch:

```sh
buch read buch-authoring
buch read buch-authoring/structure
buch read buch-authoring/dynamic-values
buch read buch-authoring/actions#the-sandbox
```

A git library is **untrusted** until you grant it. Key rendering and action
execution are separate gates:

```sh
buch trust github.com/LukasLow/buch-lib --kdb      # render %%key%% values
buch trust github.com/LukasLow/buch-lib --actions  # allow buch exec
```

Until key trust is granted, read the unreplaced source with `--raw`.

## Layout

```text
buch-lib/
├── README.md
├── LICENSE
├── PROPOSALS.md
└── .buch/                          # the library
    ├── +index.md                   # library metadata
    └── buch-authoring.buch/        # a meta buch about authoring buchs
        ├── +index.md
        ├── structure.md
        ├── frontmatter.md
        ├── dynamic-values.md
        ├── actions.md
        ├── distribution.md
        ├── good-practices.md
        ├── .kdb/
        └── actions/
```

## Contributing

Add or edit buchs under `.buch/`, then run `buch validate` before opening a
pull request. Keep one topic per buch, pages short and every `%%key%%` backed by
a `.kdb` module. See `buch-authoring` for the full guide.

## Data statement

Local-only, no telemetry. Syncing goes to the git hosts you configure; their
policies apply.

## License

MIT — see [`LICENSE`](LICENSE).
