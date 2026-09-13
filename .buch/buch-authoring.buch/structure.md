# Structure

A **library** is a directory named exactly `.buch`. A **buch** (German for
"book") is a directory named `TITLE.buch` inside a library. Everything is plain
files on disk — there is no database, no index file and no build step.

## A complete example

The tree below is the recommended shape. Only `+index.md` is strictly required
inside a buch; folders appear as you need them.

```text
.buch/                              # the library
├── +index.md                       # library metadata (id, title, description)
├── deps.json                       # optional declarative dependencies
├── deps.lock.json                  # optional resolved commit pins
├── buch-authoring.buch/            # one buch
│   ├── +index.md                   # required main page + frontmatter
│   ├── structure.md                # a page
│   ├── frontmatter.md              # another page
│   ├── guides/                     # subfolders are allowed
│   │   └── migration.md
│   ├── .kdb/                       # dynamic values for %%key%%
│   │   ├── format-version.js
│   │   └── company/
│   │       └── support.js          # key: company.support
│   ├── .assets/                    # optional, any name: images, data
│   │   └── diagram.svg
│   └── actions/                    # runnable, explicitly-invoked scripts
│       └── word-count.js
└── another-buch.buch/
    └── +index.md
```

## The pieces

### `+index.md` — the main page

Every buch has exactly one `+index.md` at its root. It has two jobs:

1. Carry the buch's YAML **frontmatter** (see
   [frontmatter.md](frontmatter.md)).
2. Act as the buch's landing page when a reader asks for the buch without a
   page name.

The library root also has a `+index.md`, with the same frontmatter shape, but it
describes the library rather than a single buch.

### Pages

Any `.md` file other than `+index.md` is a page. Page paths are **logical
paths**: they are always written with forward slashes, on every platform, and
without the `.md` suffix when you address them.

```sh
buch read buch-authoring/structure          # structure.md
buch read buch-authoring/guides/migration   # guides/migration.md
```

Subfolders group related pages and keep a buch navigable. A page may link to
another page with a normal relative Markdown link, for example
[frontmatter.md](frontmatter.md), and to a section with
[frontmatter.md#fields](frontmatter.md#fields).

### `.kdb/` — dynamic values

`.kdb/**/*.js` modules provide values that pages embed with the `%%key%%`
syntax. Dots in a key are path separators: `%%company.support%%` reads
`.kdb/company/support.js`. This is covered in detail in
[dynamic-values.md](dynamic-values.md).

### `actions/` — runnable scripts

`actions/*.js` modules are small programs that a reader invokes explicitly with
`buch exec`. They are never run during a normal read. See [actions.md](actions.md).

### `.assets/` — anything else

There is no reserved name for non-page files (images, sample data, templates).
Put them in a folder such as `.assets/` so they are clearly not pages, and link
to them with relative paths from your pages.

## Rules that keep paths portable

- Logical paths inside a buch — page paths, keys, links, selectors — are always
  forward-slash (`guides/migration`), never native filesystem paths.
- A selector has the form `buch[/page][#section]`, optionally qualified as
  `library/buch[/page][#section]` when a name is ambiguous:

  ```sh
  buch read buch-authoring/structure#a-complete-example
  buch read buch-lib/buch-authoring/frontmatter
  ```

- Section anchors are stable, derived from the heading text: trim and lowercase,
  whitespace becomes `-`, other punctuation is dropped, duplicates get `-1`,
  `-2`, … (`"Required fields!"` → `required-fields`).

## Next

- [Frontmatter](frontmatter.md) — the metadata fields.
- [Dynamic values](dynamic-values.md) — `%%key%%` and `.kdb/`.
- [Actions](actions.md) — how to add runnable scripts.
- [Distribution](distribution.md) — publishing and depending on libraries.
