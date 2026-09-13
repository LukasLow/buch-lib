# Distribution

A buch is useful alone, and more useful when it can be shared. The distribution
model is git-native: a **library is a git repository**, and consumers depend on
it by URL or by local path. There is no registry, no package upload and no
lockfile in the traditional sense — a commit is the unit of release.

## The repository is the library

Publish a repository whose root contains a `.buch/` directory:

```text
buch-lib/                 # the git repository
├── README.md
├── LICENSE
└── .buch/                # the library consumers depend on
    ├── +index.md
    ├── deps.json
    ├── deps.lock.json
    └── buch-authoring.buch/
```

Consumers add it as a dependency and get every buch the library exposes. The
repository may carry README, LICENSE and tooling alongside `.buch/`; only the
`.buch` directory is the library.

## Adding a dependency

```sh
buch lib add git github.com/LukasLow/buch-lib --as buch-lib --full
buch lib add path /abs/path/to/shared-library --as shared --only notes,guides
buch lib list
```

Dependencies live in the **declaring** library's `deps.json`, which is
committable. Without `--global`/`--local`, `lib add` uses the project-local
library when it finds a `.buch` walking upward, otherwise the global one, and
reports exactly which `deps.json` it changed.

### Source types

- **git** (external): `github.com/USER/REPO`, `https://…git`,
  `git@github.com:USER/REPO.git` or `ssh://…`. The short form normalizes to
  HTTPS. `git://` is rejected and the transport is never switched automatically.
- **path** (internal): an absolute filesystem path to a local library. It is read
  directly — no cache, no commit pin, no git operation, ever.

### Modes: `full` vs `whitelist`

`mode` decides which buchs a dependency exposes:

```json
{
  "format": 1,
  "libraries": {
    "buch-lib": {
      "type": "git",
      "repository": "https://github.com/LukasLow/buch-lib.git",
      "mode": "full"
    },
    "other": {
      "type": "git",
      "repository": "github.com/example/notes",
      "mode": "whitelist",
      "buchs": ["dreego", "onboarding"]
    }
  }
}
```

- `full` exposes every buch in the library.
- `whitelist` requires a `buchs` list and exposes only those; an empty list
  warns and contributes nothing.
- `full` **beats** `whitelist` for the same canonical repository.
- Several whitelists of the same repository are **unioned**.
- The same source referenced by several aliases is merged into one node.
- Transitive dependencies inherit a `full` scope from any full parent.
- Dependency **cycles are invalid** and reported with the cycle path.

`buch validate` reports these rules plus missing whitelisted buchs where the
target is resolvable (path libraries always; git libraries once cached).

## Commit pinning with `deps.lock.json`

`deps.json` is the intent; `deps.lock.json` is the resolved reality. It maps a
library alias to a resolved commit SHA:

```json
{ "format": 1, "libraries": { "buch-lib": "0123abcd…" } }
```

- It is committable, so every consumer gets the same bytes.
- `read`, `manifest` and `exec` use the locked SHA when present.
- `buch update` re-resolves to the current default-branch HEAD and rewrites the
  lock. There are no tags and no semver ranges — **commits only**.
- `path` sources are never locked or pinned; `update` removes any stale entry.

Both files are written deterministically (sorted keys, two-space indent, a
trailing newline) and atomically, so diffs stay reviewable.

## Sync, cache and offline

```sh
buch sync              # direct and transitive git libraries
buch sync --offline    # never touch the network
buch update            # re-resolve locks to the current HEAD
```

Git snapshots are cached globally under `~/.buch/.cache/<host>/<owner>/<repo>/<sha>/`.
Sync resolves the default-branch HEAD, shallow-fetches that commit into a temp
directory, validates it and atomically swaps it into the cache — on any failure
the previous snapshot stays usable. There is no background sync; the CLI checks a
TTL only when it needs remote data.

- Within the TTL, a previously resolved HEAD is reused without network access.
- `--refresh` forces an explicit HEAD check.
- `--offline` never uses the network and fails clearly if the cache is missing.

`buch validate` always runs offline and only inspects already-cached snapshots.

## Trust: internal vs. external

Distribution is where the trust model matters most.

- **Internal — auto-trusted**: the global library (`~/.buch`), a project-local
  library, and every `path` library.
- **External — untrusted until granted**: every `git` remote.

Key rendering and action execution are **separate** gates. A reader who trusts a
library to render values has not thereby trusted it to run code:

```sh
buch trust github.com/LukasLow/buch-lib           # grant kdb + actions
buch trust github.com/LukasLow/buch-lib --kdb     # only render keys
buch trust github.com/LukasLow/buch-lib --actions # only run actions
buch trust github.com/LukasLow/buch-lib --revoke
```

Trust lives only in the global `config.json` and is **never adopted from a
remote library**. An untrusted git page that contains placeholders makes `read`
fail loudly unless you pass `--raw`; it never silently renders.

## Precedence

Origins are tiered: **local < global < path < remote** — internal origins
outrank external ones.

- A local buch shadows a global one with a one-line stderr warning.
- A `path` buch shadows a remote git buch with the same id, also with a warning.
- Duplicate ids **within one scope** are a hard error listing both paths.
- Qualify an ambiguous name as `library/buch`; `list` shows each buch's origin.

## Publishing checklist

- [ ] `.buch/+index.md` has a valid `id`, `title` and `description`.
- [ ] Every buch validates: `buch validate` exits `0`.
- [ ] `deps.json` / `deps.lock.json` are committed and deterministic.
- [ ] A README explains what the library is and how to add it.
- [ ] A LICENSE is present (this library uses MIT).
- [ ] Actions are documented, small and safe; expect readers to review them
      before granting actions trust.
- [ ] Release by committing; consumers pin the commit in their lockfile.
