# Nesting test — empirical result

Date: 2026-09-15. buch CLI v1.0.0-beta1, module `github.com/LukasLow/buch`,
source at host `/Users/lukas/home/repos/buch` (git revision `b2a3e39`,
"Initial commit: buch CLI v1.0.0-beta1"), clean tree.

## Environment / how it was run
- The whole test ran in one `smd` invocation with `workdir` on the repo, so the
  repo was mounted at the container `/app` path seen by the command:
  `uname` = `Linux aarch64`, `pwd` = `/app`, `go version` = `go1.26.7 linux/arm64`.
- The prebuilt host `./buch` is a Mach-O (macOS) binary and cannot run in the
  Linux container, so the CLI was rebuilt there (step 1).
- The repo does **not** vendor its dependencies (`vendor: NO`), but the module
  cache already contained the only non-indirect dependency,
  `goja@v0.0.0-20260911104922-fabc3b8078ad`, so the build worked offline.
- The container filesystem persisted across invocations in this environment:
  a second invocation found the `/tmp/buch` binary built by the first.

## Step 1 — build
Command (executed from `/app`):

```
go build -o /tmp/buch ./cmd/buch
```

- Build exit code: **0**.
- Artifact: `/tmp/buch`, 14285345 bytes, owner root.
- `buch version` → `buch v1.0.0-beta1`, exit **0**.
- Note: `file` is not installed in the image, so the exact ELF/Mach-O label
  could not be printed — but the binary executed inside the Linux container,
  proving it is a Linux binary.

## Step 2 — scratch library
Created under the container `/tmp/nest`:

```
/tmp/nest/.buch/+index.md                 id: nest, title: Nest, description: nesting test
/tmp/nest/.buch/deep20.buch/+index.md     id: deep20, 20 path segments
/tmp/nest/.buch/deep25.buch/+index.md     id: deep25, 25 path segments
/tmp/nest/.buch/deep30.buch/+index.md     id: deep30, 30 path segments
```

Each deep buch has one page whose file path has N nested segments before the
file name:

```
deep20/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/page.md
deep25/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/page.md
deep30/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/aa/bb/cc/dd/page.md
```

Every page has the identical content:

```markdown
# Deep page

## A section

body
```

## Step 3 — commands (run from `/tmp/nest`)

### `buch validate`
Exit **0**, stdout: `ok: 0 warning(s)` (stderr empty).
The 20-, 25- and 30-segment pages were all accepted; nothing was skipped or
reported.

### `buch read deep20/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/page`
Exit **0**, output:

```
# Deep page

## A section

body
```

### section selector (`...#a-section`)
Command: `buch read deep20/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/page#a-section`
Exit **0**, output:

```
## A section

body
```

### `--raw`
Command: `buch read deep20/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/page --raw`
Exit **0**, output identical to the rendered read above (the page contains no
`%%key%%` placeholders, so render vs. raw is byte-identical here).

### `buch read deep25/...` — 25 segments
Exit **0**, full page returned (verdict: OK).

### `buch read deep30/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/aa/bb/cc/dd/page`
Exit **0**, full page returned (verdict: OK).

### `buch read deep30/...#a-section`
Exit **0**, section returned (verdict: OK).

### `.md` suffix
`buch read deep20/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/page.md` also exits
**0** with the same page: a trailing `.md` is tolerated (documented behavior).

### negative cases (error text verbatim, from stderr)
- `buch read deep20/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/nope`
  → exit **1**,
  `buch: read: read: page not found: page "a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/nope" in buch "deep20"`
- `buch read nosuch/a/b/page`
  → exit **1**, `buch: read: deps: buch not found: "nosuch"`
- `/tmp/buch --version`
  → exit **1**, `buch: unknown command "--version"` (unsupported, as expected;
  `buch version` is the supported form).

### `buch manifest`
Exit **0**. The manifest lists the deep pages with their full slash paths and
anchors, e.g. for deep30:

- `"rel": "a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/aa/bb/cc/dd/page.md"`
- `"path": "a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z/aa/bb/cc/dd/page"`
- headings: `"deep-page"` (H1, line 1) and `"a-section"` (H2, line 3).

So the manifest, the anchor index and the reader all handle the deep path
consistently; anchors are independent of nesting depth.

### `buch --help`
Exit **0**. Relevant flags printed (global): `--help`. Command list includes
`read <buch>[/page][#section]`. `buch read --help` and `buch validate --help`
both exit **1** with `flag: help requested` on stderr but print their usage —
the per-command help path is not a usable exit-0 flag.

## Step 4 — source repo untouched
Run from the repo workdir (`/app` in the container):

- `git status --porcelain` → output empty `[]`, exit **0**.
- `git log --oneline -1` → `b2a3e39 Initial commit: buch CLI v1.0.0-beta1`.

The repo is unchanged; the test only read and built it.

## Verdicts

| Depth | validate | read | read #section | --raw |
|-------|----------|------|---------------|-------|
| 20 segments | OK | OK (exit 0) | OK (exit 0) | OK (exit 0) |
| 25 segments | OK | OK (exit 0) | not tested | not tested |
| 30 segments | OK | OK (exit 0) | OK (exit 0) | not tested |

**Verdict: page-path nesting of 20, 25 and 30 segments works** — build, scan,
validate, read, section read, raw read and manifest all succeed with no depth
limit observed and no truncation. Page nesting is effectively unbounded for
practical purposes.

## How the selector parses deep paths
`ParseSelector` splits the selector body on `/` and takes **segment 0 as the
buch id, all remaining segments joined back with `/` as the page path**
(`internal/read/selector.go:93-111`); a trailing `.md` on any segment is
stripped first, and `..`/empty segments are rejected. For selectors with two or
more segments, `Resolve` additionally tries the `library/buch/page`
interpretation as a fallback when the first does not resolve
(`internal/read/selector.go:157-166`), which is why a valid deep
`buch/page/...` selector never gets misread as `library/buch`: the buch-page
interpretation is tried first and wins when the page exists.
