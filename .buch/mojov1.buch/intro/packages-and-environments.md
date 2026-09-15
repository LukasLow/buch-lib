# Packages and environments

This page is about the layer **around** the Mojo compiler: how Mojo and
third-party packages actually get into a project, which channels and indexes
they come from, how a project pins Mojo's version, how third-party Mojo packages
are distributed, and the Python prerequisite for interop.

The [packages and modules](packages-and-modules.md) page is about how *your* code
is laid out on disk. This page is about the toolchain that supplies the compiler
and the dependencies that code imports.

Sources are the official [install guide](https://mojolang.org/install/),
[Pixi basics](https://mojolang.org/docs/pixi/),
[Packages](https://mojolang.org/packages/),
[FAQ](https://mojolang.org/docs/faq/),
[Packaging guide](https://mojolang.org/docs/tools/packaging/), and the
[get-started tutorial](https://mojolang.org/docs/manual/get-started/).

> **Why this matters for a reader of this buch.** This buch documents Mojo
> `%%mojo.version%%`. "The latest version" is not that version. A project that
> does not pin its toolchain will silently move off the documented release. The
> pinning commands below are the fix.

## The two ways to get Mojo

Mojo "installs exactly like a Python or Conda package"; there is no standalone
installer (<https://mojolang.org/install/>). The FAQ puts it from the SDK side:
"You can get Mojo and all the developer tools by installing `mojo` with any
Python or Conda package manager" (<https://mojolang.org/docs/faq/>).

| Path | Package manager | Install command | Where the package comes from |
|------|-----------------|-----------------|------------------------------|
| Python | `uv` (or any pip-compatible tool) | `uv pip install mojo` | PyPI |
| Conda | `pixi` (or any conda tool) | `pixi add mojo` | `conda.modular.com` channels |

Source: <https://mojolang.org/install/>.

The get-started tutorial recommends the pixi path explicitly: "To install Mojo,
we recommend using [`pixi`](https://pixi.sh/latest/) (for other options, see the
[install guide](/install/))." Source:
<https://mojolang.org/docs/manual/get-started/>.

### The pixi path, end to end

```sh
# 1. Install pixi if needed.
curl -fsSL https://pixi.sh/install.sh | sh

# 2. Create the project with the Modular channel and conda-forge.
pixi init life \
  -c https://conda.modular.com/max/ -c conda-forge
cd life

# 3. Add Mojo.
pixi add mojo

# 4. Verify inside the project environment.
pixi run mojo --version
```

Source: <https://mojolang.org/docs/manual/get-started/>,
<https://mojolang.org/install/>.

`pixi add` writes the dependency into `pixi.toml`; `pixi.lock` records the
transitive dependencies and the exact installed versions and "is automatically
generated—you should not edit this file by hand" (<https://mojolang.org/docs/pixi/>).
`pixi run <cmd>` executes a command inside the project environment; `pixi shell`
opens a shell in it. See [Pixi](../tooling/pixi.md) for the full guide.

### The uv path, end to end

```sh
# 1. Install uv if needed.
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Install Mojo into the current environment.
uv pip install mojo
```

Or, as a project dependency:

```sh
uv init hello-world
cd hello-world
uv add mojo
```

Source: <https://mojolang.org/install/>.

Because `mojo` is a wheel on PyPI, the install page notes that any
pip-compatible tool works, even though it demonstrates `uv`
(<https://mojolang.org/install/>).

## Channels and indexes

"Channel" is the conda word; "index" is the Python/pip word. They are different
supply chains and can even carry different version numbers for the same calendar
release (see [version history](version-history.md)).

### Conda channels

| Channel | URL | What it carries |
|---------|-----|-----------------|
| Stable | `https://conda.modular.com/max/` | `mojo`, `mojo-compiler`, `max` (stable releases) |
| Nightly | `https://conda.modular.com/max-nightly/` | The same packages, nightly builds |
| Community packages | `https://repo.prefix.dev/modular-community` | Third-party Mojo packages |
| General tooling | `conda-forge` | Everything not supplied by Modular |

Sources: <https://mojolang.org/install/>,
<https://mojolang.org/docs/pixi/>,
<https://mojolang.org/packages/>,
<https://mojolang.org/docs/tools/packaging/>.

The install page's project form passes the stable channel plus conda-forge:

```sh
pixi init hello-world \
  -c https://conda.modular.com/max/ -c conda-forge
cd hello-world
pixi add mojo
```

Nightly swaps the channel:

```sh
pixi init hello-world \
  -c https://conda.modular.com/max-nightly/ -c conda-forge
cd hello-world
pixi add mojo
```

Source: <https://mojolang.org/install/>.

Instead of passing `-c` every time, the Pixi page's recommended alternative is to
set default channels once in `$HOME/.pixi/config.toml`:

```sh
mkdir -p $HOME/.pixi
echo 'default-channels = ["https://conda.modular.com/max-nightly", "conda-forge"]' \
  >> $HOME/.pixi/config.toml
```

Source: <https://mojolang.org/docs/pixi/>.

### Python indexes

The stable Python package comes from PyPI. The nightly Python package uses a
separate wheel index and must be allowed to resolve a prerelease:

```sh
uv pip install mojo \
  --index https://whl.modular.com/nightly/simple/ \
  --prerelease allow
```

```sh
uv init hello-world
cd hello-world
uv add mojo \
  --index https://whl.modular.com/nightly/simple/ \
  --prerelease allow
```

Source: <https://mojolang.org/install/> (via the
[nightly install page](https://mojolang.org/nightly/install/)).

`conda-forge` is required alongside the Modular channel: the Modular channel
does not carry every general-purpose dependency. The community channel is only
needed "if you depend on other community Mojo packages"
(<https://mojolang.org/docs/tools/packaging/>).

> **Do not mix stable and nightly in one project.** The stable channel is
> `.../max/`; nightly is `.../max-nightly/`. Pick one per project and keep the
> lock file with it. Source: <https://mojolang.org/install/>,
> <https://mojolang.org/docs/pixi/>.

## Pinning Mojo's version

This is the section the rest of the page exists for. The documented pinning
mechanism is a **package version specifier** in `pixi.toml`, set through
`pixi add`.

### The documented commands

```sh
# Pin to the 1.0.x line (compatible release: >=1.0.0, <1.1.0).
pixi add "mojo~=1.0.0"

# Pin to exactly one version.
pixi add "mojo==1.0.0"

# Always the latest version (no pin).
pixi add "mojo=*"
```

Source: <https://mojolang.org/docs/pixi/>. The Pixi page presents the version
specifier with the example `pixi add "mojo~=1.0.0" "numpy<2.0"` and the wildcard
form `pixi add "mojo=*"`.

Update and remove stay within the constraint you set:

```sh
pixi update mojo    # updates within the version you defined in pixi.toml
pixi remove mojo
```

Source: <https://mojolang.org/docs/pixi/>.

### Verify what is actually installed

```sh
pixi run mojo --version
# or, inside the environment:
pixi shell
mojo --version
```

Since v1.0.0b1, `mojo --version` prints a semantic version such as `1.0.0`
"instead of an internal build identifier" (<https://mojolang.org/releases/v1.0.0b1/>).
The tutorial says the resolved version "by default should be the latest version.
You can view and edit the version for your project in the dependencies list in
the `pixi.toml` file" (<https://mojolang.org/docs/manual/get-started/>).

### Why a version pin, concretely

- **This buch documents one release.** A project on an unpinned toolchain can
  drift to the next nightly and hit syntax or API differences the buch does not
  describe.
- **`.mojoc` files are compiler-version-locked.** "Precompiled Mojo files
  compile against a specific compiler version and might not be compatible with
  other versions" (<https://mojolang.org/docs/tools/packaging/>). A pinned
  toolchain keeps precompiled dependencies loadable.
- **Older stable versions are not retained.** The releases index states plainly:
  "Older versions are no longer available to install."
  (<https://mojolang.org/releases/>) Pin what you have and commit `pixi.lock`,
  rather than assuming you can reinstall an old version later.

> **Open question — a pinned `uv` install is not shown on the Mojo pages.** The
> install page demonstrates `uv pip install mojo` and `uv add mojo` without a
> version specifier, and its `.md` rendering drops the code blocks entirely (see
> [install](install.md)), so no pinned `uv` form is visible in the official Mojo
> 1.x pages. The version specifier itself is standard PyPI/pip syntax, not a
> Mojo feature, and the FAQ only says `mojo` installs "with any Python or Conda
> package manager" (<https://mojolang.org/docs/faq/>). The pinned forms that
> *are* documented on the Mojo pages are the `pixi add` forms above. Verify a
> pinned `uv` invocation against the rendered install page before teaching it.

The historical pinning example the release notes use is the conda-scheme form —
`pixi add "mojo==25.5"` — which is pre-1.0 numbering; do not copy that string
into a 1.x project (<https://mojolang.org/releases/v0.25.6/>, see
[version history](version-history.md)).

## The two packages: `mojo` and `mojo-compiler`

The FAQ is explicit: "We actually offer two Mojo packages: `mojo` and
`mojo-compiler`" (<https://mojolang.org/docs/faq/>).

| Package | Contains | Use it for |
|---------|----------|------------|
| `mojo` | `mojo` CLI (incl. compiler), standard library, `mojo` Python package, LSP, debugger (LLDB), formatter, REPL | Development: editing, debugging, formatting, REPL |
| `mojo-compiler` | `mojo` CLI (incl. compiler), standard library, `mojo` Python package | CI/production that only builds or runs existing code; a dependency of precompiled packages |

Source: <https://mojolang.org/docs/faq/>. The `mojo-compiler` package "is smaller
and is useful for environments where you only need to call or build existing
Mojo code … situations where you don't need the LSP and debugger tools"
(<https://mojolang.org/docs/faq/>).

For GPU work the FAQ points to a separate package:

> If you're interested in GPU programming, install the `max` package, which
> includes the MAX framework and Mojo.
> — <https://mojolang.org/docs/faq/>

> **Open question — no end-user install command for `mojo-compiler` is
> documented.** The install page only shows installs for `mojo`; the FAQ
> documents `mojo-compiler` as a package choice; the packaging guide uses it as
> a build/host requirement (`mojo-compiler =25.5.0`) and via
> `pin_compatible('mojo-compiler')`. No Mojo 1.x page shows
> `uv pip install mojo-compiler` or `pixi add mojo-compiler`. See
> [install](install.md) for the same gap flagged in context. Sources:
> <https://mojolang.org/docs/faq/>,
> <https://mojolang.org/install/>,
> <https://mojolang.org/docs/tools/packaging/>.

> **Open question — `max[all]` is not documented on mojolang.org.** Do not teach
> the extras form; the documented GPU install is plain "install the `max`
> package". The `[all]` form appears only in MAX documentation on the separate
> `max.modular.com` domain. Sources: <https://mojolang.org/docs/faq/>,
> <https://mojolang.org/install/>. See [install](install.md).

## How third-party Mojo packages are distributed

Third-party Mojo code is distributed as **conda packages**, not through a
Mojo-native registry:

> You can install and distribute Mojo packages as conda packages.
>
> The packages below are all available in the
> [modular-community](https://prefix.dev/channels/modular-community) conda
> channel.

Source: <https://mojolang.org/packages/>.

To consume community packages, add the community channel to the project's
`pixi.toml`:

```toml
[workspace]
channels = [
  "https://conda.modular.com/max-nightly",
  "https://repo.prefix.dev/modular-community",
  "conda-forge",
]
```

Source: <https://mojolang.org/packages/>. Then `pixi add <package>` resolves from
the configured channels (<https://mojolang.org/docs/pixi/>).

The channel URL is also confirmed by the packaging guide, which lists
`https://repo.prefix.dev/modular-community` among the build channels for "other
community Mojo packages" (<https://mojolang.org/docs/tools/packaging/>).

> **Open question — a native Mojo package manager does not exist yet.** The
> packages page says only: "We're also working on plans for a native Mojo package
> manager. If you'd like to learn more and provide feedback, join the forum
> discussion." Distribution in 1.x is conda-based. Do not teach a Mojo-native
> `install`/`add` command. Sources: <https://mojolang.org/packages/>,
> <https://mojolang.org/docs/tools/packaging/>.

### The compiler-version requirement for Mojo packages

A distributed Mojo package ships as a `.mojoc` file inside a conda package, and
it is tied to the compiler that produced it. The packaging guide's requirement
block:

```yaml
requirements:
  build:
    - mojo-compiler =25.5.0
  host:
    - mojo-compiler =25.5.0
  run:
    - ${{ pin_compatible('mojo-compiler') }}
```

Source: <https://mojolang.org/docs/tools/packaging/>. The guide's rule:

> Precompiled Mojo files compile against a specific compiler version and might
> not be compatible with other versions. The required `mojo-compiler` version
> must be specified in the `requirements.build` section of your recipe.

And the `run` constraint: `pin_compatible('mojo-compiler')` "generates a version
constraint based on whichever version is resolved at build time, preventing your
package from silently running against an incompatible runtime."
(<https://mojolang.org/docs/tools/packaging/>)

> **Note on the pinned string.** The template's `mojo-compiler =25.5.0` is the
> guide's own example, written in the pre-1.0 conda scheme (`25.5` for what PyPI
> called `0.25.5`). A 1.x recipe constrains a `1.0.0`-style version. Do not copy
> `25.5.0` into a new recipe as if it were current. Sources:
> <https://mojolang.org/docs/tools/packaging/>,
> <https://mojolang.org/releases/>, [version history](version-history.md).

So the practical contract when you depend on a third-party Mojo package is: the
package's conda metadata already pins a compatible `mojo-compiler`, and your
project's pinned Mojo must satisfy it. The full recipe mechanics are on
[packaging and distribution](../project/packaging-and-distribution.md).

## Dependencies beyond Mojo

The same managers install the rest of your dependencies. The quickstart's Python
example is the clearest documented pair:

**uv:**

```sh
uv pip install numpy
```

**pixi:**

```sh
pixi add numpy
```

Source: <https://mojolang.org/docs/manual/quickstart/>. The Pixi page shows a
pinned multi-package form: `pixi add "mojo~=1.0.0" "numpy<2.0"`
(<https://mojolang.org/docs/pixi/>).

For a pure-Mojo program, nothing else is required. For a program that imports
Python, the interpreter itself must come from the environment (next section).

## Python interop needs Python 3.10–3.14

Mojo does not include a Python interpreter, and it does not require one unless
you use interop:

> Mojo itself doesn't require Python. To use the Mojo ↔ Python interoperability
> features described in this section, you need Python 3.10–3.14.

Source: <https://mojolang.org/docs/manual/python/>. The requirements page
confirms the window (<https://mojolang.org/docs/requirements/>), and the FAQ
notes that GPU work is likewise separate from the Python prerequisite
(<https://mojolang.org/docs/faq/>).

The interpreter is a property of the **runtime environment**, not of the
executable:

- "Mojo doesn't include a CPython interpreter—it uses the CPython interpreter
  provided by your environment's default Python version."
- "`mojo build` doesn't include the Python packages used by your Mojo project.
  Instead, Mojo loads the Python interpreter and Python packages at runtime, so
  they must be provided in the environment where you run the Mojo program."

Source: <https://mojolang.org/docs/manual/python/python-from-mojo/>. So a
binary built inside a pixi environment needs that environment (or an equivalent)
where it runs. See [calling Python from Mojo](../interop/calling-python.md) for
the interop mechanics.

Pin the interpreter with Pixi so Mojo and Python agree on it:

```sh
pixi add "python==3.11"
pixi run python --version
```

```output
Python 3.11.0
```

Source: <https://mojolang.org/docs/pixi/>. The Python interop manual makes the
same recommendation and gives the reason: "Now, even if your operating system's
default Python version is something else, your Pixi project (and the Mojo code
inside) always uses Python 3.11."
(<https://mojolang.org/docs/manual/python/python-from-mojo/>) The get-started
tutorial's recommended stack is pixi-based for the same reproducibility reason
(<https://mojolang.org/docs/manual/get-started/>).

**Pitfall:** `python==3.11` here is the *interop* interpreter. Installing Python
does not make Mojo depend on it, and installing Mojo does not install Python.
Pick a version inside 3.10–3.14 when interop is in play.

## Where the dependency state lives

| File | Manager | Role | Edit by hand? |
|------|---------|------|---------------|
| `pixi.toml` | pixi | Declares direct dependencies and channels | Yes — that is the manifest |
| `pixi.lock` | pixi | Records transitive dependencies and exact versions | **No** — "automatically generated" |
| `conda.recipe/recipe.yaml` | rattler-build | Builds *your* package for distribution | Yes — that is the recipe |

Sources: <https://mojolang.org/docs/pixi/>,
<https://mojolang.org/docs/manual/get-started/>,
<https://mojolang.org/docs/tools/packaging/>.

> **Open question — there is no documented `.mojo`-specific project manifest.**
> No `pyproject.toml`-equivalent for Mojo-only projects is documented; project
> configuration that exists is external (`pixi.toml` for the environment, the
> conda recipe for packaging). The same gap is recorded on
> [project structure](../project/structure.md). Source:
> <https://mojolang.org/llms.txt>.

## A reproducible project, start to finish

Every command is documented; the assembly is the practical recipe for a project
that stays on the release this buch documents.

```sh
# 1. Project with the Modular stable channel and conda-forge.
pixi init my-mojo-project \
  -c https://conda.modular.com/max/ -c conda-forge
cd my-mojo-project

# 2. Pin the toolchain to the 1.0.x line.
pixi add "mojo~=1.0.0"

# 3. If (and only if) the project uses Python interop, pin the interpreter.
pixi add "python==3.11"

# 4. Add other dependencies.
pixi add "numpy<2.0"

# 5. Verify the toolchain version inside the environment.
pixi run mojo --version

# 6. Work in the environment.
pixi shell
mojo run app.mojo
mojo format app.mojo
exit

# 7. Commit pixi.toml and pixi.lock (never edit the lock by hand).
```

Sources: <https://mojolang.org/docs/pixi/>,
<https://mojolang.org/docs/manual/get-started/>,
<https://mojolang.org/install/>.

## Pitfalls

- **Installing Mojo but never pinning it.** The project drifts off the release
  this buch documents. Use a specifier such as `pixi add "mojo~=1.0.0"`
  (<https://mojolang.org/docs/pixi/>).
- **Editing `pixi.lock` by hand.** It is generated; let `pixi add`/`pixi update`
  change it. Sources: <https://mojolang.org/docs/pixi/>,
  <https://mojolang.org/docs/manual/get-started/>.
- **Forgetting the channel.** A package cannot resolve without the Modular
  channel; pass `-c` or set `default-channels` in `$HOME/.pixi/config.toml`.
  Source: <https://mojolang.org/docs/pixi/>.
- **Mixing stable and nightly channels.** Keep one per project. Sources:
  <https://mojolang.org/docs/pixi/>, <https://mojolang.org/install/>.
- **Expecting `mojo-compiler` to include the REPL/formatter/LSP.** It does not;
  install `mojo` for those. Source: <https://mojolang.org/docs/faq/>.
- **Assuming `max[all]` is a documented install form.** Install `max` plainly.
  Source: <https://mojolang.org/docs/faq/>.
- **Using `25.5.0`-style pins in a 1.x recipe.** That is the pre-1.0 conda
  scheme; 1.x uses `1.0.0`-style versions. Sources:
  <https://mojolang.org/docs/tools/packaging/>,
  <https://mojolang.org/releases/>.
- **Pinning a Python outside 3.10–3.14 and using interop.** The supported window
  is explicit. Sources: <https://mojolang.org/docs/requirements/>,
  <https://mojolang.org/docs/manual/python/>.
- **Expecting the executable to carry Python and its packages.** It does not;
  the runtime environment must provide them.
  Source: <https://mojolang.org/docs/manual/python/python-from-mojo/>.
- **Looking for a Mojo-native package manager.** Only planned; distribution is
  conda-based. Source: <https://mojolang.org/packages/>.
- **Copying a historical `pixi add "mojo==25.5"` pin.** It is the pre-1.0
  numbering shown in a release note, not a 1.x command. Source:
  <https://mojolang.org/releases/v0.25.6/>.

## See also

- [Packages and modules](packages-and-modules.md) — how your own code is
  organised on disk.
- [Packaging and distribution](../project/packaging-and-distribution.md) — the
  conda recipe, `mojo-compiler` pins and the `modular-community` channel.
- [Pixi](../tooling/pixi.md) — the environment manager in depth.
- [Install](install.md) — the SDK packages and platform prerequisites.
- [Supported platforms](supported-platforms.md) — OS, CPU, RAM and Python
  requirements.
- [Version history](version-history.md) — conda vs PyPI numbering.
- [Calling Python from Mojo](../interop/calling-python.md) — what the 3.10–3.14
  interpreter is actually used for.
- [Your first program](first-program.md) — the first run/build loop in a pinned
  project.

## Sources

- https://mojolang.org/install/
- https://mojolang.org/nightly/install/
- https://mojolang.org/docs/pixi/
- https://mojolang.org/packages/
- https://mojolang.org/docs/faq/
- https://mojolang.org/docs/requirements/
- https://mojolang.org/docs/tools/packaging/
- https://mojolang.org/docs/manual/get-started/
- https://mojolang.org/docs/manual/quickstart/
- https://mojolang.org/docs/manual/python/
- https://mojolang.org/docs/manual/python/python-from-mojo/
- https://mojolang.org/releases/
- https://mojolang.org/releases/v0.25.6/
- https://mojolang.org/releases/v1.0.0b1/
- https://mojolang.org/llms.txt
