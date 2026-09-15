# Packaging and distribution

How to build and ship Mojo code: precompiled `.mojoc` packages for local speed,
conda packages for distribution through the `modular-community` channel, and the
compiler-version constraint that ties them together. The primary sources are the
[Packaging guide](https://mojolang.org/docs/tools/packaging/), the
[Packages page](https://mojolang.org/packages/), and the
[`mojo precompile`](https://mojolang.org/docs/cli/precompile/) command page.

## Two different things called "packaging"

Keep these apart; conflating them causes most of the confusion.

| Mechanism | Artifact | Purpose | Distributable? |
|-----------|----------|---------|----------------|
| **Precompilation** | `.mojoc` file | Faster builds for your own/downstream Mojo code | **No** — compiler-version-locked |
| **Conda packaging** | `.conda` file | Installing your library as a package | Yes — the documented distribution path |

`.mojoc` is an internal build cache; `.conda` is the distribution format.
Source: <https://mojolang.org/docs/cli/precompile/>,
<https://mojolang.org/docs/tools/packaging/>.

## Precompiled packages (`.mojoc`)

### The contract

> A precompiled Mojo package is faster to build with compared to building it from
> source. It is not intended as a distributable format as it is tied to the
> version of the compiler that produced it. Loading a precompiled package using
> a compiler of a different version will error. Despite this, it is technically
> portable across different systems because it is not an architecture-specific
> format (it includes only non-elaborated code). The code becomes an
> architecture-specific executable only after it's imported into a Mojo program
> that is then compiled with `mojo build`.

Source: <https://mojolang.org/docs/cli/precompile/>.

### Building one

```sh
mojo precompile src/my_mojo_lib -o $PREFIX/lib/mojo/my_mojo_lib.mojoc
```

The filename **is** the import name (minus the extension), and the `lib/mojo/`
location is what makes a package "auto-discoverable by the Mojo compiler" — the
packaging guide stresses exactly this:

> It's important that this command outputs the `.mojoc` file into
> `$PREFIX/lib/mojo/`, because this path is what makes the package
> auto-discoverable by the Mojo compiler.

Source: <https://mojolang.org/docs/tools/packaging/>.

Full command reference: [`mojo precompile`](../cli/precompile.md).

### The compiler-version constraint

Precompiled files and the compiler that consumes them must match:

> Precompiled Mojo files compile against a specific compiler version and might
> not be compatible with other versions. The required `mojo-compiler` version
> must be specified in the `requirements.build` section of your recipe.

Source: <https://mojolang.org/docs/tools/packaging/>.

**This is why the packaging recipe pins `mojo-compiler`, not `mojo`** — the
runtime that loads a `.mojoc` is the compiler, so the compiler version must be
constrained. (Both packages include the CLI and compiler; only `mojo` adds the
LSP, debugger, formatter and REPL —
<https://mojolang.org/docs/faq/>.)

## Conda packaging with `rattler-build`

### How it works

> *rattler-build* is a tool that turns your source code into a conda package. You
> give it a *recipe*—a YAML file named `recipe.yaml`—and it does the rest:
> fetches your source, compiles it in an isolated environment, runs your tests,
> and writes out a `.conda` file ready to upload to a package index.

The recipe specifies:

- the source code location (a git commit or tarball URL),
- the build process (a `mojo precompile` command),
- package dependencies,
- test commands to verify the build.

The process:

1. Create a `recipe.yaml`.
2. Run `rattler-build` to create a `.conda` package.
3. Share the package in a public package index.

Source: <https://mojolang.org/docs/tools/packaging/>.

### Install `rattler-build`

```bash
curl -fsSL https://pixi.sh/install.sh | sh   # install pixi first if needed
pixi global install rattler-build
rattler-build --version
```

Source: <https://mojolang.org/docs/tools/packaging/>. See
[Pixi](../tooling/pixi.md).

### Write the recipe

By convention the recipe lives at `conda.recipe/recipe.yaml`:

```text
my-mojo-lib/
├── src/
│   └── my_mojo_lib/
│       ├── __init__.mojo
│       └── utils.mojo
├── test.mojo
├── conda.recipe/
│   └── recipe.yaml
├── LICENSE
└── README.md
```

The guide's template:

```yaml title="recipe.yaml"
context:
  version: "0.1.0"

package:
  name: my-mojo-lib
  version: ${{ version }}

source:
  - git: https://github.com/yourname/my-mojo-lib.git
    rev: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2

build:
  number: 0
  script:
    - mojo precompile src/my_mojo_lib -o ${{ PREFIX }}/lib/mojo/my_mojo_lib.mojoc

requirements:
  build:
    - mojo-compiler =25.5.0
  host:
    - mojo-compiler =25.5.0
  run:
    - ${{ pin_compatible('mojo-compiler') }}

tests:
  - script:
      - if: unix
        then:
          - mojo run test.mojo
    files:
      recipe:
        - test.mojo

about:
  homepage: https://github.com/yourname/my-mojo-lib
  repository: https://github.com/yourname/my-mojo-lib
  license: MIT
  license_file: LICENSE
  summary: A short one-line description of what your library does.

extra:
  maintainers:
    - yourname
```

Source: <https://mojolang.org/docs/tools/packaging/>.

> **Note on the pinned version string.** The template shows
> `mojo-compiler =25.5.0`. That is the packaging guide's example, written in the
> pre-1.0 conda version scheme (`25.5` for what PyPI called `0.25.5`). The Mojo
> 1.0 release is published as `mojo==1.0.0` on the releases index
> (<https://mojolang.org/releases/>); a 1.x recipe would therefore constrain
> `mojo-compiler =1.0.0`-style. This book documents `%%mojo.version%%` as the
> current version; see [version history](../intro/version-history.md) for the
> two numbering channels. Do not copy `25.5.0` into a new 1.x recipe as if it
> were current.

### Recipe rules that matter

| Rule | Official wording / meaning |
|------|----------------------------|
| **Full commit SHA** | "The `source.rev` field should be a full 40-character git commit SHA rather than a branch name or tag. This makes the build reproducible." |
| **Build number** | "Start `build.number` at `0`. If you need to rebuild the same version … increment `build.number` rather than changing the version. Reset it to `0` when you bump the version." |
| **Install location** | Output the `.mojoc` into `$PREFIX/lib/mojo/`, "because this path is what makes the package auto-discoverable by the Mojo compiler." |
| **Pin the compiler** | `requirements.build` must pin `mojo-compiler`; `pin_compatible('mojo-compiler')` in `requirements.run` "generates a version constraint based on whichever version is resolved at build time, preventing your package from silently running against an incompatible runtime." |

Source: <https://mojolang.org/docs/tools/packaging/>.

`$PREFIX` is explained directly:

> When `rattler-build` runs your build script, it sets a `$PREFIX` environment
> variable pointing to the root of an isolated installation directory. Any files
> your script places under `$PREFIX` become part of the conda package.

Source: <https://mojolang.org/docs/tools/packaging/>.

### Build the package

```bash
rattler-build build \
  --recipe conda.recipe/recipe.yaml \
  -c conda-forge \
  -c https://conda.modular.com/max \
  -c https://repo.prefix.dev/modular-community
```

The `-c` flags are channels "in priority order":

- `conda-forge` for general tooling;
- `https://conda.modular.com/max` for `mojo-compiler` and `max`;
- `https://repo.prefix.dev/modular-community` if you depend on other community
  Mojo packages.

`rattler-build build` then:

1. creates an isolated build environment,
2. fetches your source,
3. runs your build script to compile the `.mojoc`,
4. bundles the result into a `.conda` archive,
5. runs your test commands.

Output appears under `output/`, e.g.
`output/linux-64/my-mojo-lib-0.3.0-h1a2b3c4_0.conda`; "The hash in the filename
(`h1a2b3c4`) is derived from the build configuration and is managed
automatically." Source: <https://mojolang.org/docs/tools/packaging/>.

### Debug a failed build

```bash
rattler-build debug shell
```

> This gives you a shell with all environment variables set (`$PREFIX`,
> `$SRC_DIR`, etc.) and the build environment activated, so you can run your
> build commands to find the problem.

Source: <https://mojolang.org/docs/tools/packaging/>.

## Publishing

### To the modular-community channel (recommended)

> To publish your package on the [modular-community
> channel](https://prefix.dev/channels/modular-community), open a pull request to
> the [modular-community GitHub
> repo](https://github.com/modular/modular-community) to add your package's
> `recipe.yaml` file. The repo automatically builds and hosts all the packages
> based on the recipes in the repo.

The file goes in a directory matching the package name:

```text
modular-community/
└── recipes/
    └── my-mojo-lib/
        └── recipe.yaml
```

**If you distribute only through modular-community, you only need to merge the
recipe** — "the repo handles steps 2 and 3" (build and publish). Source:
<https://mojolang.org/docs/tools/packaging/>.

### To other indexes

> Once you have a built `.conda` file, you can upload it to any compatible host,
> such as [prefix.dev](https://prefix.dev), [anaconda.org](https://anaconda.org),
> or an AWS S3 bucket.

Source: <https://mojolang.org/docs/tools/packaging/>.

### CodeQL requirement

> If your package includes Python or any language other than Mojo, you must
> enable [CodeQL
> scanning](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning)
> on your source repository and add the badge to your README.

Source: <https://mojolang.org/docs/tools/packaging/>.

## Installing community packages

The packages page points to the same channel for installation:

```toml
[workspace]
channels = [
  "https://conda.modular.com/max-nightly",
  "https://repo.prefix.dev/modular-community",
  "conda-forge",
]
```

> You can install and distribute Mojo packages as conda packages. The packages
> below are all available in the modular-community conda channel.

Source: <https://mojolang.org/packages/>.

Then `pixi add <package>` pulls from the configured channels
(<https://mojolang.org/docs/pixi/>). See [Pixi](../tooling/pixi.md).

The packages page also records the roadmap:

> We're also working on plans for a native Mojo package manager. If you'd like to
> learn more and provide feedback, join the forum discussion.

Source: <https://mojolang.org/packages/>.

> **Open question — a native package manager does not exist yet.** There is no
> documented Mojo-native package manager in 1.x; distribution is via conda
> packages. The forum discussion confirms it is only planned. Do not teach a
> native package manager as available. Sources:
> <https://mojolang.org/packages/>,
> <https://mojolang.org/llms.txt>.

## Updating a published package

The documented checklist:

1. Update `context.version` in your recipe.
2. Update `source.rev` to the new commit SHA (or the tarball URL and SHA256).
3. Reset `build.number` to `0`.
4. Open a new PR to modular-community (if you already published there).

> If you're republishing the same version (for example, to support a new Mojo
> compiler release), increment `build.number` instead of changing the version.

Source: <https://mojolang.org/docs/tools/packaging/>.

## `mojo-compiler` in build and host

The recipe pins `mojo-compiler` in **both** `requirements.build` and
`requirements.host`, and uses `pin_compatible` in `requirements.run`. The reason
is the `.mojoc` version lock above. This is also why package authors are the one
audience for whom `mojo-compiler` (rather than the full `mojo` package) is
called out in the install discussion
(<https://mojolang.org/docs/faq/>). See [install](../intro/install.md).

> **Open question — end-user install of `mojo-compiler`.** As noted on the
> install page, the official docs never show a direct end-user install command
> for `mojo-compiler` (no `pixi add mojo-compiler`). It appears as a build/host
> dependency of precompiled packages. Whether it is meant for direct install is
> unstated. Sources: <https://mojolang.org/docs/tools/packaging/>,
> <https://mojolang.org/docs/faq/>.

## End-to-end checklist

- [ ] Package has `__init__.mojo` and builds with
      `mojo precompile src/my_lib -o …/lib/mojo/my_lib.mojoc`.
- [ ] `conda.recipe/recipe.yaml` exists, with a full 40-char `source.rev`.
- [ ] `requirements.build`/`host` pin `mojo-compiler` to the target version
      (`1.0.0`-style for 1.x); `requirements.run` uses
      `pin_compatible('mojo-compiler')`.
- [ ] `build.number` starts at `0`.
- [ ] `tests` run the package (`mojo run test.mojo`).
- [ ] `rattler-build build` with the three channels succeeds and emits a
      `.conda` under `output/`.
- [ ] Recipe merged into `modular/modular-community` (for the community channel),
      with CodeQL enabled if any non-Mojo language is included.
- [ ] `about` metadata (license, license file, summary, repository) is filled in.

Sources: <https://mojolang.org/docs/tools/packaging/>,
<https://mojolang.org/packages/>.

## Pitfalls

- **Shipping a `.mojoc` as a distributable.** It errors across compiler versions;
  distribute a conda package instead. Sources:
  <https://mojolang.org/docs/cli/precompile/>,
  <https://mojolang.org/docs/tools/packaging/>.
- **Pinning `mojo` instead of `mojo-compiler` for a package.** The guide pins
  `mojo-compiler`; the loader is the compiler, and `mojo` drags in the LSP and
  debugger that packages do not need. Source:
  <https://mojolang.org/docs/tools/packaging/>.
- **Not putting the `.mojoc` under `$PREFIX/lib/mojo/`.** Without that path the
  package is not auto-discoverable. Source:
  <https://mojolang.org/docs/tools/packaging/>.
- **Using a branch or tag as `source.rev`.** Use a full 40-character commit SHA
  for reproducibility. Source: <https://mojolang.org/docs/tools/packaging/>.
- **Bumping the version instead of the build number for a same-version rebuild.**
  Increment `build.number`. Source: <https://mojolang.org/docs/tools/packaging/>.
- **Copying the pre-1.0 version string.** The template's `25.5.0` is the old
  conda scheme; 1.x uses `1.0.0`-style versions. Sources:
  <https://mojolang.org/docs/tools/packaging/>,
  <https://mojolang.org/releases/>,
  [version history](../intro/version-history.md).
- **Expecting a native Mojo package manager.** Distribution is conda-based; a
  native manager is only planned. Source: <https://mojolang.org/packages/>.
- **Forgetting CodeQL when bundling non-Mojo code.** Required for the community
  channel. Source: <https://mojolang.org/docs/tools/packaging/>.
- **Renaming a `.mojoc` by editing the file.** The package name is encoded;
  re-run `mojo precompile`. Source:
  <https://mojolang.org/docs/manual/packages/>.

## See also

- [`mojo precompile`](../cli/precompile.md) — the precompilation command.
- [Structure](structure.md) — the package layout the recipe builds.
- [CI](ci.md) — building and testing before publishing.
- [Pixi](../tooling/pixi.md) — installing `rattler-build` and consuming
  community packages.
- [Install](../intro/install.md) — `mojo` vs `mojo-compiler`.
- [Version history](../intro/version-history.md) — conda vs PyPI numbering.

## Sources

- Packaging: <https://mojolang.org/docs/tools/packaging/>
- Packages: <https://mojolang.org/packages/>
- `mojo precompile`: <https://mojolang.org/docs/cli/precompile/>
- Modules and packages (manual): <https://mojolang.org/docs/manual/packages/>
- Mojo FAQ (`mojo` vs `mojo-compiler`): <https://mojolang.org/docs/faq/>
- Pixi basics: <https://mojolang.org/docs/pixi/>
- Mojo releases (package versions): <https://mojolang.org/releases/>
- Mojo v1.0.0b2 release notes (`mojo package` → `mojo precompile`, `.mojoc`):
  <https://mojolang.org/releases/v1.0.0b2/>
- Official docs map: <https://mojolang.org/llms.txt>
